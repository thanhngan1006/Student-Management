// const User = require("../models/User");
// const LoginInfo = require("../models/LoginInfo");
// const mongoose = require("mongoose");
// const fs = require("fs");
// const csv = require("csv-parser");
// const xlsx = require("xlsx");
// const bcrypt = require("bcrypt");
// const axios = require("axios");

// exports.getUsersByIds = async (req, res) => {
//   try {
//     const { ids } = req.body;

//     if (!ids || !Array.isArray(ids)) {
//       return res.status(400).json({ message: "Danh sách ids không hợp lệ" });
//     }

//     const users = await User.find({ _id: { $in: ids }, role: "student" });
//     res.status(200).json(users);
//   } catch (error) {
//     console.error("Lỗi truy vấn học sinh:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getTeacherByIds = async (req, res) => {
//   try {
//     const { ids } = req.body;

//     if (!ids || !Array.isArray(ids)) {
//       return res.status(400).json({ message: "Danh sách ids không hợp lệ" });
//     }

//     const users = await User.find({ _id: { $in: ids }, role: "advisor" });
//     res.status(200).json(users);
//   } catch (error) {
//     console.error("Lỗi truy vấn học sinh:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getAllStudents = async (req, res) => {
//   const students = await User.find({ role: "student" });
//   res.json(students);
// };

// // exports.updateUserProfile = async (req, res) => {
// //   try {
// //     const userId = req.params.id;

// //     if (!mongoose.Types.ObjectId.isValid(userId)) {
// //       return res.status(400).json({ message: "ID người dùng không hợp lệ" });
// //     }

// //     const allowedFields = [
// //       "name",
// //       "phone_number",
// //       "parent_number",
// //       "address",
// //       "date_of_birth",
// //       "gender",
// //       "class_id",
// //     ];
// //     const updateData = {};

// //     allowedFields.forEach((field) => {
// //       if (req.body[field] !== undefined) {
// //         updateData[field] = req.body[field];
// //       }
// //     });

// //     if (Object.keys(updateData).length === 0) {
// //       return res
// //         .status(400)
// //         .json({ message: "Không có trường hợp lệ để cập nhật" });
// //     }

// //     const currentUser = await User.findById(userId);
// //     const oldClassId = currentUser?.class_id?.toString();

// //     const updatedUser = await User.findByIdAndUpdate(
// //       userId,
// //       { $set: updateData },
// //       { new: true, runValidators: true }
// //     );

// //     if (!updatedUser) {
// //       return res.status(404).json({ message: "Không tìm thấy người dùng" });
// //     }

// //     if ("class_id" in req.body) {
// //       if (req.body.class_id) {
// //         try {
// //           await axios.put("http://localhost:4000/api/classes/assign-teacher", {
// //             class_id: req.body.class_id,
// //             teacher_id: userId,
// //           });
// //         } catch (error) {
// //           console.error("Gán giáo viên thất bại:", error.message);
// //         }
// //       } else if (oldClassId){
// //         try {
// //           await axios.put(
// //             `http://localhost:4000/api/classes/${oldClassId}/remove-teacher`
// //           );
// //         } catch (error) {
// //           console.error("Gỡ giáo viên khỏi lớp thất bại:", error.message);
// //         }
// //       }
// //     }

// //     res.status(200).json({
// //       message: "Cập nhật thông tin thành công",
// //       user: updatedUser,
// //     });
// //   } catch (error) {
// //     console.error("Lỗi khi cập nhật user:", error.message);
// //     res.status(500).json({ message: "Lỗi server" });
// //   }
// // };

// exports.updateUserProfile = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "ID người dùng không hợp lệ" });
//     }

//     const allowedFields = [
//       "name",
//       "phone_number",
//       "parent_number",
//       "address",
//       "date_of_birth",
//       "gender",
//       "class_id", // đây là mã lớp, không phải _id
//     ];
//     const updateData = {};

//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) {
//         updateData[field] = req.body[field];
//       }
//     });

//     if (Object.keys(updateData).length === 0) {
//       return res
//         .status(400)
//         .json({ message: "Không có trường hợp lệ để cập nhật" });
//     }

//     const currentUser = await User.findById(userId);
//     const oldClassCode = currentUser?.class_id;

//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "Không tìm thấy người dùng" });
//     }

//     if ("class_id" in req.body) {
//       const newClassCode = req.body.class_id;

//       // Gỡ khỏi lớp cũ nếu có
//       if (oldClassCode) {
//         try {
//           // Truy vấn sang service lớp để tìm _id của lớp cũ theo class_id
//           const resOld = await axios.get(
//             `http://localhost:4000/api/${oldClassCode}`
//           );
//           const oldClassDocId = resOld.data.class._id;

//           await axios.put(
//             `http://localhost:4000/api/classes/${oldClassDocId}/remove-teacher`
//           );
//         } catch (error) {
//           console.error("Gỡ giáo viên khỏi lớp cũ thất bại:", error.message);
//         }
//       }

//       // Gán vào lớp mới nếu có
//       if (newClassCode) {
//         try {
//           await axios.put("http://localhost:4000/api/classes/assign-teacher", {
//             class_id: newClassCode, // mã lớp
//             teacher_id: userId,
//           });
//         } catch (error) {
//           console.error("Gán giáo viên vào lớp mới thất bại:", error.message);
//         }
//       }
//     }

//     res.status(200).json({
//       message: "Cập nhật thông tin thành công",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Lỗi khi cập nhật user:", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     if (!user)
//       return res.status(404).json({ message: "Không tìm thấy người dùng" });

//     res.status(200).json(user);
//   } catch (err) {
//     res.status(500).json({ message: "Lỗi server khi lấy user" });
//   }
// };

// exports.getAllAdvisors = async (req, res) => {
//   try {
//     const advisors = await User.find({ role: "advisor" });
//     res.status(200).json(advisors);
//   } catch (error) {
//     console.error("[GET ALL ADVISORS ERROR]:", error);
//     res
//       .status(500)
//       .json({ message: "Lỗi server khi lấy user", error: error.message });
//   }
// };

// exports.getUserByTdtId = async (req, res) => {
//   try {
//     const user = await User.findOne({ tdt_id: req.params.tdt_id });

//     if (!user) {
//       return res.status(404).json({ message: "Không tìm thấy người dùng" });
//     }

//     res.status(200).json(user);
//   } catch (err) {
//     console.error("[ERROR] Lấy user theo tdt_id:", err.message);
//     res.status(500).json({ message: "Lỗi server khi lấy người dùng" });
//   }
// };

// exports.getUserIdsByEmails = async (req, res) => {
//   try {
//     const { emails } = req.body;
//     if (!Array.isArray(emails))
//       return res.status(400).json({ message: "Danh sách emails không hợp lệ" });

//     const users = await User.find({ email: { $in: emails } }, "_id");
//     const userIds = users.map((u) => u._id);

//     res.status(200).json({ userIds });
//   } catch (error) {
//     console.error("[Get User IDs ERROR]", error.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.importUsersFromFile = async (req, res) => {
//   try {
//     const { class_id } = req.body;
//     if (!req.file) {
//       return res
//         .status(400)
//         .json({ message: "Vui lòng chọn file CSV hoặc XLSX" });
//     }

//     const filePath = req.file.path;
//     const ext = req.file.originalname.split(".").pop();
//     let users = [];

//     if (ext === "csv") {
//       const rows = [];
//       fs.createReadStream(filePath)
//         .pipe(csv())
//         .on("data", (row) => rows.push(row))
//         .on("end", async () => {
//           await insertUsers(rows, res);
//         });
//     } else if (ext === "xlsx") {
//       const workbook = xlsx.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       users = xlsx.utils.sheet_to_json(sheet);
//       await insertUsers(users, res);
//     } else {
//       return res.status(400).json({
//         message: "Định dạng file không hợp lệ (chỉ hỗ trợ csv hoặc xlsx)",
//       });
//     }
//   } catch (err) {
//     console.error("[Import Users ERROR]", err.message);
//     res.status(500).json({ message: "Lỗi server khi import" });
//   }
// };

// exports.importAdvisors = async (req, res) => {
//   try {
//     if (!req.file)
//       return res
//         .status(400)
//         .json({ message: "Vui lòng tải lên file CSV hoặc XLSX" });

//     const ext = req.file.originalname.split(".").pop().toLowerCase();
//     let data = [];

//     if (ext === "csv") {
//       const rows = [];
//       fs.createReadStream(req.file.path)
//         .pipe(csv())
//         .on("data", (row) => rows.push(row))
//         .on("end", async () => {
//           console.log("[DEBUG] Đọc CSV xong:", rows.length, "dòng");
//           await insertUsers(rows, res);
//         });
//     } else if (ext === "xlsx") {
//       const workbook = xlsx.readFile(req.file.path);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       data = xlsx.utils.sheet_to_json(sheet);
//       console.log("[DEBUG] Đọc XLSX xong:", data.length, "dòng");
//       await insertUsers(data, res);
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Định dạng file không hợp lệ (chỉ .csv hoặc .xlsx)" });
//     }
//   } catch (err) {
//     console.error("[Import Users ERROR]", err.message);
//     res.status(500).json({ message: "Lỗi server khi import users" });
//   }
// };

// async function insertUsers(users, res) {
//   const inserted = [];

//   for (const u of users) {
//     const {
//       email,
//       address,
//       name,
//       role,
//       tdt_id,
//       gender,
//       phone_number,
//       date_of_birth,
//       parent_number,
//       parent_email
//     } = u;

//     if (
//       !email ||
//       !name ||
//       !tdt_id ||
//       !gender ||
//       !phone_number ||
//       !date_of_birth
//     ) {
//       console.log("[BỎ QUA]", u);
//       continue;
//     }

//     const exists = await User.findOne({ $or: [{ email }, { tdt_id }] });
//     if (exists) {
//       console.log("[ĐÃ TỒN TẠI]", email);
//       continue;
//     }

//     let trimmedRole = "student";
//     if (Array.isArray(role)) {
//       trimmedRole = role[0]?.trim().toLowerCase();
//     } else if (typeof role === "string") {
//       trimmedRole = role.trim().toLowerCase();
//     }

//     let advisor_type = undefined;
//     if (trimmedRole === 'advisor') {
//       advisor_type = ['subject_teacher'];
//     }

//     const newUser = new User({
//       email: email.trim(),
//       address: address?.trim() || "",
//       name: name.trim(),
//       role: trimmedRole,
//       advisor_type: trimmedRole === 'advisor' ? ['subject_teacher'] : undefined,
//       tdt_id: tdt_id.trim(),
//       gender: gender.trim(),
//       phone_number: phone_number.trim(),
//       date_of_birth: new Date(date_of_birth),
//     });

//     if (trimmedRole === "student") {
//       if (parent_number) newUser.parent_number = parent_number.trim();
//       if (parent_email) newUser.parent_email = parent_email.trim();
//     }

//     const savedUser = await newUser.save();

//     if (["student", "advisor"].includes(trimmedRole)) {
//       const existedLogin = await LoginInfo.findOne({ username: tdt_id.trim() });
//       if (!existedLogin) {
//         try {
//           const hashedPassword = await bcrypt.hash(tdt_id.trim(), 10);
//           const loginInfo = new LoginInfo({
//             user_id: savedUser._id,
//             username: tdt_id.trim(),
//             password: hashedPassword,
//           });
//           await loginInfo.save();
//         } catch (e) {
//           console.error(
//             "[UserService LỖI] [LỖI tạo loginInfo]",
//             tdt_id,
//             e.message
//           );
//         }
//       } else {
//         console.log(`[SKIP] loginInfo đã tồn tại: ${tdt_id}`);
//       }
//     }

//     inserted.push(savedUser);
//   }

//   res
//     .status(200)
//     .json({ message: `Đã thêm ${inserted.length} người dùng`, inserted });
// }

// exports.deleteAdvisor = async (req, res) => {
//   try {
//     const userId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "ID không hợp lệ" });
//     }

//     const advisor = await User.findOne({ _id: userId, role: "advisor" });
//     if (!advisor) {
//       return res.status(404).json({ message: "Không tìm thấy giáo viên" });
//     }

//     const classServiceUrl =
//       "http://localhost:4000/api/classes/by-teacher/" + userId;
//     try {
//       const classRes = await axios.get(classServiceUrl);

//       const classData = classRes.data;
//       if (classData && classData._id) {
//         await axios.put(
//           `http://localhost:4000/api/classes/${classData._id}/remove-teacher`,
//           {
//             reason: "Xóa giáo viên",
//           }
//         );
//       }
//     } catch (err) {
//       console.warn(
//         "Không tìm thấy lớp có giáo viên:",
//         err?.response?.data || err.message
//       );
//     }

//     await User.findByIdAndDelete(userId);
//     await LoginInfo.findOneAndDelete({ user_id: userId });

//     return res.status(200).json({ message: "Xoá giáo viên thành công" });
//   } catch (error) {
//     console.error("Lỗi khi xoá giáo viên:", error.message);
//     return res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.addStudentByAdmin = async (req, res) => {
//   try {
//     const {
//       name,
//       tdt_id,
//       gender,
//       phone_number,
//       parent_number,
//       address,
//       date_of_birth,
//     } = req.body;

//     if (!name || !tdt_id || !gender || !phone_number || !date_of_birth) {
//       return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
//     }
//     const email = `${tdt_id}@student.tdtu.edu.vn`;
//     const existingUser = await User.findOne({
//       $or: [{ tdt_id }, { email }],
//     });

//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ message: "Học sinh đã tồn tại trong hệ thống" });
//     }

//     const newUser = new User({
//       name,
//       tdt_id,
//       gender,
//       phone_number,
//       parent_number,
//       address,
//       date_of_birth: new Date(date_of_birth),
//       email,
//       role: "student",
//     });

//     const savedUser = await newUser.save();

//     const hashedPassword = await bcrypt.hash(tdt_id, 10);
//     const loginInfo = new LoginInfo({
//       user_id: savedUser._id,
//       username: tdt_id,
//       password: hashedPassword,
//     });

//     await loginInfo.save();

//     res.status(201).json({
//       message: "Thêm học sinh thành công",
//       student: savedUser,
//     });
//   } catch (error) {
//     console.error("[ADD STUDENT ERROR]:", error.message);
//     res.status(500).json({ message: "Lỗi server khi thêm học sinh" });
//   }
// };

// exports.addAdvisorByAdmin = async (req, res) => {
//   try {
//     const {
//       name,
//       tdt_id,
//       gender: rawGender,
//       phone_number,
//       address,
//       class_id,
//       date_of_birth,
//     } = req.body;
//     console.log(req.body);
//     function normalizeNameToEmail(name) {
//       return name
//         .normalize("NFD")
//         .replace(/[\u0300-\u036f]/g, "")
//         .replace(/đ/g, "d")
//         .replace(/Đ/g, "d")
//         .replace(/\s+/g, "")
//         .toLowerCase();
//     }

//     let gender = rawGender;
//     if (gender === "Nam") gender = "male";
//     else if (gender === "Nữ") gender = "female";

//     const email = `${normalizeNameToEmail(name)}@tdtu.edu.vn`;

//     if (!name || !tdt_id || !gender || !phone_number || !date_of_birth) {
//       return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
//     }

//     const existed = await User.findOne({ $or: [{ email }, { tdt_id }] });
//     if (existed) {
//       return res.status(400).json({ message: "Mã giáo viên đã tồn tại" });
//     }

//     const newUser = new User({
//       name,
//       tdt_id,
//       gender,
//       phone_number,
//       address,
//       advisor_type: ['subject_teacher'],
//       date_of_birth: new Date(date_of_birth),
//       email,
//       role: "advisor",
//     });

//     const savedUser = await newUser.save();

//     const hashedPassword = await bcrypt.hash(tdt_id, 10);
//     await LoginInfo.create({
//       user_id: savedUser._id,
//       username: tdt_id,
//       password: hashedPassword,
//     });

//     if (class_id) {
//       try {
//         await axios.put(`http://localhost:4000/api/classes/assign-teacher`, {
//           class_id: class_id,
//           teacher_id: savedUser._id,
//         });
//       } catch (err) {
//         console.error("[CLASS SERVICE ERROR]:", err.message);
//         return res.status(500).json({
//           message: "Tạo giáo viên thành công, nhưng gán lớp thất bại",
//           advisor: savedUser,
//         });
//       }
//     }

//     res.status(200).json({
//       message: "Thêm giáo viên thành công",
//       advisor: savedUser,
//     });
//   } catch (err) {
//     console.error("[ADD ADVISOR ERROR]:", err.message);
//     res.status(500).json({ message: "Lỗi server khi thêm giáo viên" });
//   }
// };

// exports.fullDeleteStudent = async (req, res) => {
//   const studentId = req.params.id;

//   try {
//     try {
//       await axios.delete(
//         `http://localhost:4000/api/classes/remove-student-if-exists/${studentId}`
//       );
//     } catch (removeErr) {
//       console.warn("Không xóa khỏi lớp được (có thể vì không thuộc lớp):", removeErr.message);
//     }

//     await User.findByIdAndDelete(studentId);
//     await LoginInfo.findOneAndDelete({ user_id: studentId });

//     res.status(200).json({ message: "Đã xoá học sinh khỏi lớp và hệ thống" });
//   } catch (error) {
//     console.error("Lỗi xoá học sinh:", error.message);
//     res.status(500).json({ message: "Không thể xoá học sinh" });
//   }
// };

// exports.addHomeroomTeacher = async (req, res) => {
//   try {
//     const id = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "ID không hợp lệ" });
//     }

//     const user = await User.findById(id);

//     if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

//     if (user.role !== 'advisor') {
//       return res.status(400).json({ message: "Người dùng không phải là advisor" });
//     }

//     if (!user.advisor_type.includes('homeroom_teacher')) {
//       user.advisor_type.push('homeroom_teacher');
//       await user.save();
//     }

//     res.status(200).json({ message: "Đã thêm homeroom_teacher vào advisor_type", user });
//   } catch (err) {
//     console.error("Lỗi khi cập nhật advisor_type:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.removeHomeroomTeacher = async (req, res) => {
//   try {
//     const id = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "ID không hợp lệ" });
//     }

//     const user = await User.findById(id);

//     if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });

//     if (user.role !== 'advisor') {
//       return res.status(400).json({ message: "Người dùng không phải là advisor" });
//     }

//     if (user.advisor_type.includes('homeroom_teacher')) {
//       user.advisor_type = user.advisor_type.filter(type => type !== 'homeroom_teacher');
//       await user.save();
//     }

//     res.status(200).json({
//       message: "Đã xóa homeroom_teacher khỏi advisor_type (nếu có)",
//       user,
//     });
//   } catch (err) {
//     console.error("Lỗi khi cập nhật advisor_type:", err.message);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.graduated = async (req, res) => {
//   try {
//     const { student_ids, graduation_year } = req.body;

//     await User.updateMany(
//       { _id: { $in: student_ids }, role: 'student' },
//       {
//         $set: {
//           status: 'graduated',
//           graduation_year: graduation_year
//         }
//       }
//     );

//     res.json({ message: 'Students updated successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to update students' });
//   }
// };

// exports.addRepeatYear = async (req, res) => {
//   const { grade, school_year } = req.body;

//   try {
//     const user = await User.findById(req.params.id);

//     if (!user || user.role !== "student") {
//       return res.status(404).json({ message: "Không tìm thấy học sinh" });
//     }

//     user.repeat_years.push({ grade, school_year });
//     await user.save();

//     return res.status(200).json({ message: "Ghi nhận lưu ban thành công" });

//   } catch (err) {
//     console.error("Lỗi ghi nhận lưu ban:", err.message);
//     return res.status(500).json({ message: "Lỗi server" });
//   }
// };

const User = require("../models/User");
const LoginInfo = require("../models/LoginInfo");
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const bcrypt = require("bcrypt");
const axios = require("axios");
require("dotenv").config();

exports.getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Danh sách ids không hợp lệ" });
    }

    const users = await User.find({ _id: { $in: ids }, role: "student" });
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi truy vấn học sinh:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getTeacherByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Danh sách ids không hợp lệ" });
    }

    const users = await User.find({ _id: { $in: ids }, role: "advisor" });
    res.status(200).json(users);
  } catch (error) {
    console.error("Lỗi truy vấn giáo viên:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getAllStudents = async (req, res) => {
  const students = await User.find({ role: "student" });
  res.json(students);
};

exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID người dùng không hợp lệ" });
    }

    const allowedFields = [
      "name",
      "phone_number",
      "parent_number",
      "address",
      "date_of_birth",
      "gender",
      "class_id",
    ];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "Không có trường hợp lệ để cập nhật" });
    }

    const currentUser = await User.findById(userId);
    const oldClassCode = currentUser?.class_id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if ("class_id" in req.body) {
      const newClassCode = req.body.class_id;

      if (oldClassCode) {
        try {
          const resOld = await axios.get(
            `${process.env.CLASS_SERVICE_URL}/api/${oldClassCode}`
          );
          const oldClassDocId = resOld.data.class._id;

          await axios.put(
            `${process.env.CLASS_SERVICE_URL}/api/classes/${oldClassDocId}/remove-teacher`
          );
        } catch (error) {
          console.error("Gỡ giáo viên khỏi lớp cũ thất bại:", error.message);
        }
      }

      if (newClassCode) {
        try {
          await axios.put(
            `${process.env.CLASS_SERVICE_URL}/api/classes/assign-teacher`,
            {
              class_id: newClassCode,
              teacher_id: userId,
            }
          );
        } catch (error) {
          console.error("Gán giáo viên vào lớp mới thất bại:", error.message);
        }
      }
    }

    res.status(200).json({
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật user:", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy user" });
  }
};

exports.getAllAdvisors = async (req, res) => {
  try {
    const advisors = await User.find({ role: "advisor" });
    res.status(200).json(advisors);
  } catch (error) {
    console.error("[GET ALL ADVISORS ERROR]:", error);
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy user", error: error.message });
  }
};

exports.getUserByTdtId = async (req, res) => {
  try {
    const user = await User.findOne({ tdt_id: req.params.tdt_id });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("[ERROR] Lấy user theo tdt_id:", err.message);
    res.status(500).json({ message: "Lỗi server khi lấy người dùng" });
  }
};

exports.getUserIdsByEmails = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails))
      return res.status(400).json({ message: "Danh sách emails không hợp lệ" });

    const users = await User.find({ email: { $in: emails } }, "_id");
    const userIds = users.map((u) => u._id);

    res.status(200).json({ userIds });
  } catch (error) {
    console.error("[Get User IDs ERROR]", error.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.importUsersFromFile = async (req, res) => {
  try {
    const { class_id } = req.body;
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn file CSV hoặc XLSX" });
    }

    const filePath = req.file.path;
    const ext = req.file.originalname.split(".").pop();
    let users = [];

    if (ext === "csv") {
      const rows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", async () => {
          await insertUsers(rows, res);
        });
    } else if (ext === "xlsx") {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      users = xlsx.utils.sheet_to_json(sheet);
      await insertUsers(users, res);
    } else {
      return res.status(400).json({
        message: "Định dạng file không hợp lệ (chỉ hỗ trợ csv hoặc xlsx)",
      });
    }
  } catch (err) {
    console.error("[Import Users ERROR]", err.message);
    res.status(500).json({ message: "Lỗi server khi import" });
  }
};

exports.importAdvisors = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ message: "Vui lòng tải lên file CSV hoặc XLSX" });

    const ext = req.file.originalname.split(".").pop().toLowerCase();
    let data = [];

    if (ext === "csv") {
      const rows = [];
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", async () => {
          console.log("[DEBUG] Đọc CSV xong:", rows.length, "dòng");
          await insertUsers(rows, res);
        });
    } else if (ext === "xlsx") {
      const workbook = xlsx.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      data = xlsx.utils.sheet_to_json(sheet);
      console.log("[DEBUG] Đọc XLSX xong:", data.length, "dòng");
      await insertUsers(data, res);
    } else {
      return res
        .status(400)
        .json({ message: "Định dạng file không hợp lệ (chỉ .csv hoặc .xlsx)" });
    }
  } catch (err) {
    console.error("[Import Users ERROR]", err.message);
    res.status(500).json({ message: "Lỗi server khi import users" });
  }
};

async function insertUsers(users, res) {
  const inserted = [];

  for (const u of users) {
    const {
      email,
      address,
      name,
      role,
      tdt_id,
      gender,
      phone_number,
      date_of_birth,
      parent_number,
      parent_email,
    } = u;

    if (
      !email ||
      !name ||
      !tdt_id ||
      !gender ||
      !phone_number ||
      !date_of_birth
    ) {
      console.log("[BỎ QUA]", u);
      continue;
    }

    const exists = await User.findOne({ $or: [{ email }, { tdt_id }] });
    if (exists) {
      console.log("[ĐÃ TỒN TẠI]", email);
      continue;
    }

    let trimmedRole = "student";
    if (Array.isArray(role)) {
      trimmedRole = role[0]?.trim().toLowerCase();
    } else if (typeof role === "string") {
      trimmedRole = role.trim().toLowerCase();
    }

    let advisor_type = undefined;
    if (trimmedRole === "advisor") {
      advisor_type = ["subject_teacher"];
    }

    const newUser = new User({
      email: email.trim(),
      address: address?.trim() || "",
      name: name.trim(),
      role: trimmedRole,
      advisor_type: trimmedRole === "advisor" ? ["subject_teacher"] : undefined,
      tdt_id: tdt_id.trim(),
      gender: gender.trim(),
      phone_number: phone_number.trim(),
      date_of_birth: new Date(date_of_birth),
    });

    if (trimmedRole === "student") {
      if (parent_number) newUser.parent_number = parent_number.trim();
      if (parent_email) newUser.parent_email = parent_email.trim();
    }

    const savedUser = await newUser.save();

    if (["student", "advisor"].includes(trimmedRole)) {
      const existedLogin = await LoginInfo.findOne({ username: tdt_id.trim() });
      if (!existedLogin) {
        try {
          const hashedPassword = await bcrypt.hash(tdt_id.trim(), 10);
          const loginInfo = new LoginInfo({
            user_id: savedUser._id,
            username: tdt_id.trim(),
            password: hashedPassword,
          });
          await loginInfo.save();
        } catch (e) {
          console.error(
            "[UserService LỖI] [LỖI tạo loginInfo]",
            tdt_id,
            e.message
          );
        }
      } else {
        console.log(`[SKIP] loginInfo đã tồn tại: ${tdt_id}`);
      }
    }

    inserted.push(savedUser);
  }

  res
    .status(200)
    .json({ message: `Đã thêm ${inserted.length} người dùng`, inserted });
}

exports.deleteAdvisor = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const advisor = await User.findOne({ _id: userId, role: "advisor" });
    if (!advisor) {
      return res.status(404).json({ message: "Không tìm thấy giáo viên" });
    }

    const classServiceUrl = `${process.env.CLASS_SERVICE_URL}/api/classes/by-teacher/${userId}`;
    try {
      const classRes = await axios.get(classServiceUrl);

      const classData = classRes.data;
      if (classData && classData._id) {
        await axios.put(
          `${process.env.CLASS_SERVICE_URL}/api/classes/${classData._id}/remove-teacher`,
          {
            reason: "Xóa giáo viên",
          }
        );
      }
    } catch (err) {
      console.warn(
        "Không tìm thấy lớp có giáo viên:",
        err?.response?.data || err.message
      );
    }

    await User.findByIdAndDelete(userId);
    await LoginInfo.findOneAndDelete({ user_id: userId });

    return res.status(200).json({ message: "Xoá giáo viên thành công" });
  } catch (error) {
    console.error("Lỗi khi xoá giáo viên:", error.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

exports.addStudentByAdmin = async (req, res) => {
  try {
    const {
      name,
      tdt_id,
      gender,
      phone_number,
      parent_number,
      address,
      date_of_birth,
    } = req.body;

    if (!name || !tdt_id || !gender || !phone_number || !date_of_birth) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }
    const email = `${tdt_id}@student.tdtu.edu.vn`;
    const existingUser = await User.findOne({
      $or: [{ tdt_id }, { email }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Học sinh đã tồn tại trong hệ thống" });
    }

    const newUser = new User({
      name,
      tdt_id,
      gender,
      phone_number,
      parent_number,
      address,
      date_of_birth: new Date(date_of_birth),
      email,
      role: "student",
    });

    const savedUser = await newUser.save();

    const hashedPassword = await bcrypt.hash(tdt_id, 10);
    const loginInfo = new LoginInfo({
      user_id: savedUser._id,
      username: tdt_id,
      password: hashedPassword,
    });

    await loginInfo.save();

    res.status(201).json({
      message: "Thêm học sinh thành công",
      student: savedUser,
    });
  } catch (error) {
    console.error("[ADD STUDENT ERROR]:", error.message);
    res.status(500).json({ message: "Lỗi server khi thêm học sinh" });
  }
};

exports.addAdvisorByAdmin = async (req, res) => {
  try {
    const {
      name,
      tdt_id,
      gender: rawGender,
      phone_number,
      address,
      class_id,
      date_of_birth,
    } = req.body;
    console.log(req.body);
    function normalizeNameToEmail(name) {
      return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/\s+/g, "")
        .toLowerCase();
    }

    let gender = rawGender;
    if (gender === "Nam") gender = "male";
    else if (gender === "Nữ") gender = "female";

    const email = `${normalizeNameToEmail(name)}@tdtu.edu.vn`;

    if (!name || !tdt_id || !gender || !phone_number || !date_of_birth) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const existed = await User.findOne({ $or: [{ email }, { tdt_id }] });
    if (existed) {
      return res.status(400).json({ message: "Mã giáo viên đã tồn tại" });
    }

    const newUser = new User({
      name,
      tdt_id,
      gender,
      phone_number,
      address,
      advisor_type: ["subject_teacher"],
      date_of_birth: new Date(date_of_birth),
      email,
      role: "advisor",
    });

    const savedUser = await newUser.save();

    const hashedPassword = await bcrypt.hash(tdt_id, 10);
    await LoginInfo.create({
      user_id: savedUser._id,
      username: tdt_id,
      password: hashedPassword,
    });

    if (class_id) {
      try {
        await axios.put(
          `${process.env.CLASS_SERVICE_URL}/api/classes/assign-teacher`,
          {
            class_id: class_id,
            teacher_id: savedUser._id,
          }
        );
      } catch (err) {
        console.error("[CLASS SERVICE ERROR]:", err.message);
        return res.status(500).json({
          message: "Tạo giáo viên thành công, nhưng gán lớp thất bại",
          advisor: savedUser,
        });
      }
    }

    res.status(200).json({
      message: "Thêm giáo viên thành công",
      advisor: savedUser,
    });
  } catch (err) {
    console.error("[ADD ADVISOR ERROR]:", err.message);
    res.status(500).json({ message: "Lỗi server khi thêm giáo viên" });
  }
};

exports.fullDeleteStudent = async (req, res) => {
  const studentId = req.params.id;

  try {
    try {
      await axios.delete(
        `${process.env.CLASS_SERVICE_URL}/api/classes/remove-student-if-exists/${studentId}`
      );
    } catch (removeErr) {
      console.warn(
        "Không xóa khỏi lớp được (có thể vì không thuộc lớp):",
        removeErr.message
      );
    }

    await User.findByIdAndDelete(studentId);
    await LoginInfo.findOneAndDelete({ user_id: studentId });

    res.status(200).json({ message: "Đã xoá học sinh khỏi lớp và hệ thống" });
  } catch (error) {
    console.error("Lỗi xoá học sinh:", error.message);
    res.status(500).json({ message: "Không thể xoá học sinh" });
  }
};

exports.addHomeroomTeacher = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const user = await User.findById(id);

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role !== "advisor") {
      return res
        .status(400)
        .json({ message: "Người dùng không phải là advisor" });
    }

    if (!user.advisor_type.includes("homeroom_teacher")) {
      user.advisor_type.push("homeroom_teacher");
      await user.save();
    }

    res
      .status(200)
      .json({ message: "Đã thêm homeroom_teacher vào advisor_type", user });
  } catch (err) {
    console.error("Lỗi khi cập nhật advisor_type:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.removeHomeroomTeacher = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    const user = await User.findById(id);

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    if (user.role !== "advisor") {
      return res
        .status(400)
        .json({ message: "Người dùng không phải là advisor" });
    }

    if (user.advisor_type.includes("homeroom_teacher")) {
      user.advisor_type = user.advisor_type.filter(
        (type) => type !== "homeroom_teacher"
      );
      await user.save();
    }

    res.status(200).json({
      message: "Đã xóa homeroom_teacher khỏi advisor_type (nếu có)",
      user,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật advisor_type:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.graduated = async (req, res) => {
  try {
    const { student_ids, graduation_year } = req.body;

    await User.updateMany(
      { _id: { $in: student_ids }, role: "student" },
      {
        $set: {
          status: "graduated",
          graduation_year: graduation_year,
        },
      }
    );

    res.json({ message: "Students updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update students" });
  }
};

exports.addRepeatYear = async (req, res) => {
  const { grade, school_year } = req.body;

  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "student") {
      return res.status(404).json({ message: "Không tìm thấy học sinh" });
    }

    user.repeat_years.push({ grade, school_year });
    await user.save();

    return res.status(200).json({ message: "Ghi nhận lưu ban thành công" });
  } catch (err) {
    console.error("Lỗi ghi nhận lưu ban:", err.message);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
