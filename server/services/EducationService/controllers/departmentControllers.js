// const Department = require("../models/Department");
// const mongoose = require("mongoose");
// const axios = require("axios");
// const Subject = require("../models/Subject");

// exports.getAllDepartment = async (req, res) => {
//     try {
//       const departments = await Department.find()
//         .populate('members.subject_id', 'subject_name')
//         .lean();

//       const result = departments.map(dep => ({
//         _id: dep._id,
//         name: dep.name,
//         code: dep.code,
//         email: dep.email,
//         phone_number: dep.phone_number,
//         officeLocation: dep.officeLocation,
//         headofDepartment: dep.headofDepartment,
//         members: dep.members.map(member => ({
//           subject_id: member.subject_id?._id,
//           subject_name: member.subject_id?.subject_name,
//           subject_code: member.subject_code,
//           users: member.users
//         }))
//       }));

//       res.json(result);
//     } catch (err) {
//       res.status(500).json({ message: 'Server error', error: err.message });
//     }
// };

// exports.getDepartmentDetail = async (req, res) => {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({ message: "ID tổ không hợp lệ" });
//     }

//     try {
//         const department = await Department.findById(new mongoose.Types.ObjectId(id)).lean();
//         if (!department) {
//         return res.status(404).json({ message: "Không tìm thấy tổ." });
//         }

//         let headofDepartmentInfo = null;
//         try {
//             const headRes = await axios.get(`http://localhost:4003/api/users/${department.headofDepartment}`);
//             headofDepartmentInfo = headRes.data;
//         } catch (error) {
//             console.error("Lỗi khi gọi userService lấy tổ trưởng:", error.message);
//         }

//         // Duyệt qua từng member để lấy thông tin user và subject_name
//         const enrichedMembers = await Promise.all(
//         department.members.map(async (member) => {
//             // Lấy tên môn học nếu cần
//             const subject = await Subject.findById(member.subject_id).lean();
//             const subject_name = subject?.subject_name || "Không rõ";

//             // Lấy thông tin users
//             const userInfos = await Promise.all(
//             member.users.map(async (userId) => {
//                 try {
//                 const response = await axios.get(
//                     `http://localhost:4003/api/users/${userId}`
//                 );
//                 return response.data;
//                 } catch (error) {
//                 console.error("Lỗi khi gọi userService:", error.message);
//                 return null;
//                 }
//             })
//             );

//             return {
//             subject_id: member.subject_id,
//             subject_code: member.subject_code,
//             subject_name,
//             users: userInfos.filter(Boolean), // loại bỏ null nếu lỗi
//             };
//         })
//         );

//         return res.json({
//         ...department,
//         headofDepartmentInfo,
//         members: enrichedMembers,
//         });
//     } catch (err) {
//         console.error("Lỗi khi lấy chi tiết phòng ban:", err);
//         return res.status(500).json({ message: "Lỗi server." });
//     }
// };

// exports.addTeacherToDepartment = async (req, res) => {
//     try {
//       const { email, subject_id } = req.body;
//       const { departmentId } = req.params;

//       if (!email || !subject_id) {
//         return res.status(400).json({ message: "Thiếu email hoặc subject_id" });
//       }

//       // Gọi sang UserService để lấy user_id từ email
//       const userRes = await axios.post("http://localhost:4003/api/users/get-ids-by-emails", {
//         emails: [email.trim()],
//       });
//       const userId = userRes.data.userIds?.[0];

//       if (!userId) {
//         return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });
//       }

//       const existingDepartment = await Department.findOne({
//         _id: { $ne: departmentId }, // Loại trừ chính phòng ban hiện tại
//         members: {
//           $elemMatch: {
//             users: userId,
//           },
//         },
//       });

//       if (existingDepartment) {
//         return res.status(400).json({ message: "Giáo viên đã thuộc một tổ bộ môn khác" });
//       }

//       // Tìm tổ bộ môn
//       const department = await Department.findById(departmentId);
//       if (!department) {
//         return res.status(404).json({ message: "Không tìm thấy tổ bộ môn" });
//       }

//       // Tìm subject trong members
//       const member = department.members.find(
//         (m) => m.subject_id.toString() === subject_id
//       );

//       if (!member) {
//         return res.status(404).json({ message: "Môn học không tồn tại trong tổ này" });
//       }

//       // Kiểm tra user đã có trong danh sách chưa
//       if (member.users.some((u) => u.toString() === userId)) {
//         return res.status(400).json({ message: "Giáo viên đã tồn tại trong môn học này" });
//       }

//       // Thêm user
//       member.users.push(userId);
//       await department.save();

//       return res.status(200).json({ message: "Thêm giáo viên thành công" });
//     } catch (error) {
//       console.error("[Add Teacher ERROR]", error.message);
//       return res.status(500).json({ message: "Lỗi server khi thêm giáo viên" });
//     }
// };

// exports.removeTeacherFromSubject = async (req, res) => {
//   try {
//       const { departmentId, subjectId, userId } = req.params;

//       const department = await Department.findOneAndUpdate(
//           { _id: departmentId, "members.subject_id": subjectId },
//           {
//               $pull: {
//                   "members.$.users": userId
//               }
//           },
//           { new: true }
//       );

//       if (!department) {
//           return res.status(404).json({ message: "Department or subject not found." });
//       }

//       res.json({ message: "Teacher removed from subject successfully.", department });
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Server error." });
//   }
// };

// exports.getSubjectOfTeacher = async (req, res) => {
//   const { tdt_id } = req.params;

//   try {
//     const userRes = await axios.get(`http://localhost:4003/api/users/tdt/${tdt_id}`);
//     const userId = userRes.data._id;

//     if (!userId) {
//       return res.status(404).json({ message: "Không tìm thấy người dùng với tdt_id này" });
//     }

//     const departments = await Department.find({
//       "members.users": new mongoose.Types.ObjectId(userId)
//     }).lean();

//     const subjectsTemp = [];

//     for (const dept of departments) {
//       for (const member of dept.members) {
//         if (member.users.some(u => u.toString() === userId.toString())) {
//           subjectsTemp.push({
//             subject_id: member.subject_id,
//             subject_code: member.subject_code
//           });
//         }
//       }
//     }

//     const subjectCodes = [...new Set(subjectsTemp.map(s => s.subject_code))];

//     const subjectDocs = await Subject.find({
//       subject_code: { $in: subjectCodes }
//     }).lean();

//     const subjectMap = {};
//     subjectDocs.forEach(sub => {
//       subjectMap[sub.subject_code] = sub.subject_name;
//     });

//     const subjects = subjectsTemp.map(s => ({
//       ...s,
//       subject_name: subjectMap[s.subject_code] || "Không rõ"
//     }));

//     res.json(subjects);
//   } catch (err) {
//     console.error("Lỗi:", err);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

// exports.getDepartmentOfTeacher = async (req, res) => {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.params.userId);

//     const department = await Department.findOne({
//       "members.users": userId
//     });

//     if (!department) {
//       return res.status(404).json({ message: "Không tìm thấy tổ bộ môn của giáo viên này" });
//     }

//     res.json({ departmentName: department.name });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Lỗi server" });
//   }
// };

const Department = require("../models/Department");
const mongoose = require("mongoose");
const axios = require("axios");
const Subject = require("../models/Subject");
require("dotenv").config(); // Đảm bảo dòng này có ở đầu

exports.getAllDepartment = async (req, res) => {
  try {
    const departments = await Department.find()
      .populate("members.subject_id", "subject_name")
      .lean();

    const result = departments.map((dep) => ({
      _id: dep._id,
      name: dep.name,
      code: dep.code,
      email: dep.email,
      phone_number: dep.phone_number,
      officeLocation: dep.officeLocation,
      headofDepartment: dep.headofDepartment,
      members: dep.members.map((member) => ({
        subject_id: member.subject_id?._id,
        subject_name: member.subject_id?.subject_name,
        subject_code: member.subject_code,
        users: member.users,
      })),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getDepartmentDetail = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID tổ không hợp lệ" });
  }

  try {
    const department = await Department.findById(
      new mongoose.Types.ObjectId(id)
    ).lean();
    if (!department) {
      return res.status(404).json({ message: "Không tìm thấy tổ." });
    }

    let headofDepartmentInfo = null;
    if (department.headofDepartment) {
      try {
        const headRes = await axios.get(
          `${process.env.USER_SERVICE_URL}/api/users/${department.headofDepartment}`
        );
        headofDepartmentInfo = headRes.data;
      } catch (error) {
        console.error("Lỗi khi gọi userService lấy tổ trưởng:", error.message);
      }
    }

    const enrichedMembers = await Promise.all(
      department.members.map(async (member) => {
        const subject = await Subject.findById(member.subject_id).lean();
        const subject_name = subject?.subject_name || "Không rõ";

        const userInfos = await Promise.all(
          member.users.map(async (userId) => {
            try {
              const response = await axios.get(
                `${process.env.USER_SERVICE_URL}/api/users/${userId}`
              );
              return response.data;
            } catch (error) {
              console.error("Lỗi khi gọi userService:", error.message);
              return null;
            }
          })
        );

        return {
          subject_id: member.subject_id,
          subject_code: member.subject_code,
          subject_name,
          users: userInfos.filter(Boolean),
        };
      })
    );

    return res.json({
      ...department,
      headofDepartmentInfo,
      members: enrichedMembers,
    });
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết phòng ban:", err);
    return res.status(500).json({ message: "Lỗi server." });
  }
};

exports.addTeacherToDepartment = async (req, res) => {
  try {
    const { email, subject_id } = req.body;
    const { departmentId } = req.params;

    if (!email || !subject_id) {
      return res.status(400).json({ message: "Thiếu email hoặc subject_id" });
    }

    const userRes = await axios.post(
      `${process.env.USER_SERVICE_URL}/api/users/get-ids-by-emails`,
      {
        emails: [email.trim()],
      }
    );
    const userId = userRes.data.userIds?.[0];

    if (!userId) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với email này" });
    }

    const existingDepartment = await Department.findOne({
      _id: { $ne: departmentId },
      members: {
        $elemMatch: {
          users: userId,
        },
      },
    });

    if (existingDepartment) {
      return res
        .status(400)
        .json({ message: "Giáo viên đã thuộc một tổ bộ môn khác" });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: "Không tìm thấy tổ bộ môn" });
    }

    const member = department.members.find(
      (m) => m.subject_id.toString() === subject_id
    );

    if (!member) {
      return res
        .status(404)
        .json({ message: "Môn học không tồn tại trong tổ này" });
    }

    if (member.users.some((u) => u.toString() === userId)) {
      return res
        .status(400)
        .json({ message: "Giáo viên đã tồn tại trong môn học này" });
    }

    member.users.push(userId);
    await department.save();

    return res.status(200).json({ message: "Thêm giáo viên thành công" });
  } catch (error) {
    console.error("[Add Teacher ERROR]", error.message);
    return res.status(500).json({ message: "Lỗi server khi thêm giáo viên" });
  }
};

exports.removeTeacherFromSubject = async (req, res) => {
  try {
    const { departmentId, subjectId, userId } = req.params;

    const department = await Department.findOneAndUpdate(
      { _id: departmentId, "members.subject_id": subjectId },
      {
        $pull: {
          "members.$.users": userId,
        },
      },
      { new: true }
    );

    if (!department) {
      return res
        .status(404)
        .json({ message: "Department or subject not found." });
    }

    res.json({
      message: "Teacher removed from subject successfully.",
      department,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

exports.getSubjectOfTeacher = async (req, res) => {
  const { tdt_id } = req.params;

  try {
    const userRes = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/users/tdt/${tdt_id}`
    );
    const userId = userRes.data._id;

    if (!userId) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với tdt_id này" });
    }

    const departments = await Department.find({
      "members.users": new mongoose.Types.ObjectId(userId),
    }).lean();

    const subjectsTemp = [];

    for (const dept of departments) {
      for (const member of dept.members) {
        if (member.users.some((u) => u.toString() === userId.toString())) {
          subjectsTemp.push({
            subject_id: member.subject_id,
            subject_code: member.subject_code,
          });
        }
      }
    }

    const subjectCodes = [...new Set(subjectsTemp.map((s) => s.subject_code))];

    const subjectDocs = await Subject.find({
      subject_code: { $in: subjectCodes },
    }).lean();

    const subjectMap = {};
    subjectDocs.forEach((sub) => {
      subjectMap[sub.subject_code] = sub.subject_name;
    });

    const subjects = subjectsTemp.map((s) => ({
      ...s,
      subject_name: subjectMap[s.subject_code] || "Không rõ",
    }));

    res.json(subjects);
  } catch (err) {
    console.error("Lỗi:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getDepartmentOfTeacher = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const department = await Department.findOne({
      "members.users": userId,
    });

    if (!department) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tổ bộ môn của giáo viên này" });
    }

    res.json({ departmentName: department.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};
