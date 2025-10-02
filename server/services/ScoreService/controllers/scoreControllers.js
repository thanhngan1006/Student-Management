const Score = require("../models/Score");
const Scoreboard = require("../models/ScoreBoard");
const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const PDFDocument = require('pdfkit');
const path = require('path');
const { Table } = require('pdfkit-table');
const nodemailer = require("nodemailer");
require("dotenv").config();

exports.getStudentScoresGroupedBySemester = async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "ID sinh viên không hợp lệ" });
    }

    // Lấy tất cả scoreboard của sinh viên
    const scoreboards = await Scoreboard.find({ user_id: studentId }).populate({
      path: "subjects.scores",
      model: "scores",
    });

    if (!scoreboards.length) {
      return res.status(404).json({ message: "Không tìm thấy bảng điểm" });
    }

    const semesters = await axios.get("http://localhost:4001/api/semesters");
    const semesterMap = {};
    semesters.data.forEach((sem) => {
      semesterMap[sem._id] = sem.semester_name;
    });

    const result = {};

    for (const sb of scoreboards) {
      const semesterId = sb.semester_id.toString();
      if (!result[semesterId]) {
        result[semesterId] = {
          name: semesterMap[semesterId] || "Không rõ",
          scores: [],
        };
      }

      for (const subj of sb.subjects) {
        const subjectScores = subj.scores.reduce((acc, scoreDoc) => {
          acc[scoreDoc.category] = scoreDoc.score;
          acc.subject_code = scoreDoc.subject;
          acc.subject_id = scoreDoc.subject_id;
          acc.score = acc.score ?? scoreDoc.score;
          return acc;
        }, {});
        result[semesterId].scores.push(subjectScores);
      }
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Lỗi khi lấy điểm sinh viên:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getStudentScoresBySemester = async (req, res) => {
  try {
    const studentId = req.params.id;
    const semesterId = req.query.semester_id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "ID sinh viên không hợp lệ" });
    }

    const filter = { user_id: studentId };
    if (semesterId) {
      if (!mongoose.Types.ObjectId.isValid(semesterId)) {
        return res.status(400).json({ message: "ID học kỳ không hợp lệ" });
      }
      filter.semester_id = semesterId;
    }

    const scoreboards = await Scoreboard.find(filter).populate({
      path: "subjects.scores",
      model: "scores",
    });

    if (!scoreboards.length) {
      return res.status(404).json({ message: "Không tìm thấy bảng điểm" });
    }

    // Lấy danh sách môn học từ API
    const subjectsRes = await axios.get("http://localhost:4001/api/subjects");
    const subjectMap = {};
    subjectsRes.data.forEach((sub) => {
      subjectMap[sub._id] = {
        name: sub.subject_name,
        code: sub.subject_code,
      };
    });

    const allGrades = [];
    let semesterGPA = null;

    for (const sb of scoreboards) {
      semesterGPA = sb.gpa;

      for (const subj of sb.subjects) {
        const subject = subjectMap[subj.subject_id] || {};
        const scoreDetails = subj.scores.reduce((acc, s) => {
          acc[`score_${s.category}`] = s.score;
          return acc;
        }, {});

        allGrades.push({
          subject_code: subject.code || "Không rõ",
          subject_name: subject.name || "Không rõ",
          subject_id: subj.subject_id,
          ...scoreDetails,
          score: subj.subjectGPA,
          semester_id: sb.semester_id,
        });
      }
    }

    res.status(200).json({
      student_id: studentId,
      semester_id: semesterId || null,
      subject_count: allGrades.length,
      semesterGpa: semesterGPA,
      gpa: semesterGPA,
      status: scoreboards[0].status,
      scores: allGrades,
    });
  } catch (error) {
    console.error("Lỗi khi lấy điểm theo học kỳ:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.importStudentScores = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ message: "Vui lòng chọn file CSV" });

  const teacher_id = req.user.id;
  const filePath = req.file.path;
  const records = [];
  const inserted = [];
  const skippedStudents = [];

  const teachingClassesRes = await axios.get(`http://localhost:4000/api/teacher/tdt/${req.user.tdt_id}`);
  const teachingClasses = teachingClassesRes.data || [];

  const allStudentIds = new Set();
  teachingClasses.forEach(cls => {
    cls.class_member.forEach(studentId => {
      allStudentIds.add(studentId.toString());
    });
  });

  // Lấy danh sách môn giáo viên được dạy
  const subjectListRes = await axios.get(`http://localhost:4001/api/departments/${req.user.tdt_id}/subjects`);
  const teacherSubjects = subjectListRes.data || [];
  const teacherSubjectCodes = new Set(teacherSubjects.map((s) => s.subject_code));

  const categoryWeight = {
    "15p": 0.1,
    "1tiet": 0.2,
    giuaky: 0.2,
    cuoiky: 0.5,
  };

  const categoryMapping = {
    "15phut": "15p",
    "15p": "15p",
    "1tiet": "1tiet",
    giuaky: "giuaky",
    cuoiky: "cuoiky",
  };

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => records.push(row))
    .on("end", async () => {
      const session = await mongoose.startSession();
      session.startTransaction();
      let committed = false;
      try {
        for (const row of records) {
          try {
            const { tdt_id, subject_code, score, category, semester_code } =  row;
            const normalizedCategory =  categoryMapping[category.trim()] || category.trim();
            const weight = categoryWeight[normalizedCategory];

            if (!weight) {
              skippedStudents.push({
                tdt_id,
                reason: `Loại điểm không hợp lệ: ${category}`,
              });
              continue;
            }

            if (!teacherSubjectCodes.has(subject_code)) {
              try {
                const subjectRes = await axios.get(
                  `http://localhost:4001/api/subjects/code/${subject_code}`
                );
                const subject = subjectRes.data;
                skippedStudents.push({
                  tdt_id,
                  reason: `Bạn không có quyền nhập điểm cho môn học: ${subject.subject_name || subject_code}`,
                });
              } catch {
                skippedStudents.push({
                  tdt_id,
                  reason: `Bạn không có quyền nhập điểm cho môn học: ${subject_code}`,
                });
              }
              continue;
            }
            
            
            const subjectRes = await axios.get(
              `http://localhost:4001/api/subjects/code/${subject_code}`
            );
            const subject = subjectRes.data;

            const userRes = await axios.get(
              `http://localhost:4003/api/users/tdt/${tdt_id}`
            );
            const user = userRes.data;

            const semesterRes = await axios.get(
              `http://localhost:4001/api/semesters/code/${semester_code}`
            );
            const semester = semesterRes.data;

            if (!semester || !semester._id) {
              console.log(`Không tìm thấy học kỳ với mã: ${semester_code}`);
              skippedStudents.push({
                mssv,
                reason: `Không tìm thấy học kỳ với mã: ${semester_code}`,
              });
              continue;
            }
   
            if (!allStudentIds.has(user._id.toString())) {
              skippedStudents.push({
                tdt_id,
                reason: "Sinh viên không nằm trong các lớp mà bạn đang dạy",
              });
              continue;
            }            

            const existing = await Score.findOne({
              user_id: user._id,
              subject_id: subject._id,
              semester_id: semester._id,
              category: normalizedCategory,
            }).session(session);

            if (existing) {
              skippedStudents.push({
                tdt_id,
                reason: `Điểm ${normalizedCategory} đã tồn tại cho môn ${subject_code}`,
              });
              continue;
            }

            const newScore = new Score({
              user_id: user._id,
              score: parseFloat(score),
              category: normalizedCategory,
              subject_id: subject._id,
              subject: subject.subject_code,
              semester_id: semester._id,
            });

            const savedScore = await newScore.save({ session });
            inserted.push(savedScore);

            // Update scoreboard
            let scoreboard = await Scoreboard.findOne({
              user_id: user._id,
              semester_id: semester._id,
            }).session(session);

            if (!scoreboard) {
              scoreboard = new Scoreboard({
                user_id: user._id,
                semester_id: semester._id,
                subjects: [],
                status: "CHƯA XẾP LOẠI",
                gpa: 0,
              });
            }

            // Find or create subjectEntry
            let subjectEntry = scoreboard.subjects.find(
              (s) => s.subject_id.toString() === subject._id.toString()
            );

            if (!subjectEntry) {
              scoreboard.subjects.push({
                subject_id: subject._id,
                scores: [savedScore._id],
                subjectGPA: 0,
              });
            } else {
              const alreadyIncluded = subjectEntry.scores.some(
                (id) => id.toString() === savedScore._id.toString()
              );
              if (!alreadyIncluded) {
                subjectEntry.scores.push(savedScore._id);
              }
            }
            const currentSubjectEntry = scoreboard.subjects.find(
              (s) => s.subject_id.toString() === subject._id.toString()
            );
            const fullScores = await Score.find({
              _id: { $in: currentSubjectEntry.scores },
            }).session(session);

            const scoreMap = {};
            for (const s of fullScores) {
              if (!scoreMap[s.category]) scoreMap[s.category] = [];
              scoreMap[s.category].push(s.score);
            }

            const hasAll = ["15p", "1tiet", "giuaky", "cuoiky"].every(
              (c) => scoreMap[c]?.length
            );
            if (hasAll) {
              let subjectGPA = 0;
              for (const cat of Object.keys(categoryWeight)) {
                const avg =
                  scoreMap[cat].reduce((a, b) => a + b, 0) /
                  scoreMap[cat].length;
                subjectGPA += avg * categoryWeight[cat];
              }
              currentSubjectEntry.subjectGPA = parseFloat(
                subjectGPA.toFixed(2)
              );
            }

            const validSubjects = scoreboard.subjects.filter(
              (s) => s.subjectGPA > 0
            );
            const semesterGPA =
              validSubjects.length > 0
                ? validSubjects.reduce((sum, s) => sum + s.subjectGPA, 0) /
                  validSubjects.length
                : 0;

            scoreboard.gpa = parseFloat(semesterGPA.toFixed(2));
            scoreboard.status = getStatusFromGPA(scoreboard.gpa);

            scoreboard.markModified("subjects");
            await scoreboard.save({ session });
          } catch (err) {
            console.error(
              `[IMPORT ERROR] tdt_id=${row.tdt_id}: ${err.message}`
            );
            skippedStudents.push({
              tdt_id: row.tdt_id || "Không xác định",
              reason: err.message,
            });
          }
        }
        await session.commitTransaction();
        committed = true;

        if (inserted.length === 0) {
          const allReasons = skippedStudents.map((s) => s.reason);
        
          const allAreWrongClass = allReasons.every((r) =>
            r === "Sinh viên không nằm trong các lớp mà bạn đang dạy"
          );
        
          const allAreInvalidSubject = allReasons.every((r) =>
            r.startsWith("Bạn không có quyền nhập điểm cho môn học")
          );
        
          return res.status(200).json({
            message: allAreWrongClass
              ? "Tải lên thất bại: Tất cả sinh viên đều không thuộc lớp mà bạn đang dạy."
              : allAreInvalidSubject
                ? "Tải lên thất bại: Bạn không có quyền nhập điểm cho các môn học trong file."
                : "Tải lên thất bại: Không có điểm nào được nhập do dữ liệu không hợp lệ.",
            skipped: groupSkippedByReason(skippedStudents),
            warning: true,
            insertedCount: 0,
          });
        } else {
          return res.status(200).json({
            message: `Đã import ${inserted.length} điểm.`,
            insertedCount: inserted.length,
            skipped: groupSkippedByReason(skippedStudents),
          });
        }
        
      } catch (err) {
        if (!committed) {
          await session.abortTransaction();
        }
        console.error("[TRANSACTION ERROR]", err.message);
        return res
          .status(500)
          .json({ message: "Lỗi server khi import điểm", error: err.message });
      } finally {
        session.endSession();
        // Clean up uploaded file
        fs.unlinkSync(filePath);
      }
    });
};

function groupSkippedByReason(skippedList) {
  const grouped = {};
  for (const item of skippedList) {
    const reason = item.reason || "Lý do không xác định";
    if (!grouped[reason]) grouped[reason] = [];
    grouped[reason].push(item.tdt_id || "Không xác định");
  }
  return grouped;
}


function getStatusFromGPA(gpa) {
  if (gpa >= 9) return "XUẤT SẮC";
  if (gpa >= 8) return "GIỎI";
  if (gpa >= 6.5) return "KHÁ";
  if (gpa >= 5) return "TRUNG BÌNH";
  return "YẾU";
}

exports.updateScore = async (req, res) => {
  const { user_id, subject_id, semester_id, scores } = req.body;

  if (
    !user_id ||
    !subject_id ||
    !semester_id ||
    !scores ||
    typeof scores !== "object"
  ) {
    return res
      .status(400)
      .json({ message: "Thiếu dữ liệu hoặc dữ liệu không hợp lệ." });
  }

  try {
    const updateResults = [];
    let totalPoints = 0;
    let subjectScoreCount = 0;

    for (const [category, score] of Object.entries(scores)) {
      let updated = await Score.findOne({
        user_id,
        subject_id,
        semester_id,
        category,
      });

      if (!updated) {
        const subjectRes = await axios.get(
          `http://localhost:4001/api/subjects/${subject_id}`
        );
        const subjectCode = subjectRes.data.subject_code;

        updated = await Score.create({
          user_id,
          subject_id,
          semester_id,
          category,
          score,
          subject: subjectCode,
        });
        updateResults.push(updated);
      } else {
        updated.score = score;
        updated.updatedAt = new Date();
        await updated.save();
        updateResults.push(updated);
      }

      totalPoints += score;
      subjectScoreCount++;
    }

    const fifteenPoints = scores["15p"] || 0;
    const oneTestPoints = scores["1tiet"] || 0;
    const midtermPoints = scores["giuaky"] || 0;
    const finalPoints = scores["cuoiky"] || 0;

    const subjectGPA =
      (fifteenPoints * 0.1 +
      oneTestPoints * 0.2 +
      midtermPoints * 0.2 +
      finalPoints * 0.5).toFixed(2);

    const scoreboard = await Scoreboard.findOne({ user_id, semester_id });
    if (scoreboard) {
      const subject = scoreboard.subjects.find(
        (s) => s.subject_id.toString() === subject_id.toString()
      );
      if (subject) {
        subject.subjectGPA = subjectGPA;

        for (const updatedScore of updateResults) {
          const exists = subject.scores.some(
            (s) => s.toString() === updatedScore._id.toString()
          );
          if (!exists) {
            subject.scores.push(updatedScore._id);
          }
        }

        const totalGPA = scoreboard.subjects.reduce(
          (acc, subj) => acc + subj.subjectGPA,
          0
        );
        scoreboard.gpa = (totalGPA / scoreboard.subjects.length).toFixed(2);
        scoreboard.status = getStatusFromGPA(scoreboard.gpa);
        await scoreboard.save();
      }
    }

    res.json({
      message: "Cập nhật điểm và tính lại GPA thành công",
      updated: updateResults,
    });
  } catch (err) {
    console.error("Lỗi cập nhật điểm:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getStudentScoreboardByTeacher = async (req, res) => {
  const { tdt_id, studentId } = req.params;
  const { semester_id } = req.query;

  if (!semester_id) {
    return res.status(400).json({ message: "Thiếu semester_id trong query" });
  }

  try {
    // 1. Gọi sang education service để lấy MÔN GIÁO VIÊN DẠY
    const subjectRes = await axios.get(`http://localhost:4001/api/departments/${tdt_id}/subjects`);
    const teacherSubjects = subjectRes.data;

    if (!teacherSubjects.length) {
      return res.status(404).json({ message: "Giáo viên không dạy môn nào" });
    }

    // Chỉ lấy 1 môn vì giáo viên chỉ dạy 1 môn
    const subjectTaught = teacherSubjects[0]; // { subject_id, subject_code, subject_name }

    // 2. Lấy scoreboard của học sinh trong kỳ học đó
    const scoreboard = await Scoreboard.findOne({
      user_id: new mongoose.Types.ObjectId(studentId),
      semester_id: new mongoose.Types.ObjectId(semester_id)
    })
      .populate({
        path: "subjects.scores",
        select: "score category createdAt"
      })
      .lean();

    if (!scoreboard) {
      return res.status(404).json({ message: "Không tìm thấy bảng điểm của học sinh trong kỳ này" });
    }

    // 3. Tìm đúng môn giáo viên đang dạy trong bảng điểm của học sinh
    const subjectData = scoreboard.subjects.find(
      s => s.subject_id.toString() === subjectTaught.subject_id
    );

    if (!subjectData) {
      return res.status(404).json({ message: "Học sinh không học môn này trong kỳ này" });
    }

    res.json({
      student_id: scoreboard.user_id,
      semester_id: scoreboard.semester_id,
      subject: {
        subject_id: subjectTaught.subject_id,
        subject_code: subjectTaught.subject_code,
        subject_name: subjectTaught.subject_name,
        subjectGPA: subjectData.subjectGPA,
        scores: subjectData.scores
      }
    });

  } catch (err) {
    console.error("Lỗi khi lấy bảng điểm theo giáo viên:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.exportClassScoresPdf = async (req, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40, autoFirstPage: false });

  try {
    const { classId, semesterId } = req.query;

    if (!classId || !semesterId) {
      return res.status(400).json({ message: 'Thiếu classId hoặc semesterId' });
    }

    const classRes = await axios.get(`http://localhost:4000/api/classes/${classId}/students`);
    const students = classRes.data.students;

    const semesterRes = await axios.get(`http://localhost:4001/api/semesters/${semesterId}`);
    const semester = semesterRes.data;

    const fontPath = path.join(__dirname, '../fonts', 'Roboto-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).json({ message: 'Font không tìm thấy' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=scoreboard.pdf');

    doc.pipe(res);

    doc.font(fontPath);

    for (const student of students) {
      const user = await axios.get(`http://localhost:4003/api/users/${student._id}`);
      const st = user.data;
      doc.addPage();
      doc.fontSize(16).text(`BẢNG ĐIỂM HỌC KỲ ${semester.semester_name}`, { align: 'center' });
      doc.fontSize(14).text(`Họ tên: ${st.name}`, { align: 'left' });
      doc.fontSize(12).text(`Mã học sinh: ${st.tdt_id}`);
      doc.text(`Lớp: ${classRes.data.class_id}`);
      doc.moveDown();

      let scoreRes;
      try {
        scoreRes = await axios.get(`http://localhost:4002/api/students/${student._id}/scores`, {
          params: { semester_id: semesterId }
        });
      } catch (e) {
        doc.text('Học sinh này chưa có điểm.');
        continue; 
      }

      const scores = scoreRes.data.scores || [];

      const headers = [
        'Mã môn', 'Tên môn học', '15 phút', '1 tiết', 'Giữa kỳ', 'Cuối kỳ', 'Trung bình'
      ];

      const startX = 40; 
      let startY = 110; 
      const columnWidths = [60, 150, 60, 60, 60, 60, 70]; 
      const rowHeight = 20;

      headers.forEach((header, index) => {
        doc.rect(startX + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0), startY, columnWidths[index], rowHeight).stroke();
        doc.text(header, startX + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0) + 5, startY + 5);
      });

      startY += rowHeight;

      scores.forEach((item) => {
        const rowData = [
          item.subject_code,
          item.subject_name,
          item.score_15p || '-',
          item.score_1tiet || '-',
          item.score_giuaky || '-',
          item.score_cuoiky || '-',
          item.score || '-'
        ];

        rowData.forEach((data, index) => {
          doc.rect(startX + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0), startY, columnWidths[index], rowHeight).stroke();
          doc.text(data, startX + columnWidths.slice(0, index).reduce((acc, width) => acc + width, 0) + 5, startY + 5);
        });

        startY += rowHeight; 
      });

      doc.moveDown();
      doc.fontSize(12).text(`Điểm trung bình học kỳ: ${scoreRes.data.gpa.toFixed(2) || 'N/A'}`, startX);
      doc.text(`Xếp loại: ${scoreRes.data.status || 'Không rõ'}`, startX);
    }

    doc.end(); 

  } catch (err) {
    console.error('Lỗi export PDF:', err.message);

    if (!res.headersSent) {
      res.status(500).json({ message: 'Xuất PDF thất bại' });
    }
  }
};

exports.exportClassSummaryPdf = async (req, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  try {
    const { classId, semesterId } = req.query;

    if (!classId || !semesterId) {
      return res.status(400).json({ message: 'Thiếu classId hoặc semesterId' });
    }

    const classRes = await axios.get(`http://localhost:4000/api/classes/${classId}/students`);
    const students = classRes.data.students;

    const semesterRes = await axios.get(`http://localhost:4001/api/semesters/${semesterId}`);
    const semester = semesterRes.data;

    const fontPath = path.join(__dirname, '../fonts', 'Roboto-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).json({ message: 'Font không tìm thấy' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=class-summary.pdf');

    doc.pipe(res);
    doc.font(fontPath);

    // Tiêu đề
    doc.fontSize(16).text(`BẢNG TỔNG KẾT LỚP ${classRes.data.class_id} - HỌC KỲ ${semester.semester_name}`, {
      align: 'center',
      underline: true
    });
    doc.moveDown(1.5);

    const headers = ['STT', 'Mã học sinh', 'Họ tên', 'Điểm trung bình', 'Xếp loại'];
    const columnWidths = [40, 100, 180, 120, 80];
    const startX = 40;
    let startY = 100;
    const rowHeight = 25;

    // Vẽ header
    headers.forEach((header, index) => {
      const x = startX + columnWidths.slice(0, index).reduce((acc, w) => acc + w, 0);
      doc.rect(x, startY, columnWidths[index], rowHeight).stroke();
      doc.fontSize(12).text(header, x + 5, startY + 7);
    });

    startY += rowHeight;

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      let userRes;
      try {
        userRes = await axios.get(`http://localhost:4003/api/users/${student._id}`);
      } catch (e) {
        continue; // Bỏ qua nếu không lấy được thông tin user
      }

      let scoreRes;
      try {
        scoreRes = await axios.get(`http://localhost:4002/api/students/${student._id}/scores`, {
          params: { semester_id: semesterId }
        });
      } catch (e) {
        continue; // Bỏ qua nếu không lấy được điểm
      }

      const st = userRes.data;
      const gpa = scoreRes.data.gpa.toFixed(2) || '-';
      const status = scoreRes.data.status || '-';

      const row = [
        i + 1,
        st.tdt_id || '-',
        st.name || '-',
        gpa,
        status
      ];

      if (startY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        startY = 40;
        printHeader();
      }

      row.forEach((data, index) => {
        const x = startX + columnWidths.slice(0, index).reduce((acc, w) => acc + w, 0);
        doc.rect(x, startY, columnWidths[index], rowHeight).stroke();
        doc.fontSize(11).text(data.toString(), x + 5, startY + 7);
      });

      startY += rowHeight;      
    }

    doc.end();

  } catch (err) {
    console.error('Lỗi export PDF:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Xuất PDF thất bại' });
    }
  }
};

exports.exportSubjectScoresPdf = async (req, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  try {
    const { classId, semesterId, teacherId } = req.query;

    if (!classId || !semesterId || !teacherId) {
      return res.status(400).json({ message: 'Thiếu classId, semesterId hoặc teacherId' });
    }

    const fontPath = path.join(__dirname, '../fonts', 'Roboto-Regular.ttf');
    if (!fs.existsSync(fontPath)) {
      return res.status(500).json({ message: 'Font không tìm thấy' });
    }

    const classRes = await axios.get(`http://localhost:4000/api/classes/${classId}/students`);
    const students = classRes.data.students;

    const semesterRes = await axios.get(`http://localhost:4001/api/semesters/${semesterId}`);
    const semester = semesterRes.data;

    const teacherRes = await axios.get(`http://localhost:4001/api/departments/${teacherId}/subjects`);
    const subjectList = teacherRes.data;

    const subjectInfo = subjectList[0];

    if (!Array.isArray(subjectList) || subjectList.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy môn học mà giáo viên đang dạy' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=subject-score-${subjectInfo.subject_code}.pdf`);

    doc.pipe(res);
    doc.font(fontPath);

    const columnWidths = [40, 70, 150, 50, 50, 50, 50, 60];
    const headers = ['STT', 'Mã HS', 'Họ tên', '15 phút', '1 tiết', 'Giữa kỳ', 'Cuối kỳ', 'TB môn'];
    const startX = 20;
    const rowHeight = 25;

    let startY = 80;

    const printTitle = () => {
      doc.fontSize(16).text(
        `BẢNG ĐIỂM MÔN ${subjectInfo.subject_name.toUpperCase()} - LỚP ${classRes.data.class_id}`,
        { align: 'center', underline: true }
      );
      doc.fontSize(14).text(`HỌC KỲ: ${semester.semester_name}`, { align: 'center' });
      doc.moveDown(1);
      startY = doc.y;
    };

    const printHeader = () => {
      headers.forEach((header, index) => {
        const x = startX + columnWidths.slice(0, index).reduce((acc, w) => acc + w, 0);
        doc.rect(x, startY, columnWidths[index], rowHeight).stroke();
        doc.fontSize(12).text(header, x + 5, startY + 7);
      });
      startY += rowHeight;
    };

    printTitle();
    printHeader();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      let userRes;
      try {
        userRes = await axios.get(`http://localhost:4003/api/users/${student._id}`);
      } catch {
        continue;
      }

      const st = userRes.data;

      let scoresRes;
      try {
        scoresRes = await axios.get(`http://localhost:4002/api/students/${student._id}/scores`, {
          params: { semester_id: semesterId }
        });
      } catch {
        continue;
      }

      const scores = scoresRes.data.scores || [];

      // Tìm điểm theo subject_id của giáo viên
      const subjectScore = scores.find(
        sc => sc.subject_id?.toString() === subjectInfo.subject_id?.toString()
      );
      
      if (!subjectScore) {
        continue; // Nếu học sinh không có điểm môn này thì bỏ qua
      }
      
      const row = [
        i + 1,
        st.tdt_id || '-',
        st.name || '-',
        subjectScore?.score_15p ?? '-',
        subjectScore?.score_1tiet ?? '-',
        subjectScore?.score_giuaky ?? '-',
        subjectScore?.score_cuoiky ?? '-',
        subjectScore?.score ?? '-'
      ];

      // Nếu gần cuối trang, tạo trang mới + in header
      if (startY + rowHeight > doc.page.height - 40) {
        doc.addPage();
        startY = 40;
        printHeader();
      }

      row.forEach((data, index) => {
        const x = startX + columnWidths.slice(0, index).reduce((acc, w) => acc + w, 0);
        doc.rect(x, startY, columnWidths[index], rowHeight).stroke();
        doc.fontSize(11).text(data.toString(), x + 5, startY + 7);
      });

      startY += rowHeight;
    }

    doc.end();
  } catch (err) {
    console.error('Lỗi export PDF:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Xuất PDF thất bại' });
    }
  }
};

exports.sendReportCardsToClassParents = async (req, res) => {
  try {
    const classId = req.params.class_id;
    const semesterId = req.query.semester_id;

    if (!classId){
      return res.status(400).json({ message: "ID class không hợp lệ" });
    }
    if (!mongoose.Types.ObjectId.isValid(semesterId)) {
      return res.status(400).json({ message: "ID học kỳ không hợp lệ" });
    }

    const studentsRes = await axios.get(`http://localhost:4000/api/classes/${classId}/students`);
    const students = studentsRes.data.students;

    if (!Array.isArray(students) || !students.length) {
      return res.status(404).json({ message: "Không tìm thấy học sinh trong lớp" });
    }

    const semesterRes = await axios.get(`http://localhost:4001/api/semesters/${semesterId}`);
    const semester = semesterRes.data;

    const results = [];

    for (const student of students) {
      try {
        const studentRes = await axios.get(`http://localhost:4003/api/users/${student._id}`);
        const studentDetail = studentRes.data;

        if (!studentDetail || studentDetail.role !== "student" || !studentDetail.parent_email) {
          results.push({ student: studentDetail?.name || "Không rõ", status: "Thiếu thông tin học sinh hoặc email phụ huynh" });
          continue;
        }

        const teacherRes = await axios.get(`http://localhost:4000/api/students/${student._id}/advisor`);
        const teacher = teacherRes.data;

        const scoresRes = await axios.get(
          `http://localhost:4002/api/students/${student._id}/scores?semester_id=${semesterId}`
        );
        const scoreData = scoresRes.data;

        if (!scoreData || !scoreData.scores?.length) {
          results.push({ student: studentDetail.name, status: "Không có bảng điểm" });
          continue;
        }

        const tableHtml = scoreData.scores
          .map((s, idx) => {
            return `<tr>
              <td>${idx + 1}</td>
              <td>${s.subject_code}</td>
              <td>${s.subject_name}</td>
              <td>${s.score_15p ?? "-"}</td>
              <td>${s.score_1tiet ?? "-"}</td>
              <td>${s.score_giuaky ?? "-"}</td>
              <td>${s.score_cuoiky ?? "-"}</td>
              <td><strong>${s.score ?? "-"}</strong></td>
            </tr>`;
          })
          .join("");

        const html = `
          <h3>Xin chào phụ huynh của học sinh ${studentDetail.name}</h3>
          <p>Đây là bảng điểm học kỳ của con bạn trong học kì ${semester.semester_name}:</p>
          <table border="1" cellpadding="5" cellspacing="0">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã môn</th>
                <th>Môn học</th>
                <th>15 phút</th>
                <th>1 tiết</th>
                <th>Giữa kỳ</th>
                <th>Cuối kỳ</th>
                <th>Điểm trung bình</th>
              </tr>
            </thead>
            <tbody>${tableHtml}</tbody>
          </table>
          <p>Điểm trung bình học kỳ: <strong>${scoreData.gpa?.toFixed(2) || "-"}</strong></p>
          <p>Xếp loại học lực: <strong>${scoreData.status || "-"}</strong></p>
          <p>Người gửi: <strong>GVCN ${teacher.advisor?.name || "Không rõ"}</strong></p>
        `;

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.ADMIN_EMAIL,
            pass: process.env.ADMIN_EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Trường THPT" <${process.env.ADMIN_EMAIL}>`,
          to: studentDetail.parent_email,
          subject: `Bảng điểm học kỳ của ${studentDetail.name}`,
          html,
        });

        results.push({ student: studentDetail.name, status: "Đã gửi email" });
      } catch (innerErr) {
        results.push({ student: student.name, status: `Lỗi: ${innerErr.message}` });
      }
    }

    res.status(200).json({
      message: `Đã xử lý gửi email cho phụ huynh của lớp`,
      result: results,
    });
  } catch (error) {
    console.error("Lỗi gửi bảng điểm theo lớp:", error.message);
    res.status(500).json({ message: "Lỗi server khi gửi bảng điểm theo lớp" });
  }
};

const getCurrentSemester = async () => {
  const res = await axios.get("http://localhost:4001/api/semesters/current");
  return res.data; 
};

const scheduleReportCardSending = async (testMode = false, testDateTime = null) => {
  const semester = await getCurrentSemester();
  if (!semester || !semester._id || !semester.end_date) {
    throw new Error("Dữ liệu học kỳ không hợp lệ.");
  }

  // const endDateUTC = new Date(semester.end_date);
  // const endDateVN = new Date(endDateUTC.getTime() + 7 * 60 * 60 * 1000);
  // endDateVN.setHours(23, 18, 0, 0);

  if (testMode && testDateTime) {
    // Use provided test date/time (in Vietnam time, UTC+7)
    endDateVN = new Date(testDateTime);
    console.log("🧪 Chạy ở chế độ kiểm thử với thời gian:", endDateVN.toLocaleString());
  } else {
    // Normal logic: Use semester.end_date and set to 23:04:00 Vietnam time
    const endDateUTC = new Date(semester.end_date);
    endDateVN = new Date(endDateUTC.getTime() + 7 * 60 * 60 * 1000); // Convert to UTC+7
    endDateVN.setHours(23, 4, 0, 0); // Set to 23:04:00
  }

  const now = new Date();
  const timeUntilSend = endDateVN.getTime() - now.getTime();

  if (timeUntilSend <= 0) {
    console.log("Đã quá thời gian gửi hoặc thời gian không hợp lệ.");
    return;
  }

  console.log(`Hẹn gửi vào ${endDateVN.toLocaleString()} (còn ${Math.floor(timeUntilSend / 1000)} giây)`);

  setTimeout(async () => {
    try {
      console.log("Bắt đầu gửi bảng điểm...");

      const classListRes = await axios.get(`http://localhost:4000/api/classes/khoi`);
      const classes = classListRes.data;
      const semesterId = semester._id;

      for (const classItem of classes) {
        const classId = classItem.class_id;
        if (!classId) {
          continue;
        }
        try {
          await axios.post(`http://localhost:4002/api/students/send-report-card/${classId}?semester_id=${semesterId}`);
          console.log(`Gửi thành công cho lớp ${classId}`);
        } catch (err) {
          if (err.response && err.response.status === 404) {
            console.log(`Lớp ${classItem.name || classId} không có dữ liệu để gửi.`);
            continue;
          }
          console.error(`Lỗi gửi Weil ${classItem.name || classId}: ${err.message}`);
            if (err.response) {
              console.error(`Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
            }
        }
      }

      console.log("Đã gửi bảng điểm cho tất cả lớp.");
    } catch (err) {
      console.error("Lỗi khi gửi bảng điểm:", err.message);
    }
  }, timeUntilSend);
};

exports.sendEmail = async (req, res) => {
  try {
    console.log("API đã nhận yêu cầu gửi bảng điểm.");

    await scheduleReportCardSending(true, "2025-05-09T23:28:00.000+07:00");

    res.status(200).send('Đã lên lịch gửi bảng điểm.');
  } catch (err) {
    console.error("Lỗi trong quá trình gửi bảng điểm:", err.message);
    if (err.response) {
      console.error(`Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`);
    }
    res.status(500).send("Lỗi khi lên lịch gửi bảng điểm.");
  }
};

exports.importBehavior = async (req, res) => {
    const file = req.file;
    const semesterId = req.body.semester_id;

    if (!file || !semesterId) {
      return res.status(400).json({ message: 'Thiếu file hoặc semester_id' });
    }

    const results = [];

    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        let success = 0;
        let failed = 0;

        for (const row of results) {
          const { tdt_id, behavior } = row;

          if (!tdt_id || !behavior) {
            failed++;
            continue;
          }

          try {
            // Gọi sang user-service để lấy user theo tdt_id
            const response = await axios.get(`http://localhost:4003/api/users/tdt/${tdt_id}`);
            const user = response.data;

            // Tìm scoreboard tương ứng
            const scoreboard = await Scoreboard.findOne({
              user_id: user._id,
              semester_id: semesterId,
            });

            if (!scoreboard) {
              failed++;
              continue;
            }

            // Cập nhật behavior
            scoreboard.behavior = behavior;
            await scoreboard.save();
            success++;
          } catch (error) {
            console.error(`Lỗi khi xử lý tdt_id ${tdt_id}:`, error.message);
            failed++;
          }
        }

        fs.unlinkSync(file.path); // Xoá file sau khi xử lý

        return res.status(200).json({
          message: 'Import hành kiểm hoàn tất',
          success,
          failed,
        });
      });
};

// exports.reviewPromotion = async (req, res) => {
//   const { class_id, semester_id, school_year } = req.body;

//   if (!class_id || !semester_id || !school_year) {
//     return res.status(400).json({ message: 'Thiếu class_id, semester_id hoặc school_year' });
//   }

//   try {
//     // Gọi sang class-service để lấy thông tin lớp
//     const classRes = await axios.get(`http://localhost:4000/api/classes/${class_id}`);
//     const classData = classRes.data;

//     const classMembers = classData.class_member;
//     const classIdStr = classData.class_id;

//     const result = {
//       promoted: [],
//       repeated: [],
//     };

//     for (const studentId of classMembers) {
//       const scoreboard = await Scoreboard.findOne({
//         user_id: studentId,
//         semester_id
//       });

//       if (!scoreboard) continue;

//       const gpa = scoreboard.gpa || 0;
//       const behavior = scoreboard.behavior || 'Trung bình';

//       const isRepeat = behavior === 'Yếu' || gpa < 5.0;

//       if (isRepeat) {
//         result.repeated.push({ student_id: studentId, gpa, behavior });

//         // Gọi user-service để ghi nhận học sinh lưu ban
//         await axios.post(`http://localhost:4003/api/users/${studentId}/repeat`, {
//           grade: classIdStr.slice(0, 2),
//           school_year,
//         });
//       } else {
//         result.promoted.push({ student_id: studentId, gpa, behavior });
//       }
//     }

//     return res.status(200).json({
//       message: "Xét duyệt lên lớp thành công",
//       class_id, semester_id, school_year,
//       ...result
//     });

//   } catch (err) {
//     console.error("Lỗi xét duyệt lên lớp:", err.message);
//     return res.status(500).json({ message: "Lỗi server" });
//   }
// };

exports.reviewPromotion = async (req, res) => {
  const { class_id, school_year } = req.body;

  // Validate inputs
  if (!class_id || !school_year) {
    return res.status(400).json({ message: 'Thiếu class_id hoặc school_year' });
  }

  if (!/^\d{4}-\d{4}$/.test(school_year)) {
    return res.status(400).json({ message: 'school_year phải có định dạng YYYY-YYYY' });
  }

  try {
    // Fetch semesters from separate service
    const semesterRes = await axios.get(`http://localhost:4001/api/semesters/semester?school_year=${school_year}`);
    const semesters = semesterRes.data;

    if (semesters.length !== 2) {
      return res.status(400).json({
        message: `Cần đúng 2 kỳ học cho năm học ${school_year}, tìm thấy ${semesters.length} kỳ`
      });
    }

    const semesterIds = semesters.map(sem => sem._id);

    // Fetch class data
    const classRes = await axios.get(`http://localhost:4000/api/classes/${class_id}`);
    const classData = classRes.data;

    const classMembers = classData.class_member;
    const classIdStr = classData.class_id;

    const result = { promoted: [], repeated: [] };

    for (const studentId of classMembers) {
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        console.warn(`Invalid student_id: ${studentId}`);
        continue;
      }

      // Fetch scoreboards for both semesters
      const scoreboards = await Scoreboard.find({
        user_id: studentId,
        semester_id: { $in: semesterIds }
      });

      // Check if student has scoreboards for both semesters
      if (scoreboards.length !== 2) {
        result.repeated.push({
          student_id: studentId,
          gpa: 0,
          behavior: 'N/A',
          reason: `Thiếu bảng điểm cho ${2 - scoreboards.length} kỳ`
        });
        await axios.post(`http://localhost:4003/api/users/${studentId}/repeat`, {
          grade: classIdStr.slice(0, 2),
          school_year
        });
        continue;
      }

      // Check GPA and behavior for both semesters
      let isEligible = true;
      let studentGpa = Infinity;
      let studentBehavior = 'Tốt';

      for (const scoreboard of scoreboards) {
        const gpa = scoreboard.gpa || 0;
        const behavior = scoreboard.behavior || 'Trung bình';

        if (gpa < 5.0 || behavior === 'Yếu') {
          isEligible = false;
        }

        // Track minimum GPA and worst behavior for reporting
        studentGpa = Math.min(studentGpa, gpa);
        if (['Yếu', 'Trung bình', 'Khá', 'Tốt'].indexOf(studentBehavior) > ['Yếu', 'Trung bình', 'Khá', 'Tốt'].indexOf(behavior)) {
          studentBehavior = behavior;
        }
      }

      if (isEligible) {
        result.promoted.push({
          student_id: studentId,
          gpa: studentGpa,
          behavior: studentBehavior
        });
      } else {
        result.repeated.push({
          student_id: studentId,
          gpa: studentGpa,
          behavior: studentBehavior,
          reason: studentBehavior === 'Yếu' ? 'Hạnh kiểm Yếu ở ít nhất một kỳ' : 'GPA dưới 5.0 ở ít nhất một kỳ'
        });
        await axios.post(`http://localhost:4003/api/users/${studentId}/repeat`, {
          grade: classIdStr.slice(0, 2),
          school_year
        });
      }
    }

    return res.status(200).json({
      message: 'Xét duyệt lên lớp thành công',
      class_id,
      school_year,
      ...result
    });
  } catch (err) {
    console.error('Lỗi xét duyệt lên lớp:', err.message);
    return res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getLatestScoreboardByStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const scoreboard = await Scoreboard.findOne({ user_id: studentId })
      .sort({ createdAt: -1 }) // bảng điểm mới nhất
      .select('gpa behavior') // chỉ trả về gpa & behavior & semester

    if (!scoreboard) {
      return res.status(404).json({ message: 'Không tìm thấy bảng điểm' });
    }

    res.status(200).json(scoreboard);

  } catch (err) {
    console.error('[ERROR] Lấy bảng điểm mới nhất:', err.message);
    res.status(500).json({ message: 'Lỗi server khi lấy bảng điểm' });
  }
};


exports.getStatusAndBehavior = async (req, res) => {
  try {
    const { user_id, semester_ids } = req.query;

    if (!user_id || !semester_ids) {
      return res.status(400).json({ message: "Thiếu user_id hoặc semester_ids" });
    }

    const semesterIdsArray = semester_ids
      .split(",")
      .filter((id) => id.trim() !== ""); // Remove empty entries
    if (semesterIdsArray.length === 0) {
      return res.status(400).json({ message: "Danh sách semester_ids không hợp lệ" });
    }

    const scores = await Scoreboard.find({
      user_id,
      semester_id: { $in: semesterIdsArray }
    }).lean(); // Use lean() for better performance

    if (!scores || scores.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy điểm cho học sinh này" });
    }

    res.status(200).json(scores);
  } catch (error) {
    console.error("Lỗi khi lấy điểm học sinh:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};
