const Semester = require("../models/Semester");
const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');

exports.getAllSemesters = async (req, res) => {
    const semesters = await Semester.find();
    res.status(200).json(semesters);
};

exports.importSemesters = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng tải lên file CSV hoặc XLSX' });
      }
  
      const ext = req.file.originalname.split('.').pop();
      let data = [];
  
      if (ext === 'csv') {
        const rows = [];
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', row => rows.push(row))
          .on('end', async () => {
            await saveSemesters(rows, res);
          });
      } else if (ext === 'xlsx') {
        const workbook = xlsx.readFile(req.file.path);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = xlsx.utils.sheet_to_json(sheet);
        await saveSemesters(data, res);
      } else {
        return res.status(400).json({ message: 'Định dạng file không hợp lệ' });
      }
    } catch (err) {
      console.error('Lỗi import semester:', err.message);
      res.status(500).json({ message: 'Lỗi server khi import semester' });
    }
  };
  
  async function saveSemesters(data, res) {
    const inserted = [];
  
    for (const s of data) {
      if (!s.semester_name || !s.start_date || !s.end_date) continue;
  
      const exist = await Semester.findOne({ semester_name: s.semester_name });
      if (exist) continue;
  
      const semester = new Semester({
        semester_name: s.semester_name,
        semester_code: s.semester_code,
        start_date: new Date(s.start_date),
        end_date: new Date(s.end_date)
      });
  
      const saved = await semester.save();
      inserted.push(saved);
    }
  
    res.status(200).json({
      message: `Đã thêm ${inserted.length} kỳ học`,
      inserted
    });
  }

  exports.getSemesterByCode = async (req, res) => {
    try {
      const semester = await Semester.findOne({ semester_code: req.params.code });
  
      if (!semester) {
        return res.status(404).json({ message: 'Không tìm thấy học kỳ' });
      }
  
      res.status(200).json(semester);
    } catch (err) {
      console.error('[ERROR] Lấy semester theo code:', err.message);
      res.status(500).json({ message: 'Lỗi server khi lấy học kỳ' });
    }
  };
  
  exports.getSemesterById = async (req, res) => {
    try {
      const semester = await Semester.findById(req.params.id);
  
      if (!semester) {
        return res.status(404).json({ message: 'Không tìm thấy học kỳ' });
      }
  
      res.status(200).json(semester);
    } catch (err) {
      console.error('[ERROR] Lấy semester theo _id:', err.message);
      res.status(500).json({ message: 'Lỗi server khi lấy học kỳ' });
    }
  };
  
  exports.getCurrentSemester = async (req, res) => {
    try {
      const now = new Date();
  
      const currentSemester = await Semester.findOne({
        start_date: { $lte: now },
        end_date: { $gte: now }
      });
  
      if (!currentSemester) {
        return res.status(404).json({ message: "Không có học kỳ hiện tại" });
      }
  
      res.status(200).json(currentSemester);
    } catch (error) {
      console.error("Lỗi khi lấy học kỳ hiện tại:", error.message);
      res.status(500).json({ message: "Lỗi server" });
    }
  };

exports.getSemestersByYears = async (req, res) => {
  try {
    const { years } = req.body; 

    if (!Array.isArray(years) || years.length === 0) {
      return res.status(400).json({ message: "Danh sách năm học không hợp lệ" });
    }

    const allSemesters = await Semester.find().sort({ start_date: 1 });

    const matchedSemesters = allSemesters.filter((sem) => {
      if (!sem.semester_code || sem.semester_code.length < 5) return false;

      const yearStart = `20${sem.semester_code.slice(0, 2)}`; // "24" → "2024"
      const yearEnd = `20${sem.semester_code.slice(2, 4)}`;   // "25" → "2025"
      const yearRange = `${yearStart}-${yearEnd}`;

      return years.includes(yearRange);
    });

    if (matchedSemesters.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy học kỳ phù hợp với năm học" });
    }

    res.status(200).json({ semesters: matchedSemesters });
  } catch (error) {
    console.error("Lỗi khi lấy học kỳ theo năm học:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getSemestersBySchoolYear = async (req, res) => {
  try {
    const { school_year } = req.query;

    // Validate school_year
    if (!school_year || !/^\d{4}-\d{4}$/.test(school_year)) {
      return res.status(400).json({ message: 'school_year phải có định dạng YYYY-YYYY' });
    }

    // Query semesters by semester_name
    const semesters = await Semester.find({
      semester_name: { $regex: school_year, $options: 'i' }
    }).select('_id semester_name semester_code start_date end_date');

    res.status(200).json(semesters);
  } catch (err) {
    console.error('[EducationService LỖI] Lỗi lấy semesters:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getSchoolYear = async (req, res) => {
  try {
    const schoolYears = await Semester.distinct("school_year").sort({ school_year: -1 });
    if (!schoolYears || schoolYears.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy năm học nào." });
    }
    res.status(200).json(schoolYears);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách năm học:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getSemesterBySchoolYear = async (req, res) => {
  try {
    const { school_year } = req.query;
    const query = school_year ? { school_year } : {};
    const semesters = await Semester.find(query);
    res.status(200).json(semesters);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách kỳ học:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};