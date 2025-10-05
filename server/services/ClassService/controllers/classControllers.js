// const Class = require("../models/Class");
// const Approval = require("../models/Approval");
// const mongoose = require("mongoose");
// const axios = require("axios");
// const fs = require("fs");
// const csv = require("csv-parser");
// require("dotenv").config();

// exports.getClassStudents = async (req, res) => {
//   try {
//     const classId = req.params.id;

//     const classDoc = await Class.findOne({ class_id: classId });
//     if (!classDoc) {
//       return res
//         .status(404)
//         .json({ message: `Không tìm thấy lớp với mã ${classId}` });
//     }

//     const studentIds = classDoc.class_member;
//     if (!studentIds || studentIds.length === 0) {
//       return res.status(200).json({
//         class_id: classDoc.class_id,
//         class_name: classDoc.class_name,
//         students: [],
//       });
//     }

//     // Gọi sang UserService để lấy thông tin các user
//     const response = await axios.post("http://localhost:4003/api/users/batch", {
//       ids: studentIds,
//     });

//     res.status(200).json({
//       class_id: classDoc.class_id,
//       class_name: classDoc.class_name,
//       students: response.data, // nên đảm bảo response.data là mảng user
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy học sinh lớp:", error.message);
//     res
//       .status(500)
//       .json({ message: "Lỗi server hoặc gọi user service thất bại" });
//   }
// };

// exports.getAdvisorByClassId = async (req, res) => {
//   try {
//     const { classId } = req.params;

//     const classDoc = await Class.findOne({ class_id: classId });
//     if (!classDoc) {
//       return res.status(404).json({ message: "Không tìm thấy lớp" });
//     }

//     const advisorId = classDoc.class_teacher;
//     if (!advisorId) {
//       return res.status(404).json({ message: "Lớp này chưa có giáo viên" });
//     }

//     const advisorRes = await axios.get(
//       `http://localhost:4003/api/users/${advisorId}`
//     );
//     const advisor = advisorRes.data;

//     res.status(200).json({
//       advisor: {
//         id: advisor._id,
//         name: advisor.name,
//         email: advisor.email,
//         role: advisor.role,
//         phone_number: advisor.phone_number,
//         address: advisor.address,
//       },
//     });
//   } catch (error) {
//     // console.error("[ClassService] Lỗi lấy thông tin giáo viên:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getClassesByTeacher = async (req, res) => {
//   try {
//     const teacherId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(teacherId)) {
//       return res.status(400).json({ message: "ID giáo viên không hợp lệ" });
//     }

//     const classDoc = await Class.findOne({ class_teacher: teacherId });
//     if (!classDoc) {
//       return res
//         .status(404)
//         .json({ message: "Không tìm thấy lớp của giáo viên" });
//     }

//     res.status(200).json({
//       class: {
//         class_id: classDoc.class_id,
//         class_name: classDoc.class_name,
//         students: classDoc.class_member,
//       },
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách lớp của giáo viên:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getClassByStudentId = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const foundClass = await Class.findOne({ class_member: userId });
//     if (!foundClass) {
//       return res
//         .status(404)
//         .json({ message: "Không tìm thấy lớp học của học sinh này" });
//     }

//     res.status(200).json({
//       class: {
//         class_id: foundClass.class_id,
//         class_name: foundClass.class_name,
//       },
//     });
//   } catch (err) {
//     console.error("Lỗi tìm lớp theo học sinh:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.removeAdvisorFromClass = async (req, res) => {
//   const updated = await Class.findByIdAndUpdate(
//     req.params.classId,
//     { $unset: { class_teacher: "" } },
//     { new: true }
//   );
//   res.json({ message: "Đã gỡ giáo viên khỏi lớp", class: updated });
// };

// exports.getClassByTeacherId = async (req, res) => {
//   const classFound = await Class.findOne({
//     class_teacher: req.params.teacherId,
//   });
//   if (!classFound)
//     return res
//       .status(404)
//       .json({ message: "Không tìm thấy lớp có giáo viên này" });
//   res.json(classFound);
// };

// exports.getAdvisorOfStudent = async (req, res) => {
//   try {
//     const studentId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(studentId)) {
//       return res.status(400).json({ message: "ID học sinh không hợp lệ" });
//     }

//     const classDoc = await Class.findOne({ class_member: studentId });

//     if (!classDoc) {
//       return res
//         .status(404)
//         .json({ message: "Không tìm thấy lớp chứa học sinh này" });
//     }

//     const advisorId = classDoc.class_teacher;

//     const advisorResponse = await axios.get(
//       `http://localhost:4003/api/users/${advisorId}`
//     );
//     const advisor = advisorResponse.data;

//     res.status(200).json({
//       class: {
//         id: classDoc.class_id,
//         name: classDoc.class_name,
//       },
//       advisor: {
//         id: advisor._id,
//         name: advisor.name,
//         email: advisor.email,
//         role: advisor.role,
//         phone_number: advisor.phone_number,
//         address: advisor.address,
//       },
//     });
//   } catch (error) {
//     console.error("Lỗi khi lấy thông tin giáo viên:", error.message);
//     res
//       .status(500)
//       .json({ message: "Lỗi server hoặc kết nối đến UserService thất bại" });
//   }
// };

// exports.addClass = async (req, res) => {
//   try {
//     const { class_id } = req.body;

//     if (!class_id) {
//       return res.status(400).json({ message: "Thiếu class_id" });
//     }

//     // Tự động gán class_name dựa theo class_id
//     let class_name = "Không rõ";
//     let graduation_year = null;
//     const currentYear = new Date().getFullYear();

//     if (class_id.includes("12")) {
//       class_name = "Khối 12";
//       graduation_year = currentYear + 1;
//     } else if (class_id.includes("11")) {
//       class_name = "Khối 11";
//       graduation_year = currentYear + 2;
//     } else if (class_id.includes("10")) {
//       class_name = "Khối 10";
//       graduation_year = currentYear + 3;
//     }

//     const is_graduated =
//       graduation_year !== null && currentYear >= graduation_year;

//     // Kiểm tra trùng lặp class_id
//     const existing = await Class.findOne({ class_id });
//     if (existing) {
//       return res.status(409).json({ message: "Lớp đã tồn tại" });
//     }

//     const newClass = new Class({
//       class_id,
//       class_name,
//       graduation_year,
//       is_graduated,
//     });

//     await newClass.save();

//     res.status(201).json({
//       message: "Thêm lớp thành công",
//       class: newClass,
//     });
//   } catch (err) {
//     console.error("Lỗi khi thêm lớp:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getClassById = async (req, res) => {
//   try {
//     const { class_id } = req.params;

//     const foundClass = await Class.findOne({ class_id });

//     if (!foundClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp" });
//     }

//     res.status(200).json({ class: foundClass });
//   } catch (err) {
//     console.error("Lỗi khi lấy lớp:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getClassSizeById = async (req, res) => {
//   try {
//     const { class_id } = req.query;

//     if (!class_id) {
//       return res.status(400).json({ message: "Thiếu class_id" });
//     }

//     const classDoc = await Class.findOne({ class_id });

//     if (!classDoc) {
//       return res
//         .status(404)
//         .json({ message: "Không tìm thấy lớp với class_id đã cho" });
//     }

//     const totalStudents = classDoc.class_member.length;

//     res.status(200).json({
//       class_id: classDoc.class_id,
//       class_name: classDoc.class_name,
//       totalStudents,
//     });
//   } catch (error) {
//     console.error("[ClassService LỖI] [Lỗi lấy sĩ số lớp]:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.importStudentsToClass = async (req, res) => {
//   try {
//     const { classId } = req.params;
//     if (!req.file)
//       return res.status(400).json({ message: "Vui lòng tải lên file CSV" });

//     const emails = [];

//     fs.createReadStream(req.file.path)
//       .pipe(csv())
//       .on("data", (row) => {
//         if (row.email) emails.push(row.email.trim());
//       })
//       .on("end", async () => {
//         if (emails.length === 0)
//           return res.status(400).json({ message: "File không có email nào" });

//         // Gửi sang UserService để lấy danh sách _id
//         const userRes = await axios.post(
//           "http://localhost:4003/api/users/get-ids-by-emails",
//           {
//             emails,
//           }
//         );

//         const userIds = userRes.data.userIds;
//         if (!Array.isArray(userIds) || userIds.length === 0)
//           return res.status(400).json({
//             message: "Không tìm thấy học sinh nào từ danh sách email",
//           });

//         const targetClass = await Class.findOne({ class_id: classId });
//         if (!targetClass) {
//           return res.status(404).json({ message: "Không tìm thấy lớp học" });
//         }

//         if (req.user.id !== targetClass.class_teacher.toString()) {
//           return res.status(403).json({
//             message: "Bạn không có quyền import học sinh vào lớp này",
//           });
//         }

//         const existingIds = new Set(
//           (targetClass.class_member || []).map((id) => id.toString())
//         );
//         const alreadyInClass = [];
//         const toAdd = [];

//         userIds.forEach((id, i) => {
//           if (existingIds.has(id)) {
//             alreadyInClass.push(emails[i]);
//           } else {
//             toAdd.push(id);
//           }
//         });

//         const updatedClass = await Class.findOneAndUpdate(
//           { class_id: classId }, // tìm theo class_id thay vì _id
//           { $addToSet: { class_member: { $each: userIds } } },
//           { new: true }
//         );

//         res.status(200).json({
//           message: `Đã thêm ${userIds.length} học sinh vào lớp`,
//           addedCount: toAdd.length,
//           alreadyInClass,
//           updatedClass,
//         });
//       });
//   } catch (error) {
//     console.error("[Import Students ERROR]", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.removeStudentFromClass = async (req, res) => {
//   try {
//     const { classId, userId } = req.params;

//     const updatedClass = await Class.findOneAndUpdate(
//       { class_id: classId },
//       { $pull: { class_member: userId } }, // phải là class_member
//       { new: true }
//     );

//     if (!updatedClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp học" });
//     }

//     res
//       .status(200)
//       .json({ message: "Đã xoá học sinh khỏi lớp", class: updatedClass });
//   } catch (error) {
//     console.error("Lỗi khi xoá học sinh khỏi lớp:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.addStudentToClass = async (req, res) => {
//   try {
//     const { classId } = req.params;
//     const { email } = req.body;

//     // Gọi sang UserService để lấy userId từ email
//     const userServiceURL = "http://localhost:4003/api/users/get-ids-by-emails";
//     const userResponse = await axios.post(userServiceURL, {
//       emails: [email],
//     });

//     const userIds = userResponse.data.userIds;
//     if (userIds.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Email không tồn tại trong hệ thống" });
//     }

//     const userId = userIds[0];

//     const existingClass = await Class.findOne({ class_id: classId });

//     if (req.user.id !== existingClass.class_teacher.toString()) {
//       return res
//         .status(403)
//         .json({ message: "Bạn không có quyền thêm học sinh vào lớp này" });
//     }

//     if (existingClass.class_member.includes(userId)) {
//       return res.status(409).json({ message: "Học sinh đã tồn tại trong lớp" });
//     }

//     // Thêm userId vào class_member nếu chưa có
//     const updatedClass = await Class.findOneAndUpdate(
//       { class_id: classId },
//       { $addToSet: { class_member: userId } },
//       { new: true }
//     );

//     if (!updatedClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp học" });
//     }

//     res.status(200).json({
//       message: "Đã thêm học sinh vào lớp",
//       class: updatedClass,
//     });
//   } catch (error) {
//     console.error("[Add Student ERROR]", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.addAdvisorToClass = async (req, res) => {
//   try {
//     const { classId } = req.params;
//     const { email } = req.body;

//     const userServiceURL = "http://localhost:4003/api/users/get-ids-by-emails";
//     const userResponse = await axios.post(userServiceURL, {
//       emails: [email],
//     });

//     const userIds = userResponse.data.userIds;
//     if (!userIds || userIds.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Email giáo viên không tồn tại trong hệ thống" });
//     }

//     const advisorId = userIds[0];

//     const classWithSameTeacher = await Class.findOne({
//       class_teacher: advisorId,
//       class_id: { $ne: classId }, // bỏ qua lớp hiện tại (nếu đang cập nhật)
//     });

//     if (classWithSameTeacher) {
//       return res.status(409).json({
//         message: `Giáo viên đã là chủ nhiệm lớp ${classWithSameTeacher.class_id}`,
//       });
//     }

//     const existingClass = await Class.findOne({ class_id: classId });

//     if (!existingClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp học" });
//     }

//     if (
//       existingClass.class_teacher &&
//       existingClass.class_teacher.toString() === advisorId
//     ) {
//       return res
//         .status(409)
//         .json({ message: "giáo viên đã được gán cho lớp này" });
//     }
//     existingClass.class_teacher = advisorId;
//     await existingClass.save();

//     try {
//       await axios.put(
//         `http://localhost:4003/api/users/${advisorId}/add-homeroom-teacher`
//       );
//     } catch (err) {
//       console.warn(
//         "Không thể cập nhật advisor_type:",
//         err.response?.data || err.message
//       );
//     }

//     res.status(200).json({
//       message: "Đã thêm giáo viên vào lớp",
//       class: existingClass,
//     });
//   } catch (error) {
//     console.error("[Add Advisor ERROR]", error.message);
//     res.status(500).json({ message: "Lỗi server khi thêm giáo viên" });
//   }
// };

// exports.changeAdvisorOfClass = async (req, res) => {
//   try {
//     const { classId } = req.params;
//     const { email } = req.body;

//     const userServiceURL = "http://localhost:4003/api/users/get-ids-by-emails";
//     const userResponse = await axios.post(userServiceURL, {
//       emails: [email],
//     });

//     const userIds = userResponse.data.userIds;
//     if (!userIds || userIds.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Email giáo viên không tồn tại trong hệ thống" });
//     }

//     const newAdvisorId = userIds[0];

//     const existingClass = await Class.findOne({ class_id: classId });
//     if (!existingClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp học" });
//     }

//     const currentAdvisorId = existingClass.class_teacher?.toString();

//     if (currentAdvisorId === newAdvisorId) {
//       return res.status(409).json({ message: "Đây đã là giáo viên hiện tại" });
//     }

//     const classWithSameTeacher = await Class.findOne({
//       class_teacher: newAdvisorId,
//       class_id: { $ne: classId },
//     });

//     if (classWithSameTeacher) {
//       return res.status(409).json({
//         message: `Giáo viên đã là chủ nhiệm lớp ${classWithSameTeacher.class_id}`,
//       });
//     }

//     if (currentAdvisorId) {
//       try {
//         await axios.put(
//           `http://localhost:4003/api/users/${currentAdvisorId}/remove-homeroom-teacher`
//         );
//       } catch (err) {
//         console.warn(
//           "Không thể cập nhật advisor_type giáo viên cũ:",
//           err?.response?.data || err.message
//         );
//       }
//     }

//     try {
//       await axios.put(
//         `http://localhost:4003/api/users/${newAdvisorId}/add-homeroom-teacher`
//       );
//     } catch (err) {
//       console.warn(
//         "Không thể cập nhật advisor_type giáo viên mới:",
//         err?.response?.data || err.message
//       );
//     }

//     existingClass.class_teacher = newAdvisorId;
//     await existingClass.save();

//     res.status(200).json({
//       message: "Đã cập nhật giáo viên lớp thành công",
//       class: existingClass,
//     });
//   } catch (error) {
//     console.error("[Edit Advisor ERROR]", error.message);
//     res.status(500).json({ message: "Lỗi server khi cập nhật giáo viên" });
//   }
// };

// exports.getAllClasses = async (req, res) => {
//   try {
//     const classes = await Class.find(
//       {},
//       "class_id class_name class_member class_teacher"
//     );
//     res.status(200).json(classes);
//   } catch (err) {
//     console.error("Lỗi khi lấy danh sách lớp:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.assignTeacherToClass = async (req, res) => {
//   try {
//     const { class_id, teacher_id } = req.body;

//     const updated = await Class.findOneAndUpdate(
//       { class_id },
//       { class_teacher: teacher_id },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: "Không tìm thấy lớp" });
//     }

//     try {
//       await axios.put(
//         `http://localhost:4003/api/users/${teacher_id}/add-homeroom-teacher`
//       );
//     } catch (err) {
//       console.warn(
//         "Không thể cập nhật advisor_type:",
//         err.response?.data || err.message
//       );
//     }

//     res.status(200).json({
//       message: "Gán giáo viên cho lớp thành công",
//       class: updated,
//     });
//   } catch (error) {
//     console.error("Lỗi khi gán giáo viên:", error.message);
//     res.status(500).json({ message: "Lỗi server khi gán giáo viên cho lớp" });
//   }
// };

// exports.adminDeleteStudentFromClass = async (req, res) => {
//   const studentId = req.params.studentId;

//   try {
//     const classDoc = await Class.findOne({ class_member: studentId });

//     if (!classDoc)
//       return res.status(200).json({ message: "Học sinh không thuộc lớp nào" });

//     classDoc.class_member = classDoc.class_member.filter(
//       (id) => id.toString() !== studentId
//     );
//     await classDoc.save();

//     res.status(200).json({
//       message: "Đã xoá học sinh khỏi lớp",
//       classId: classDoc.class_id,
//     });
//   } catch (error) {
//     console.error("Lỗi khi xóa học sinh khỏi lớp:", error.message);
//     res.status(500).json({ message: "Không thể xóa học sinh khỏi lớp" });
//   }
// };

// exports.addSubjectTeacherToClass = async (req, res) => {
//   try {
//     const { user_id } = req.body;
//     const { classId } = req.params;

//     if (!user_id) {
//       return res.status(400).json({ message: "Thiếu user_id giáo viên" });
//     }

//     // Tìm lớp học
//     const classData = await Class.findById(classId);
//     if (!classData) {
//       return res.status(404).json({ message: "Không tìm thấy lớp học" });
//     }

//     // Kiểm tra xem giáo viên đã có trong danh sách chưa
//     if (classData.subject_teacher.some((u) => u.toString() === user_id)) {
//       return res
//         .status(400)
//         .json({ message: "Giáo viên đã tồn tại trong lớp này" });
//     }

//     // Thêm giáo viên vào subject_teacher
//     classData.subject_teacher.push(user_id);
//     await classData.save();

//     return res
//       .status(200)
//       .json({ message: "Thêm giáo viên vào lớp thành công" });
//   } catch (error) {
//     console.error("[Add Subject Teacher ERROR]", error.message);
//     return res
//       .status(500)
//       .json({ message: "Lỗi server khi thêm giáo viên vào lớp" });
//   }
// };

// exports.getClassesByTdtId = async (req, res) => {
//   const { tdt_id } = req.params;

//   try {
//     const user = await axios.get(
//       `http://localhost:4003/api/users/tdt/${tdt_id}`
//     );
//     const userId = user.data._id;

//     if (!userId) {
//       return res
//         .status(404)
//         .json({ message: "Không tìm thấy người dùng với tdt_id này" });
//     }

//     const classes = await Class.find({
//       subject_teacher: userId,
//     });
//     return res.status(200).json(classes);
//   } catch (error) {
//     console.error("[ERROR] Lấy danh sách lớp theo tdt_id:", error.message);
//     return res.status(500).json({ message: "Lỗi server khi lấy lớp học" });
//   }
// };

// exports.addClassForTeacher = async (req, res) => {
//   const { class_id, teacher_id } = req.body;

//   if (!class_id || !teacher_id) {
//     return res.status(400).json({ message: "Thiếu class_id hoặc teacher_id" });
//   }

//   try {
//     // 1. Lấy thông tin giáo viên từ UserService
//     const teacherRes = await axios.get(
//       `http://localhost:4003/api/users/${teacher_id}`
//     );
//     const teacher = teacherRes.data;
//     const tdt_id = teacher.tdt_id;

//     // 2. Lấy danh sách môn giáo viên dạy từ DepartmentService
//     const subjectRes = await axios.get(
//       `http://localhost:4001/api/departments/${tdt_id}/subjects`
//     );
//     const teacherSubjects = subjectRes.data; // [{ subject_code, subject_id }]

//     if (!Array.isArray(teacherSubjects)) {
//       return res
//         .status(400)
//         .json({ message: "Không lấy được danh sách môn học của giáo viên" });
//     }

//     // 3. Lấy thông tin lớp từ ClassService (service hiện tại)
//     const classRes = await axios.get(`http://localhost:4000/api/${class_id}`);
//     const foundClass = classRes.data.class;

//     if (!foundClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp" });
//     }

//     // 4. Lấy danh sách giáo viên hiện tại đã dạy lớp đó
//     const currentTeacherIds = foundClass.subject_teacher || [];

//     // 5. Gọi đến UserService để lấy danh sách thông tin giáo viên hiện tại
//     const existingTeachers = await Promise.all(
//       currentTeacherIds.map((id) =>
//         axios
//           .get(`http://localhost:4003/api/users/${id}`)
//           .then((res) => res.data)
//       )
//     );

//     // 6. Gọi đến DepartmentService để lấy danh sách môn của từng giáo viên hiện tại
//     const existingSubjectsMap = new Map(); // key: subject_code, value: { subject_name, teacher_id }

//     for (const t of existingTeachers) {
//       const deptRes = await axios.get(
//         `http://localhost:4001/api/departments/${t.tdt_id}/subjects`
//       );
//       const subjects = deptRes.data;
//       subjects.forEach((sub) => {
//         if (!existingSubjectsMap.has(sub.subject_code)) {
//           existingSubjectsMap.set(sub.subject_code, {
//             subject_name: sub.subject_name,
//             tdt_id: t.tdt_id,
//           });
//         }
//       });
//     }

//     // 7. Kiểm tra xem có môn nào trùng không
//     const conflicts = teacherSubjects.filter((sub) =>
//       existingSubjectsMap.has(sub.subject_code)
//     );
//     if (conflicts.length > 0) {
//       const messages = conflicts.map((conflict) => {
//         const existing = existingSubjectsMap.get(conflict.subject_code);
//         return `Môn học "${existing.subject_name}" của lớp "${class_id}" đã có người dạy (teacher_id: ${existing.tdt_id})`;
//       });

//       return res.status(400).json({ message: messages.join("; ") });
//     }

//     const objectIdTeacher = new mongoose.Types.ObjectId(teacher_id);

//     const updatedClass = await Class.findOneAndUpdate(
//       { class_id: class_id }, // dùng class_id (string)
//       { $addToSet: { subject_teacher: objectIdTeacher } },
//       { new: true }
//     );

//     res.status(200).json({
//       message: "Gán giáo viên vào lớp thành công",
//       updatedClass,
//     });
//   } catch (err) {
//     console.error("Lỗi khi phân công giáo viên:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.removeTeacherFromClass = async (req, res) => {
//   const { class_id, teacher_id } = req.body;

//   if (!class_id || !teacher_id) {
//     return res.status(400).json({ message: "Thiếu class_id hoặc teacher_id" });
//   }

//   try {
//     const updatedClass = await Class.findOneAndUpdate(
//       { _id: class_id },
//       // { $pull: { subject_teacher: teacher_id } },
//       { $pull: { subject_teacher: new mongoose.Types.ObjectId(teacher_id) } },
//       { new: true }
//     );

//     if (!updatedClass) {
//       return res.status(404).json({ message: "Không tìm thấy lớp học" });
//     }

//     return res.status(200).json({
//       message: "Đã xóa giáo viên khỏi lớp thành công",
//       data: updatedClass,
//     });
//   } catch (error) {
//     console.error("[LỖI] Xóa giáo viên khỏi lớp:", error.message);
//     return res
//       .status(500)
//       .json({ message: "Lỗi server khi xóa giáo viên khỏi lớp" });
//   }
// };

// exports.getSubjectsOfClass = async (req, res) => {
//   try {
//     const classId = req.params.classId;

//     // Lấy lớp từ cơ sở dữ liệu
//     const classData = await Class.findOne({ class_id: classId });

//     if (!classData) {
//       return res.status(404).json({ message: "Lớp không tồn tại" });
//     }

//     // Lấy tất cả _id của giáo viên từ trường subject_teacher
//     const teacherIds = classData.subject_teacher;

//     const subjects = [];

//     // Lặp qua tất cả các giáo viên và gọi API của service User để lấy thông tin giáo viên
//     for (const teacherId of teacherIds) {
//       // Gọi API của service User để lấy thông tin giáo viên
//       const teacherRes = await axios.get(
//         `http://localhost:4003/api/users/${teacherId}`
//       );
//       const teacherData = teacherRes.data;

//       if (!teacherData) {
//         return res.status(404).json({
//           message: `Không tìm thấy thông tin giáo viên với ID: ${teacherId}`,
//         });
//       }

//       const { _id, name, tdt_id, phone_number, email } = teacherData;

//       // Gọi API lấy thông tin môn học của giáo viên từ service Department
//       const subjectsRes = await axios.get(
//         `http://localhost:4001/api/departments/${tdt_id}/subjects`
//       );
//       const teacherSubjects = subjectsRes.data;

//       // Thêm thông tin giáo viên và môn học vào mảng subjects
//       teacherSubjects.forEach((subject) => {
//         subjects.push({
//           teacher_id: _id,
//           teacher_name: name,
//           tdt_id,
//           phone_number,
//           email,
//           subject_id: subject._id,
//           subject_name: subject.subject_name,
//           subject_code: subject.subject_code,
//         });
//       });
//     }

//     // Trả về thông tin môn học và thông tin giáo viên trong lớp
//     res.status(200).json(subjects);
//   } catch (err) {
//     console.error("Lỗi:", err);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getAllClasses = async (req, res) => {
//   try {
//     const classes = await Class.find();
//     if (classes.length === 0) {
//       return res.status(404).json({ message: "Không tìm thấy lớp nào" });
//     }
//     res.json(classes);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// };

// function getStudiedSchoolYears(classDoc) {
//   const graduationYear = classDoc.graduation_year;
//   const startYear = graduationYear - 3;
//   const currentYear = new Date().getFullYear();

//   const studiedYears = [];

//   for (let year = startYear; year < graduationYear; year++) {
//     if (
//       year < currentYear ||
//       (year === currentYear && new Date() > new Date(`${year}-06-01`))
//     ) {
//       studiedYears.push(`${year}-${year + 1}`);
//     }
//   }

//   return studiedYears;
// }

// exports.getAvailableSemestersForClass = async (req, res) => {
//   try {
//     const { class_id } = req.params;

//     const classDoc = await Class.findOne({ class_id });

//     if (!classDoc) {
//       return res.status(404).json({ message: "Không tìm thấy lớp" });
//     }

//     const studiedYears = getStudiedSchoolYears(classDoc);

//     const semesterResponse = await axios.post(
//       `http://localhost:4001/api/semesters/by-years`,
//       {
//         years: studiedYears,
//       }
//     );

//     return res.status(200).json({
//       class_id: classDoc.class_id,
//       graduation_year: classDoc.graduation_year,
//       studied_years: studiedYears,
//       semesters: semesterResponse.data.semesters,
//     });
//   } catch (error) {
//     console.error("Lỗi khi gọi semester-service:", error.message);
//     return res
//       .status(500)
//       .json({ message: "Lỗi khi lấy học kỳ từ semester-service" });
//   }
// };

// exports.getClassById = async (req, res) => {
//   try {
//     const cls = await Class.findById(req.params.id).lean();
//     if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp" });
//     res.json(cls);
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.graduate12thStudents = async (req, res) => {
//   try {
//     const currentYear = new Date().getFullYear();
//     console.log(
//       `⏳ Bắt đầu xét tốt nghiệp cho lớp 12 vào năm ${currentYear}...`
//     );

//     // Lấy danh sách các lớp 12 chưa tốt nghiệp
//     const classes12 = await Class.find({
//       class_id: { $regex: /^12/ },
//       is_graduated: false,
//     });
//     console.log(`🏫 Tìm thấy ${classes12.length} lớp 12 chưa tốt nghiệp`);

//     for (const cls of classes12) {
//       const graduated = [];
//       const notGraduated = [];
//       console.log(`🔍 Đang xử lý lớp ${cls.class_id}...`);

//       // Gọi sang ClassService để lấy thông tin học sinh
//       const { data: classData } = await axios.get(
//         `http://localhost:4000/api/classes/${cls.class_id}/students`
//       );
//       console.log(
//         `🧑‍🎓 Lớp ${cls.class_id} có ${classData.students.length} học sinh`
//       );

//       const students = classData.students || [];

//       for (const student of students) {
//         console.log(`👤 Đang xử lý học sinh: ${student._id}...`);

//         // Gọi sang ScoreboardService để lấy bảng điểm gần nhất
//         try {
//           const { data: scoreboard } = await axios.get(
//             `http://localhost:4002/api/students/${student._id}/latest`
//           );

//           const gpa = scoreboard?.gpa || 0;
//           const behavior = scoreboard?.behavior || "Yếu";
//           console.log(
//             `📊 Bảng điểm học sinh ${student._id}: GPA = ${gpa}, Hạnh kiểm = ${behavior}`
//           );

//           const enoughGPA = gpa >= 5.0;
//           const goodBehavior = behavior !== "Yếu";

//           if (enoughGPA && goodBehavior) {
//             graduated.push(student._id);
//             console.log(`✅ Học sinh ${student._id} đủ điều kiện tốt nghiệp`);
//           } else {
//             notGraduated.push(student._id);
//             console.log(
//               `❌ Học sinh ${student._id} không đủ điều kiện tốt nghiệp`
//             );
//           }
//         } catch (error) {
//           // Nếu không tìm thấy bảng điểm (404), học sinh sẽ bị coi là không đủ điều kiện
//           if (error.response && error.response.status === 404) {
//             notGraduated.push(student._id);
//             console.log(
//               `❌ Học sinh ${student._id} chưa có bảng điểm, bị lưu ban`
//             );
//           } else {
//             console.error(
//               `[ERROR] Lỗi khi lấy bảng điểm học sinh ${student._id}: ${error.message}`
//             );
//           }
//         }
//       }

//       // Đánh dấu lớp đã tốt nghiệp
//       cls.is_graduated = true;
//       cls.graduation_year = currentYear;
//       await cls.save();
//       console.log(`✅ Lớp ${cls.class_id} đã được đánh dấu tốt nghiệp`);

//       // Gọi UserService để cập nhật trạng thái tốt nghiệp
//       if (graduated.length > 0) {
//         await axios.post(`http://localhost:4003/api/users/graduated`, {
//           student_ids: graduated,
//           graduation_year: currentYear,
//         });
//         console.log(
//           `📩 Đã cập nhật trạng thái tốt nghiệp cho ${graduated.length} học sinh`
//         );
//       }

//       console.log(
//         `✅ ${cls.class_id}: ${graduated.length} tốt nghiệp, ${notGraduated.length} chưa tốt nghiệp`
//       );
//     }

//     res.status(200).json({ message: "Đã xét tốt nghiệp lớp 12 thành công." });
//   } catch (err) {
//     console.error("[ClassService LỖI] Xét tốt nghiệp:", err.message);
//     res.status(500).json({ message: "Lỗi khi xét tốt nghiệp." });
//   }
// };

// function extractGradeAndSuffix(classId) {
//   const match = classId.match(/^(\d+)([A-Z0-9]+)$/);
//   if (!match) return null;
//   return {
//     grade: parseInt(match[1]),
//     suffix: match[2], // ví dụ: "A1"
//   };
// }

// exports.promoteClasses = async (req, res) => {
//   try {
//     const { school_year, class_id, promoted, repeated } = req.body;

//     console.log("[ClassService] Nhận yêu cầu promoteClasses:", {
//       school_year,
//       class_id,
//       promoted,
//       repeated,
//     });

//     if (!school_year || !class_id || !promoted || !repeated) {
//       return res.status(400).json({
//         message: "Thiếu school_year, class_id, promoted hoặc repeated",
//       });
//     }

//     if (!/^\d{4}-\d{4}$/.test(school_year)) {
//       return res
//         .status(400)
//         .json({ message: "school_year phải có định dạng YYYY-YYYY" });
//     }

//     if (!Array.isArray(promoted) || !Array.isArray(repeated)) {
//       return res
//         .status(400)
//         .json({ message: "promoted và repeated phải là mảng" });
//     }

//     const currentYear = new Date().getFullYear();
//     const result = await promoteGrade10And11(
//       currentYear,
//       school_year,
//       class_id,
//       promoted,
//       repeated
//     );
//     res
//       .status(200)
//       .json({ message: "Đã xử lý xong chuyển lớp", details: result });
//   } catch (err) {
//     console.error("Lỗi promote:", err.message);
//     res.status(500).json({ message: "Lỗi xử lý lên lớp", error: err.message });
//   }
// };

// async function promoteGrade10And11(
//   currentYear,
//   school_year,
//   class_id,
//   promoted,
//   repeated
// ) {
//   console.log(`[ClassService] Bắt đầu xử lý chuyển lớp cho ${class_id}`);

//   const cls = await Class.findOne({ class_id });
//   if (!cls) {
//     console.log(`[ClassService] Không tìm thấy lớp ${class_id}`);
//     return [
//       { class_id, status: "failed", error: `Không tìm thấy lớp ${class_id}` },
//     ];
//   }

//   console.log(`[ClassService] Tìm thấy lớp:`, cls);

//   if (cls.is_graduated) {
//     console.log(`[ClassService] Lớp ${class_id} đã tốt nghiệp`);
//     return [
//       {
//         class_id,
//         status: "failed",
//         error: "Lớp đã tốt nghiệp, không thể chuyển lớp",
//       },
//     ];
//   }

//   const parsed = extractGradeAndSuffix(cls.class_id);
//   console.log(
//     `[ClassService] Parsed grade and suffix for ${cls.class_id}:`,
//     parsed
//   );
//   if (!parsed || parsed.grade >= 12) {
//     console.log(
//       `[ClassService] Lớp ${class_id} không hợp lệ để chuyển (grade >= 12)`
//     );
//     return [
//       {
//         class_id,
//         status: "failed",
//         error: "Lớp không hợp lệ để chuyển (cấp lớp >= 12)",
//       },
//     ];
//   }

//   console.log(`[ClassService] Lớp hợp lệ, bắt đầu giao dịch cho ${class_id}`);

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Fix: Use 'new' to instantiate ObjectId
//     const promotedIds = promoted.map(
//       (item) => new mongoose.Types.ObjectId(item.student_id)
//     );
//     const repeatedIds = repeated.map(
//       (item) => new mongoose.Types.ObjectId(item.student_id)
//     );

//     console.log(`[ClassService] Promoted IDs:`, promotedIds);
//     console.log(`[ClassService] Repeated IDs:`, repeatedIds);

//     const classMembers = cls.class_member.map((id) => id.toString());
//     console.log(`[ClassService] Class Members:`, classMembers);

//     const invalidPromoted = promotedIds.filter(
//       (id) => !classMembers.includes(id.toString())
//     );
//     const invalidRepeated = repeatedIds.filter(
//       (id) => !classMembers.includes(id.toString())
//     );

//     if (invalidPromoted.length > 0 || invalidRepeated.length > 0) {
//       throw new Error(
//         `Một số học sinh không thuộc lớp ${class_id}: Promoted: ${invalidPromoted.join(
//           ", "
//         )}, Repeated: ${invalidRepeated.join(", ")}`
//       );
//     }

//     const newGrade = parsed.grade + 1;
//     const newClassId = `${newGrade}${parsed.suffix}`;
//     console.log(`[ClassService] Tạo hoặc cập nhật lớp mới: ${newClassId}`);

//     let newClass = await Class.findOne({ class_id: newClassId });
//     if (!newClass) {
//       newClass = new Class({
//         class_id: newClassId,
//         class_name: newClassId,
//         class_teacher: cls.class_teacher,
//         class_member: [],
//         subject_teacher: cls.subject_teacher,
//         graduation_year: cls.graduation_year,
//         is_graduated: newGrade === 12,
//       });
//       await newClass.save({ session });
//       console.log(`[ClassService] Đã tạo lớp mới: ${newClassId}`);
//     }

//     newClass.class_member = [
//       ...new Set([...newClass.class_member, ...promotedIds]),
//     ];
//     await newClass.save({ session });
//     console.log(
//       `[ClassService] Đã cập nhật lớp ${newClassId} với thành viên:`,
//       newClass.class_member
//     );

//     cls.class_member = repeatedIds;
//     await cls.save({ session });
//     console.log(
//       `[ClassService] Đã cập nhật lớp ${class_id} với thành viên còn lại:`,
//       cls.class_member
//     );

//     const updatedCls = await Class.findOne({ class_id }).session(session);
//     const updatedNewClass = await Class.findOne({
//       class_id: newClassId,
//     }).session(session);
//     console.log(
//       `[ClassService] Xác nhận trong giao dịch - Lớp ${class_id}:`,
//       updatedCls.class_member
//     );
//     console.log(
//       `[ClassService] Xác nhận trong giao dịch - Lớp ${newClassId}:`,
//       updatedNewClass.class_member
//     );

//     await session.commitTransaction();
//     console.log(`[ClassService] Giao dịch hoàn tất cho lớp ${class_id}`);

//     const finalCls = await Class.findOne({ class_id });
//     const finalNewClass = await Class.findOne({ class_id: newClassId });
//     console.log(
//       `[ClassService] Xác nhận sau commit - Lớp ${class_id}:`,
//       finalCls.class_member
//     );
//     console.log(
//       `[ClassService] Xác nhận sau commit - Lớp ${newClassId}:`,
//       finalNewClass.class_member
//     );

//     return [
//       {
//         class_id: cls.class_id,
//         status: "success",
//         promoted: promotedIds.length,
//         repeated: repeatedIds.length,
//       },
//     ];
//   } catch (err) {
//     await session.abortTransaction();
//     console.error(`[ClassService LỖI] ❌ Lớp ${class_id}:`, err.message);
//     return [{ class_id, status: "failed", error: err.message }];
//   } finally {
//     session.endSession();
//   }
// }

// function extractGradeAndSuffix(classId) {
//   console.log(`[ClassService] Extracting grade from classId: ${classId}`);
//   const match = classId.match(/^(\d{1,2})([A-Za-z0-9]*)$/); // Allow alphanumeric suffix
//   if (!match) {
//     console.log(`[ClassService] Không khớp định dạng cho ${classId}`);
//     return null;
//   }
//   const result = {
//     grade: parseInt(match[1], 10),
//     suffix: match[2] || "",
//   };
//   console.log(`[ClassService] Extracted:`, result);
//   return result;
// }

// exports.approval = async (req, res) => {
//   try {
//     const { class_id, class_name, school_year, students } = req.body;

//     if (
//       !class_id ||
//       !class_name ||
//       !school_year ||
//       !students ||
//       !Array.isArray(students) ||
//       students.length === 0
//     ) {
//       return res.status(400).json({
//         message: "Thiếu thông tin lớp, năm học hoặc danh sách học sinh.",
//       });
//     }

//     if (!/^\d{4}-\d{4}$/.test(school_year)) {
//       return res.status(400).json({
//         message: "Định dạng năm học không hợp lệ. Vui lòng dùng YYYY-YYYY.",
//       });
//     }

//     const invalidStudent = students.find(
//       (s) =>
//         !s.student_id ||
//         !mongoose.Types.ObjectId.isValid(s.student_id) ||
//         !s.name ||
//         !s.hk1?.gpa ||
//         !s.hk1?.behavior ||
//         !s.hk2?.gpa ||
//         !s.hk2?.behavior
//     );
//     if (invalidStudent) {
//       return res.status(400).json({
//         message:
//           "Dữ liệu học sinh không hợp lệ. Vui lòng kiểm tra student_id, GPA và hạnh kiểm.",
//       });
//     }

//     const approval = new Approval({
//       class_id,
//       class_name,
//       school_year,
//       students,
//       submitted_by: req.userId,
//     });

//     await approval.save();

//     res.status(201).json({
//       message: "Đã gửi danh sách để duyệt thành công.",
//       approvalId: approval._id,
//     });
//   } catch (error) {
//     console.error("Lỗi khi gửi duyệt:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getApprovalPending = async (req, res) => {
//   try {
//     const pendingApprovals = await Approval.find({ status: "pending" }).lean();
//     if (!pendingApprovals || pendingApprovals.length === 0) {
//       return res.status(200).json([]);
//     }

//     const transformedApprovals = pendingApprovals.map((approval) => ({
//       _id: approval._id,
//       class_id: approval.class_id,
//       class_name: approval.class_name,
//       school_year: approval.school_year,
//       students: approval.students.map((student) => ({
//         _id: student.student_id,
//         tdt_id: student.student_id,
//         name: student.name,
//         date_of_birth: "2008-01-01",
//         hk1_gpa: student.hk1.gpa,
//         hk1_behavior: student.hk1.behavior,
//         hk2_gpa: student.hk2.gpa,
//         hk2_behavior: student.hk2.behavior,
//       })),
//     }));

//     res.status(200).json(transformedApprovals);
//   } catch (error) {
//     console.error("Lỗi khi lấy danh sách chờ duyệt:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.approveApproval = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const approval = await Approval.findById(id);
//     if (!approval)
//       return res.status(404).json({ message: "Không tìm thấy yêu cầu duyệt." });
//     if (approval.status !== "pending")
//       return res
//         .status(400)
//         .json({ message: "Yêu cầu đã được xử lý trước đó." });

//     const promotionResults = {
//       class_id: approval.class_id,
//       status: "success",
//       promoted: [],
//       repeated: [],
//       error: null,
//     };

//     approval.students.forEach((student) => {
//       const avgGpa = (student.hk1.gpa + student.hk2.gpa) / 2;
//       const worstBehavior =
//         ["Tốt", "Khá", "Trung bình", "Yếu"].indexOf(student.hk1.behavior) >
//         ["Tốt", "Khá", "Trung bình", "Yếu"].indexOf(student.hk2.behavior)
//           ? student.hk1.behavior
//           : student.hk2.behavior;

//       if (avgGpa >= 5.0 && worstBehavior !== "Yếu") {
//         promotionResults.promoted.push({
//           student_id: student.student_id.toString(),
//           gpa: student.hk2.gpa,
//           behavior: student.hk2.behavior,
//         });
//       } else {
//         let reason = "";
//         if (avgGpa < 5.0) reason = "GPA trung bình dưới 5.0";
//         else if (worstBehavior === "Yếu") reason = "Hạnh kiểm Yếu";
//         promotionResults.repeated.push({
//           student_id: student.student_id.toString(),
//           gpa: student.hk2.gpa,
//           behavior: student.hk2.behavior,
//           reason,
//         });
//       }
//     });

//     console.log("[ApprovalService] Gửi yêu cầu đến promoteClasses:", {
//       school_year: approval.school_year,
//       class_id: approval.class_id,
//       promoted: promotionResults.promoted,
//       repeated: promotionResults.repeated,
//     });

//     let promotionDetails = [];
//     try {
//       const promoteResponse = await axios.post(
//         "http://localhost:4000/api/classes/promote",
//         {
//           school_year: approval.school_year,
//           class_id: approval.class_id,
//           promoted: promotionResults.promoted,
//           repeated: promotionResults.repeated,
//         },
//         { headers: { Authorization: `Bearer ${req.token}` } }
//       );
//       promotionDetails = promoteResponse.data.details;

//       console.log(
//         "[ApprovalService] Kết quả từ promoteClasses:",
//         promotionDetails
//       );

//       if (
//         promotionDetails.length > 0 &&
//         promotionDetails[0].status !== "success"
//       ) {
//         promotionResults.status = "failed";
//         promotionResults.error =
//           promotionDetails[0].error || "Chuyển lớp thất bại";
//       }
//     } catch (promoteError) {
//       console.error(
//         "[ClassService LỖI] Lỗi khi gọi promoteClasses:",
//         promoteError.response?.data || promoteError.message
//       );
//       promotionResults.status = "failed";
//       promotionResults.error =
//         "Không thể chuyển lớp: " +
//         (promoteError.response?.data?.message || promoteError.message);
//     }

//     approval.status = "approved";
//     await approval.save();

//     res.status(200).json({
//       message: "Đã duyệt yêu cầu thành công",
//       promotionResults: [promotionResults],
//       promotionDetails,
//     });
//   } catch (error) {
//     console.error("Lỗi khi duyệt yêu cầu:", error.message);
//     res.status(500).json({ message: "Lỗi server", error: error.message });
//   }
// };

const Class = require("../models/Class");
const Approval = require("../models/Approval");
const mongoose = require("mongoose");
const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");
require("dotenv").config();

exports.getClassStudents = async (req, res) => {
  try {
    const classId = req.params.id;

    const classDoc = await Class.findOne({ class_id: classId });
    if (!classDoc) {
      return res
        .status(404)
        .json({ message: `Không tìm thấy lớp với mã ${classId}` });
    }

    const studentIds = classDoc.class_member;
    if (!studentIds || studentIds.length === 0) {
      return res.status(200).json({
        class_id: classDoc.class_id,
        class_name: classDoc.class_name,
        students: [],
      });
    }

    // Gọi sang UserService để lấy thông tin các user
    const response = await axios.post(
      `${process.env.USER_SERVICE_URL}/api/users/batch`,
      {
        ids: studentIds,
      }
    );

    res.status(200).json({
      class_id: classDoc.class_id,
      class_name: classDoc.class_name,
      students: response.data,
    });
  } catch (error) {
    console.error("Lỗi khi lấy học sinh lớp:", error.message);
    res
      .status(500)
      .json({ message: "Lỗi server hoặc gọi user service thất bại" });
  }
};

exports.getAdvisorByClassId = async (req, res) => {
  try {
    const { classId } = req.params;

    const classDoc = await Class.findOne({ class_id: classId });
    if (!classDoc) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    const advisorId = classDoc.class_teacher;
    if (!advisorId) {
      return res.status(404).json({ message: "Lớp này chưa có giáo viên" });
    }

    const advisorRes = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/${advisorId}`
    );
    const advisor = advisorRes.data;

    res.status(200).json({
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        role: advisor.role,
        phone_number: advisor.phone_number,
        address: advisor.address,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getClassesByTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "ID giáo viên không hợp lệ" });
    }

    const classDoc = await Class.findOne({ class_teacher: teacherId });
    if (!classDoc) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp của giáo viên" });
    }

    res.status(200).json({
      class: {
        class_id: classDoc.class_id,
        class_name: classDoc.class_name,
        students: classDoc.class_member,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lớp của giáo viên:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getClassByStudentId = async (req, res) => {
  try {
    const userId = req.params.id;

    const foundClass = await Class.findOne({ class_member: userId });
    if (!foundClass) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp học của học sinh này" });
    }

    res.status(200).json({
      class: {
        class_id: foundClass.class_id,
        class_name: foundClass.class_name,
      },
    });
  } catch (err) {
    console.error("Lỗi tìm lớp theo học sinh:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.removeAdvisorFromClass = async (req, res) => {
  const updated = await Class.findByIdAndUpdate(
    req.params.classId,
    { $unset: { class_teacher: "" } },
    { new: true }
  );
  res.json({ message: "Đã gỡ giáo viên khỏi lớp", class: updated });
};

exports.getClassByTeacherId = async (req, res) => {
  const classFound = await Class.findOne({
    class_teacher: req.params.teacherId,
  });
  if (!classFound)
    return res
      .status(404)
      .json({ message: "Không tìm thấy lớp có giáo viên này" });
  res.json(classFound);
};

exports.getAdvisorOfStudent = async (req, res) => {
  try {
    const studentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "ID học sinh không hợp lệ" });
    }

    const classDoc = await Class.findOne({ class_member: studentId });

    if (!classDoc) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp chứa học sinh này" });
    }

    const advisorId = classDoc.class_teacher;

    const advisorResponse = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/${advisorId}`
    );
    const advisor = advisorResponse.data;

    res.status(200).json({
      class: {
        id: classDoc.class_id,
        name: classDoc.class_name,
      },
      advisor: {
        id: advisor._id,
        name: advisor.name,
        email: advisor.email,
        role: advisor.role,
        phone_number: advisor.phone_number,
        address: advisor.address,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông tin giáo viên:", error.message);
    res
      .status(500)
      .json({ message: "Lỗi server hoặc kết nối đến UserService thất bại" });
  }
};

exports.addClass = async (req, res) => {
  try {
    const { class_id } = req.body;

    if (!class_id) {
      return res.status(400).json({ message: "Thiếu class_id" });
    }

    let class_name = "Không rõ";
    let graduation_year = null;
    const currentYear = new Date().getFullYear();

    if (class_id.includes("12")) {
      class_name = "Khối 12";
      graduation_year = currentYear + 1;
    } else if (class_id.includes("11")) {
      class_name = "Khối 11";
      graduation_year = currentYear + 2;
    } else if (class_id.includes("10")) {
      class_name = "Khối 10";
      graduation_year = currentYear + 3;
    }

    const is_graduated =
      graduation_year !== null && currentYear >= graduation_year;

    const existing = await Class.findOne({ class_id });
    if (existing) {
      return res.status(409).json({ message: "Lớp đã tồn tại" });
    }

    const newClass = new Class({
      class_id,
      class_name,
      graduation_year,
      is_graduated,
    });

    await newClass.save();

    res.status(201).json({
      message: "Thêm lớp thành công",
      class: newClass,
    });
  } catch (err) {
    console.error("Lỗi khi thêm lớp:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const { class_id } = req.params;

    const foundClass = await Class.findOne({ class_id });

    if (!foundClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    res.status(200).json({ class: foundClass });
  } catch (err) {
    console.error("Lỗi khi lấy lớp:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getClassSizeById = async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ message: "Thiếu class_id" });
    }

    const classDoc = await Class.findOne({ class_id });

    if (!classDoc) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lớp với class_id đã cho" });
    }

    const totalStudents = classDoc.class_member.length;

    res.status(200).json({
      class_id: classDoc.class_id,
      class_name: classDoc.class_name,
      totalStudents,
    });
  } catch (error) {
    console.error("[ClassService LỖI] [Lỗi lấy sĩ số lớp]:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.importStudentsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!req.file)
      return res.status(400).json({ message: "Vui lòng tải lên file CSV" });

    const emails = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        if (row.email) emails.push(row.email.trim());
      })
      .on("end", async () => {
        if (emails.length === 0)
          return res.status(400).json({ message: "File không có email nào" });

        const userRes = await axios.post(
          `${process.env.USER_SERVICE_URL}/api/users/get-ids-by-emails`,
          {
            emails,
          }
        );

        const userIds = userRes.data.userIds;
        if (!Array.isArray(userIds) || userIds.length === 0)
          return res.status(400).json({
            message: "Không tìm thấy học sinh nào từ danh sách email",
          });

        const targetClass = await Class.findOne({ class_id: classId });
        if (!targetClass) {
          return res.status(404).json({ message: "Không tìm thấy lớp học" });
        }

        if (req.user.id !== targetClass.class_teacher.toString()) {
          return res.status(403).json({
            message: "Bạn không có quyền import học sinh vào lớp này",
          });
        }

        const existingIds = new Set(
          (targetClass.class_member || []).map((id) => id.toString())
        );
        const alreadyInClass = [];
        const toAdd = [];

        userIds.forEach((id, i) => {
          if (existingIds.has(id)) {
            alreadyInClass.push(emails[i]);
          } else {
            toAdd.push(id);
          }
        });

        const updatedClass = await Class.findOneAndUpdate(
          { class_id: classId },
          { $addToSet: { class_member: { $each: userIds } } },
          { new: true }
        );

        res.status(200).json({
          message: `Đã thêm ${userIds.length} học sinh vào lớp`,
          addedCount: toAdd.length,
          alreadyInClass,
          updatedClass,
        });
      });
  } catch (error) {
    console.error("[Import Students ERROR]", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.removeStudentFromClass = async (req, res) => {
  try {
    const { classId, userId } = req.params;

    const updatedClass = await Class.findOneAndUpdate(
      { class_id: classId },
      { $pull: { class_member: userId } },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    res
      .status(200)
      .json({ message: "Đã xoá học sinh khỏi lớp", class: updatedClass });
  } catch (error) {
    console.error("Lỗi khi xoá học sinh khỏi lớp:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.addStudentToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { email } = req.body;

    const userServiceURL = `${process.env.USER_SERVICE_URL}/api/users/get-ids-by-emails`;
    const userResponse = await axios.post(userServiceURL, {
      emails: [email],
    });

    const userIds = userResponse.data.userIds;
    if (userIds.length === 0) {
      return res
        .status(404)
        .json({ message: "Email không tồn tại trong hệ thống" });
    }

    const userId = userIds[0];

    const existingClass = await Class.findOne({ class_id: classId });

    if (req.user.id !== existingClass.class_teacher.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thêm học sinh vào lớp này" });
    }

    if (existingClass.class_member.includes(userId)) {
      return res.status(409).json({ message: "Học sinh đã tồn tại trong lớp" });
    }

    const updatedClass = await Class.findOneAndUpdate(
      { class_id: classId },
      { $addToSet: { class_member: userId } },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    res.status(200).json({
      message: "Đã thêm học sinh vào lớp",
      class: updatedClass,
    });
  } catch (error) {
    console.error("[Add Student ERROR]", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.addAdvisorToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { email } = req.body;

    const userServiceURL = `${process.env.USER_SERVICE_URL}/api/users/get-ids-by-emails`;
    const userResponse = await axios.post(userServiceURL, {
      emails: [email],
    });

    const userIds = userResponse.data.userIds;
    if (!userIds || userIds.length === 0) {
      return res
        .status(404)
        .json({ message: "Email giáo viên không tồn tại trong hệ thống" });
    }

    const advisorId = userIds[0];

    const classWithSameTeacher = await Class.findOne({
      class_teacher: advisorId,
      class_id: { $ne: classId },
    });

    if (classWithSameTeacher) {
      return res.status(409).json({
        message: `Giáo viên đã là chủ nhiệm lớp ${classWithSameTeacher.class_id}`,
      });
    }

    const existingClass = await Class.findOne({ class_id: classId });

    if (!existingClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    if (
      existingClass.class_teacher &&
      existingClass.class_teacher.toString() === advisorId
    ) {
      return res
        .status(409)
        .json({ message: "giáo viên đã được gán cho lớp này" });
    }
    existingClass.class_teacher = advisorId;
    await existingClass.save();

    try {
      await axios.put(
        `${process.env.USER_SERVICE_URL}/api/users/${advisorId}/add-homeroom-teacher`
      );
    } catch (err) {
      console.warn(
        "Không thể cập nhật advisor_type:",
        err.response?.data || err.message
      );
    }

    res.status(200).json({
      message: "Đã thêm giáo viên vào lớp",
      class: existingClass,
    });
  } catch (error) {
    console.error("[Add Advisor ERROR]", error.message);
    res.status(500).json({ message: "Lỗi server khi thêm giáo viên" });
  }
};

exports.changeAdvisorOfClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { email } = req.body;

    const userServiceURL = `${process.env.USER_SERVICE_URL}/api/users/get-ids-by-emails`;
    const userResponse = await axios.post(userServiceURL, {
      emails: [email],
    });

    const userIds = userResponse.data.userIds;
    if (!userIds || userIds.length === 0) {
      return res
        .status(404)
        .json({ message: "Email giáo viên không tồn tại trong hệ thống" });
    }

    const newAdvisorId = userIds[0];

    const existingClass = await Class.findOne({ class_id: classId });
    if (!existingClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    const currentAdvisorId = existingClass.class_teacher?.toString();

    if (currentAdvisorId === newAdvisorId) {
      return res.status(409).json({ message: "Đây đã là giáo viên hiện tại" });
    }

    const classWithSameTeacher = await Class.findOne({
      class_teacher: newAdvisorId,
      class_id: { $ne: classId },
    });

    if (classWithSameTeacher) {
      return res.status(409).json({
        message: `Giáo viên đã là chủ nhiệm lớp ${classWithSameTeacher.class_id}`,
      });
    }

    if (currentAdvisorId) {
      try {
        await axios.put(
          `${process.env.USER_SERVICE_URL}/api/users/${currentAdvisorId}/remove-homeroom-teacher`
        );
      } catch (err) {
        console.warn(
          "Không thể cập nhật advisor_type giáo viên cũ:",
          err?.response?.data || err.message
        );
      }
    }

    try {
      await axios.put(
        `${process.env.USER_SERVICE_URL}/api/users/${newAdvisorId}/add-homeroom-teacher`
      );
    } catch (err) {
      console.warn(
        "Không thể cập nhật advisor_type giáo viên mới:",
        err?.response?.data || err.message
      );
    }

    existingClass.class_teacher = newAdvisorId;
    await existingClass.save();

    res.status(200).json({
      message: "Đã cập nhật giáo viên lớp thành công",
      class: existingClass,
    });
  } catch (error) {
    console.error("[Edit Advisor ERROR]", error.message);
    res.status(500).json({ message: "Lỗi server khi cập nhật giáo viên" });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find(
      {},
      "class_id class_name class_member class_teacher"
    );
    res.status(200).json(classes);
  } catch (err) {
    console.error("Lỗi khi lấy danh sách lớp:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.assignTeacherToClass = async (req, res) => {
  try {
    const { class_id, teacher_id } = req.body;

    const updated = await Class.findOneAndUpdate(
      { class_id },
      { class_teacher: teacher_id },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    try {
      await axios.put(
        `${process.env.USER_SERVICE_URL}/api/users/${teacher_id}/add-homeroom-teacher`
      );
    } catch (err) {
      console.warn(
        "Không thể cập nhật advisor_type:",
        err.response?.data || err.message
      );
    }

    res.status(200).json({
      message: "Gán giáo viên cho lớp thành công",
      class: updated,
    });
  } catch (error) {
    console.error("Lỗi khi gán giáo viên:", error.message);
    res.status(500).json({ message: "Lỗi server khi gán giáo viên cho lớp" });
  }
};

exports.adminDeleteStudentFromClass = async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const classDoc = await Class.findOne({ class_member: studentId });

    if (!classDoc)
      return res.status(200).json({ message: "Học sinh không thuộc lớp nào" });

    classDoc.class_member = classDoc.class_member.filter(
      (id) => id.toString() !== studentId
    );
    await classDoc.save();

    res.status(200).json({
      message: "Đã xoá học sinh khỏi lớp",
      classId: classDoc.class_id,
    });
  } catch (error) {
    console.error("Lỗi khi xóa học sinh khỏi lớp:", error.message);
    res.status(500).json({ message: "Không thể xóa học sinh khỏi lớp" });
  }
};

exports.addSubjectTeacherToClass = async (req, res) => {
  try {
    const { user_id } = req.body;
    const { classId } = req.params;

    if (!user_id) {
      return res.status(400).json({ message: "Thiếu user_id giáo viên" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    if (classData.subject_teacher.some((u) => u.toString() === user_id)) {
      return res
        .status(400)
        .json({ message: "Giáo viên đã tồn tại trong lớp này" });
    }

    classData.subject_teacher.push(user_id);
    await classData.save();

    return res
      .status(200)
      .json({ message: "Thêm giáo viên vào lớp thành công" });
  } catch (error) {
    console.error("[Add Subject Teacher ERROR]", error.message);
    return res
      .status(500)
      .json({ message: "Lỗi server khi thêm giáo viên vào lớp" });
  }
};

exports.getClassesByTdtId = async (req, res) => {
  const { tdt_id } = req.params;

  try {
    const user = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/tdt/${tdt_id}`
    );
    const userId = user.data._id;

    if (!userId) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với tdt_id này" });
    }

    const classes = await Class.find({
      subject_teacher: userId,
    });
    return res.status(200).json(classes);
  } catch (error) {
    console.error("[ERROR] Lấy danh sách lớp theo tdt_id:", error.message);
    return res.status(500).json({ message: "Lỗi server khi lấy lớp học" });
  }
};

exports.addClassForTeacher = async (req, res) => {
  const { class_id, teacher_id } = req.body;

  if (!class_id || !teacher_id) {
    return res.status(400).json({ message: "Thiếu class_id hoặc teacher_id" });
  }

  try {
    const teacherRes = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/${teacher_id}`
    );
    const teacher = teacherRes.data;
    const tdt_id = teacher.tdt_id;

    const subjectRes = await axios.get(
      `${process.env.EDUCATION_SERVICE_URL}/api/departments/${tdt_id}/subjects`
    );
    const teacherSubjects = subjectRes.data;

    if (!Array.isArray(teacherSubjects)) {
      return res
        .status(400)
        .json({ message: "Không lấy được danh sách môn học của giáo viên" });
    }

    const classRes = await axios.get(
      `${process.env.CLASS_SERVICE_URL}/api/${class_id}`
    );
    const foundClass = classRes.data.class;

    if (!foundClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    const currentTeacherIds = foundClass.subject_teacher || [];

    const existingTeachers = await Promise.all(
      currentTeacherIds.map((id) =>
        axios
          .get(`${process.env.USER_SERVICE_URL}/api/users/${id}`)
          .then((res) => res.data)
      )
    );

    const existingSubjectsMap = new Map();

    for (const t of existingTeachers) {
      const deptRes = await axios.get(
        `${process.env.EDUCATION_SERVICE_URL}/api/departments/${t.tdt_id}/subjects`
      );
      const subjects = deptRes.data;
      subjects.forEach((sub) => {
        if (!existingSubjectsMap.has(sub.subject_code)) {
          existingSubjectsMap.set(sub.subject_code, {
            subject_name: sub.subject_name,
            tdt_id: t.tdt_id,
          });
        }
      });
    }

    const conflicts = teacherSubjects.filter((sub) =>
      existingSubjectsMap.has(sub.subject_code)
    );
    if (conflicts.length > 0) {
      const messages = conflicts.map((conflict) => {
        const existing = existingSubjectsMap.get(conflict.subject_code);
        return `Môn học "${existing.subject_name}" của lớp "${class_id}" đã có người dạy (teacher_id: ${existing.tdt_id})`;
      });

      return res.status(400).json({ message: messages.join("; ") });
    }

    const objectIdTeacher = new mongoose.Types.ObjectId(teacher_id);

    const updatedClass = await Class.findOneAndUpdate(
      { class_id: class_id },
      { $addToSet: { subject_teacher: objectIdTeacher } },
      { new: true }
    );

    res.status(200).json({
      message: "Gán giáo viên vào lớp thành công",
      updatedClass,
    });
  } catch (err) {
    console.error("Lỗi khi phân công giáo viên:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.removeTeacherFromClass = async (req, res) => {
  const { class_id, teacher_id } = req.body;

  if (!class_id || !teacher_id) {
    return res.status(400).json({ message: "Thiếu class_id hoặc teacher_id" });
  }

  try {
    const updatedClass = await Class.findOneAndUpdate(
      { _id: class_id },
      { $pull: { subject_teacher: new mongoose.Types.ObjectId(teacher_id) } },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: "Không tìm thấy lớp học" });
    }

    return res.status(200).json({
      message: "Đã xóa giáo viên khỏi lớp thành công",
      data: updatedClass,
    });
  } catch (error) {
    console.error("[LỖI] Xóa giáo viên khỏi lớp:", error.message);
    return res
      .status(500)
      .json({ message: "Lỗi server khi xóa giáo viên khỏi lớp" });
  }
};

exports.getSubjectsOfClass = async (req, res) => {
  try {
    const classId = req.params.classId;

    const classData = await Class.findOne({ class_id: classId });

    if (!classData) {
      return res.status(404).json({ message: "Lớp không tồn tại" });
    }

    const teacherIds = classData.subject_teacher;

    const subjects = [];

    for (const teacherId of teacherIds) {
      const teacherRes = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/users/${teacherId}`
      );
      const teacherData = teacherRes.data;

      if (!teacherData) {
        return res.status(404).json({
          message: `Không tìm thấy thông tin giáo viên với ID: ${teacherId}`,
        });
      }

      const { _id, name, tdt_id, phone_number, email } = teacherData;

      const subjectsRes = await axios.get(
        `${process.env.EDUCATION_SERVICE_URL}/api/departments/${tdt_id}/subjects`
      );
      const teacherSubjects = subjectsRes.data;

      teacherSubjects.forEach((subject) => {
        subjects.push({
          teacher_id: _id,
          teacher_name: name,
          tdt_id,
          phone_number,
          email,
          subject_id: subject._id,
          subject_name: subject.subject_name,
          subject_code: subject.subject_code,
        });
      });
    }

    res.status(200).json(subjects);
  } catch (err) {
    console.error("Lỗi:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find();
    if (classes.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy lớp nào" });
    }
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

function getStudiedSchoolYears(classDoc) {
  const graduationYear = classDoc.graduation_year;
  const startYear = graduationYear - 3;
  const currentYear = new Date().getFullYear();

  const studiedYears = [];

  for (let year = startYear; year < graduationYear; year++) {
    if (
      year < currentYear ||
      (year === currentYear && new Date() > new Date(`${year}-06-01`))
    ) {
      studiedYears.push(`${year}-${year + 1}`);
    }
  }

  return studiedYears;
}

exports.getAvailableSemestersForClass = async (req, res) => {
  try {
    const { class_id } = req.params;

    const classDoc = await Class.findOne({ class_id });

    if (!classDoc) {
      return res.status(404).json({ message: "Không tìm thấy lớp" });
    }

    const studiedYears = getStudiedSchoolYears(classDoc);

    const semesterResponse = await axios.post(
      `${process.env.EDUCATION_SERVICE_URL}/api/semesters/by-years`,
      {
        years: studiedYears,
      }
    );

    return res.status(200).json({
      class_id: classDoc.class_id,
      graduation_year: classDoc.graduation_year,
      studied_years: studiedYears,
      semesters: semesterResponse.data.semesters,
    });
  } catch (error) {
    console.error("Lỗi khi gọi semester-service:", error.message);
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy học kỳ từ semester-service" });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id).lean();
    if (!cls) return res.status(404).json({ message: "Không tìm thấy lớp" });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.graduate12thStudents = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    console.log(
      `⏳ Bắt đầu xét tốt nghiệp cho lớp 12 vào năm ${currentYear}...`
    );

    const classes12 = await Class.find({
      class_id: { $regex: /^12/ },
      is_graduated: false,
    });
    console.log(`🏫 Tìm thấy ${classes12.length} lớp 12 chưa tốt nghiệp`);

    for (const cls of classes12) {
      const graduated = [];
      const notGraduated = [];
      console.log(`🔍 Đang xử lý lớp ${cls.class_id}...`);

      const { data: classData } = await axios.get(
        `${process.env.CLASS_SERVICE_URL}/api/classes/${cls.class_id}/students`
      );
      console.log(
        `🧑‍🎓 Lớp ${cls.class_id} có ${classData.students.length} học sinh`
      );

      const students = classData.students || [];

      for (const student of students) {
        console.log(`👤 Đang xử lý học sinh: ${student._id}...`);

        try {
          const { data: scoreboard } = await axios.get(
            `${process.env.SCORE_SERVICE_URL}/api/students/${student._id}/latest`
          );

          const gpa = scoreboard?.gpa || 0;
          const behavior = scoreboard?.behavior || "Yếu";
          console.log(
            `📊 Bảng điểm học sinh ${student._id}: GPA = ${gpa}, Hạnh kiểm = ${behavior}`
          );

          const enoughGPA = gpa >= 5.0;
          const goodBehavior = behavior !== "Yếu";

          if (enoughGPA && goodBehavior) {
            graduated.push(student._id);
            console.log(`✅ Học sinh ${student._id} đủ điều kiện tốt nghiệp`);
          } else {
            notGraduated.push(student._id);
            console.log(
              `❌ Học sinh ${student._id} không đủ điều kiện tốt nghiệp`
            );
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            notGraduated.push(student._id);
            console.log(
              `❌ Học sinh ${student._id} chưa có bảng điểm, bị lưu ban`
            );
          } else {
            console.error(
              `[ERROR] Lỗi khi lấy bảng điểm học sinh ${student._id}: ${error.message}`
            );
          }
        }
      }

      cls.is_graduated = true;
      cls.graduation_year = currentYear;
      await cls.save();
      console.log(`✅ Lớp ${cls.class_id} đã được đánh dấu tốt nghiệp`);

      if (graduated.length > 0) {
        await axios.post(
          `${process.env.USER_SERVICE_URL}/api/users/graduated`,
          {
            student_ids: graduated,
            graduation_year: currentYear,
          }
        );
        console.log(
          `📩 Đã cập nhật trạng thái tốt nghiệp cho ${graduated.length} học sinh`
        );
      }

      console.log(
        `✅ ${cls.class_id}: ${graduated.length} tốt nghiệp, ${notGraduated.length} chưa tốt nghiệp`
      );
    }

    res.status(200).json({ message: "Đã xét tốt nghiệp lớp 12 thành công." });
  } catch (err) {
    console.error("[ClassService LỖI] Xét tốt nghiệp:", err.message);
    res.status(500).json({ message: "Lỗi khi xét tốt nghiệp." });
  }
};

function extractGradeAndSuffix(classId) {
  const match = classId.match(/^(\d+)([A-Z0-9]+)$/);
  if (!match) return null;
  return {
    grade: parseInt(match[1]),
    suffix: match[2],
  };
}

exports.promoteClasses = async (req, res) => {
  try {
    const { school_year, class_id, promoted, repeated } = req.body;

    console.log("[ClassService] Nhận yêu cầu promoteClasses:", {
      school_year,
      class_id,
      promoted,
      repeated,
    });

    if (!school_year || !class_id || !promoted || !repeated) {
      return res.status(400).json({
        message: "Thiếu school_year, class_id, promoted hoặc repeated",
      });
    }

    if (!/^\d{4}-\d{4}$/.test(school_year)) {
      return res
        .status(400)
        .json({ message: "school_year phải có định dạng YYYY-YYYY" });
    }

    if (!Array.isArray(promoted) || !Array.isArray(repeated)) {
      return res
        .status(400)
        .json({ message: "promoted và repeated phải là mảng" });
    }

    const currentYear = new Date().getFullYear();
    const result = await promoteGrade10And11(
      currentYear,
      school_year,
      class_id,
      promoted,
      repeated
    );
    res
      .status(200)
      .json({ message: "Đã xử lý xong chuyển lớp", details: result });
  } catch (err) {
    console.error("Lỗi promote:", err.message);
    res.status(500).json({ message: "Lỗi xử lý lên lớp", error: err.message });
  }
};

async function promoteGrade10And11(
  currentYear,
  school_year,
  class_id,
  promoted,
  repeated
) {
  console.log(`[ClassService] Bắt đầu xử lý chuyển lớp cho ${class_id}`);

  const cls = await Class.findOne({ class_id });
  if (!cls) {
    console.log(`[ClassService] Không tìm thấy lớp ${class_id}`);
    return [
      { class_id, status: "failed", error: `Không tìm thấy lớp ${class_id}` },
    ];
  }

  console.log(`[ClassService] Tìm thấy lớp:`, cls);

  if (cls.is_graduated) {
    console.log(`[ClassService] Lớp ${class_id} đã tốt nghiệp`);
    return [
      {
        class_id,
        status: "failed",
        error: "Lớp đã tốt nghiệp, không thể chuyển lớp",
      },
    ];
  }

  const parsed = extractGradeAndSuffix(cls.class_id);
  console.log(
    `[ClassService] Parsed grade and suffix for ${cls.class_id}:`,
    parsed
  );
  if (!parsed || parsed.grade >= 12) {
    console.log(
      `[ClassService] Lớp ${class_id} không hợp lệ để chuyển (grade >= 12)`
    );
    return [
      {
        class_id,
        status: "failed",
        error: "Lớp không hợp lệ để chuyển (cấp lớp >= 12)",
      },
    ];
  }

  console.log(`[ClassService] Lớp hợp lệ, bắt đầu giao dịch cho ${class_id}`);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const promotedIds = promoted.map(
      (item) => new mongoose.Types.ObjectId(item.student_id)
    );
    const repeatedIds = repeated.map(
      (item) => new mongoose.Types.ObjectId(item.student_id)
    );

    console.log(`[ClassService] Promoted IDs:`, promotedIds);
    console.log(`[ClassService] Repeated IDs:`, repeatedIds);

    const classMembers = cls.class_member.map((id) => id.toString());
    console.log(`[ClassService] Class Members:`, classMembers);

    const invalidPromoted = promotedIds.filter(
      (id) => !classMembers.includes(id.toString())
    );
    const invalidRepeated = repeatedIds.filter(
      (id) => !classMembers.includes(id.toString())
    );

    if (invalidPromoted.length > 0 || invalidRepeated.length > 0) {
      throw new Error(
        `Một số học sinh không thuộc lớp ${class_id}: Promoted: ${invalidPromoted.join(
          ", "
        )}, Repeated: ${invalidRepeated.join(", ")}`
      );
    }

    const newGrade = parsed.grade + 1;
    const newClassId = `${newGrade}${parsed.suffix}`;
    console.log(`[ClassService] Tạo hoặc cập nhật lớp mới: ${newClassId}`);

    let newClass = await Class.findOne({ class_id: newClassId });
    if (!newClass) {
      newClass = new Class({
        class_id: newClassId,
        class_name: newClassId,
        class_teacher: cls.class_teacher,
        class_member: [],
        subject_teacher: cls.subject_teacher,
        graduation_year: cls.graduation_year,
        is_graduated: newGrade === 12,
      });
      await newClass.save({ session });
      console.log(`[ClassService] Đã tạo lớp mới: ${newClassId}`);
    }

    newClass.class_member = [
      ...new Set([...newClass.class_member, ...promotedIds]),
    ];
    await newClass.save({ session });
    console.log(
      `[ClassService] Đã cập nhật lớp ${newClassId} với thành viên:`,
      newClass.class_member
    );

    cls.class_member = repeatedIds;
    await cls.save({ session });
    console.log(
      `[ClassService] Đã cập nhật lớp ${class_id} với thành viên còn lại:`,
      cls.class_member
    );

    const updatedCls = await Class.findOne({ class_id }).session(session);
    const updatedNewClass = await Class.findOne({
      class_id: newClassId,
    }).session(session);
    console.log(
      `[ClassService] Xác nhận trong giao dịch - Lớp ${class_id}:`,
      updatedCls.class_member
    );
    console.log(
      `[ClassService] Xác nhận trong giao dịch - Lớp ${newClassId}:`,
      updatedNewClass.class_member
    );

    await session.commitTransaction();
    console.log(`[ClassService] Giao dịch hoàn tất cho lớp ${class_id}`);

    const finalCls = await Class.findOne({ class_id });
    const finalNewClass = await Class.findOne({ class_id: newClassId });
    console.log(
      `[ClassService] Xác nhận sau commit - Lớp ${class_id}:`,
      finalCls.class_member
    );
    console.log(
      `[ClassService] Xác nhận sau commit - Lớp ${newClassId}:`,
      finalNewClass.class_member
    );

    return [
      {
        class_id: cls.class_id,
        status: "success",
        promoted: promotedIds.length,
        repeated: repeatedIds.length,
      },
    ];
  } catch (err) {
    await session.abortTransaction();
    console.error(`[ClassService LỖI] ❌ Lớp ${class_id}:`, err.message);
    return [{ class_id, status: "failed", error: err.message }];
  } finally {
    session.endSession();
  }
}

exports.approval = async (req, res) => {
  try {
    const { class_id, class_name, school_year, students } = req.body;

    if (
      !class_id ||
      !class_name ||
      !school_year ||
      !students ||
      !Array.isArray(students) ||
      students.length === 0
    ) {
      return res.status(400).json({
        message: "Thiếu thông tin lớp, năm học hoặc danh sách học sinh.",
      });
    }

    if (!/^\d{4}-\d{4}$/.test(school_year)) {
      return res.status(400).json({
        message: "Định dạng năm học không hợp lệ. Vui lòng dùng YYYY-YYYY.",
      });
    }

    const invalidStudent = students.find(
      (s) =>
        !s.student_id ||
        !mongoose.Types.ObjectId.isValid(s.student_id) ||
        !s.name ||
        !s.hk1?.gpa ||
        !s.hk1?.behavior ||
        !s.hk2?.gpa ||
        !s.hk2?.behavior
    );
    if (invalidStudent) {
      return res.status(400).json({
        message:
          "Dữ liệu học sinh không hợp lệ. Vui lòng kiểm tra student_id, GPA và hạnh kiểm.",
      });
    }

    const approval = new Approval({
      class_id,
      class_name,
      school_year,
      students,
      submitted_by: req.userId,
    });

    await approval.save();

    res.status(201).json({
      message: "Đã gửi danh sách để duyệt thành công.",
      approvalId: approval._id,
    });
  } catch (error) {
    console.error("Lỗi khi gửi duyệt:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getApprovalPending = async (req, res) => {
  try {
    const pendingApprovals = await Approval.find({ status: "pending" }).lean();
    if (!pendingApprovals || pendingApprovals.length === 0) {
      return res.status(200).json([]);
    }

    const transformedApprovals = pendingApprovals.map((approval) => ({
      _id: approval._id,
      class_id: approval.class_id,
      class_name: approval.class_name,
      school_year: approval.school_year,
      students: approval.students.map((student) => ({
        _id: student.student_id,
        tdt_id: student.student_id,
        name: student.name,
        date_of_birth: "2008-01-01",
        hk1_gpa: student.hk1.gpa,
        hk1_behavior: student.hk1.behavior,
        hk2_gpa: student.hk2.gpa,
        hk2_behavior: student.hk2.behavior,
      })),
    }));

    res.status(200).json(transformedApprovals);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chờ duyệt:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.approveApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await Approval.findById(id);
    if (!approval)
      return res.status(404).json({ message: "Không tìm thấy yêu cầu duyệt." });
    if (approval.status !== "pending")
      return res
        .status(400)
        .json({ message: "Yêu cầu đã được xử lý trước đó." });

    const promotionResults = {
      class_id: approval.class_id,
      status: "success",
      promoted: [],
      repeated: [],
      error: null,
    };

    approval.students.forEach((student) => {
      const avgGpa = (student.hk1.gpa + student.hk2.gpa) / 2;
      const worstBehavior =
        ["Tốt", "Khá", "Trung bình", "Yếu"].indexOf(student.hk1.behavior) >
        ["Tốt", "Khá", "Trung bình", "Yếu"].indexOf(student.hk2.behavior)
          ? student.hk1.behavior
          : student.hk2.behavior;

      if (avgGpa >= 5.0 && worstBehavior !== "Yếu") {
        promotionResults.promoted.push({
          student_id: student.student_id.toString(),
          gpa: student.hk2.gpa,
          behavior: student.hk2.behavior,
        });
      } else {
        let reason = "";
        if (avgGpa < 5.0) reason = "GPA trung bình dưới 5.0";
        else if (worstBehavior === "Yếu") reason = "Hạnh kiểm Yếu";
        promotionResults.repeated.push({
          student_id: student.student_id.toString(),
          gpa: student.hk2.gpa,
          behavior: student.hk2.behavior,
          reason,
        });
      }
    });

    console.log("[ApprovalService] Gửi yêu cầu đến promoteClasses:", {
      school_year: approval.school_year,
      class_id: approval.class_id,
      promoted: promotionResults.promoted,
      repeated: promotionResults.repeated,
    });

    let promotionDetails = [];
    try {
      const promoteResponse = await axios.post(
        `${process.env.CLASS_SERVICE_URL}/api/classes/promote`,
        {
          school_year: approval.school_year,
          class_id: approval.class_id,
          promoted: promotionResults.promoted,
          repeated: promotionResults.repeated,
        },
        { headers: { Authorization: `Bearer ${req.token}` } }
      );
      promotionDetails = promoteResponse.data.details;

      console.log(
        "[ApprovalService] Kết quả từ promoteClasses:",
        promotionDetails
      );

      if (
        promotionDetails.length > 0 &&
        promotionDetails[0].status !== "success"
      ) {
        promotionResults.status = "failed";
        promotionResults.error =
          promotionDetails[0].error || "Chuyển lớp thất bại";
      }
    } catch (promoteError) {
      console.error(
        "[ClassService LỖI] Lỗi khi gọi promoteClasses:",
        promoteError.response?.data || promoteError.message
      );
      promotionResults.status = "failed";
      promotionResults.error =
        "Không thể chuyển lớp: " +
        (promoteError.response?.data?.message || promoteError.message);
    }

    approval.status = "approved";
    await approval.save();

    res.status(200).json({
      message: "Đã duyệt yêu cầu thành công",
      promotionResults: [promotionResults],
      promotionDetails,
    });
  } catch (error) {
    console.error("Lỗi khi duyệt yêu cầu:", error.message);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
