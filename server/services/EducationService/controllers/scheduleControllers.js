const axios = require("axios");
const Schedule = require("../models/Schedule"); // Giả sử model này cũng nằm trong EducationService
require("dotenv").config();

exports.generateSchedule = async (req, res) => {
  try {
    const { schoolYear, semester } = req.body;
    if (!schoolYear || !semester) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp schoolYear và semester" });
    }

    const classResponse = await axios.get(
      `${process.env.VITE_CLASS_SERVICE_URL}/api/classes/khoi`
    );
    const classes = classResponse.data.map((cls) => ({
      class_id: cls.class_id,
      class_name: cls.class_name,
      subject_teacher: cls.subject_teacher || [],
    }));

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy lớp nào" });
    }

    const teacherIds = [
      ...new Set(classes.flatMap((cls) => cls.subject_teacher)),
    ];

    let users = [];
    if (teacherIds.length > 0) {
      const userResponse = await axios.post(
        `${process.env.VITE_USER_SERVICE_URL}/api/users/teachers`,
        { ids: teacherIds }
      );
      users = userResponse.data.map((user) => ({
        user_id: user._id,
        name: user.name || "Unknown Teacher",
      }));
    }
    if (users.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy giáo viên nào" });
    }

    const subjects = [];
    for (const cls of classes) {
      for (const teacherId of cls.subject_teacher) {
        try {
          const userDetailResponse = await axios.get(
            `${process.env.VITE_USER_SERVICE_URL}/api/users/${teacherId}`
          );
          const tdt_id = userDetailResponse.data.tdt_id;

          if (!tdt_id) {
            console.log(`Không tìm thấy tdt_id cho giáo viên ${teacherId}`);
            continue;
          }

          // Chú ý: Vì controller này nằm trong EducationService, nó có thể gọi trực tiếp đến các API
          // của chính nó mà không cần localhost, nhưng để nhất quán, ta vẫn có thể dùng biến môi trường.
          // Tuy nhiên, ở đây nó gọi đến /api/departments/... là một phần của chính service này,
          // nên tôi sẽ dùng biến VITE_EDUCATION_SERVICE_URL nếu bạn định nghĩa, hoặc gọi trực tiếp.
          // Để an toàn nhất khi deploy, tôi sẽ giả định bạn đã định nghĩa VITE_EDUCATION_SERVICE_URL
          const subjectResponse = await axios.get(
            `${
              process.env.VITE_EDUCATION_SERVICE_URL || "http://localhost:4001"
            }/api/departments/${tdt_id}/subjects`
          );
          const teacherSubjects = subjectResponse.data.map((subject) => ({
            class_id: cls.class_id,
            subject_name: subject.subject_name,
            subject_code: subject.subject_code,
            teacher_id: teacherId,
          }));
          subjects.push(...teacherSubjects);
        } catch (error) {
          console.log(
            `Lỗi khi lấy môn học cho giáo viên ${teacherId}:`,
            error.message
          );
          continue;
        }
      }
    }

    if (subjects.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy môn học nào" });
    }

    const uniqueSubjects = [];
    const seen = new Set();
    for (const subject of subjects) {
      const key = `${subject.class_id}-${subject.subject_code}-${subject.teacher_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSubjects.push(subject);
      }
    }

    const inputData = {
      subjects: uniqueSubjects,
      classes,
      users,
    };

    const result = await axios.post(
      `${process.env.VITE_PYTHON_SCHEDULER_URL}/generate-schedule`,
      inputData
    );

    if (result.data.error) {
      return res.status(400).json({
        message: "Failed to generate schedule",
        error: result.data.error,
      });
    }

    const schedules = Object.keys(result.data).map((classId) => ({
      class_name: classId,
      schedule: Object.keys(result.data[classId]).map((day) => ({
        day: day,
        periods: result.data[classId][day],
      })),
    }));

    const savedSchedules = [];
    for (const scheduleData of schedules) {
      const { class_name, schedule } = scheduleData;
      try {
        const newSchedule = await Schedule.createNewSchedule(
          class_name,
          schoolYear,
          semester,
          schedule
        );
        savedSchedules.push(newSchedule);
      } catch (error) {
        console.error(
          `Lỗi khi lưu thời khóa biểu cho lớp ${class_name}:`,
          error.message
        );
        continue;
      }
    }

    if (savedSchedules.length === 0) {
      return res
        .status(500)
        .json({ message: "Không thể lưu thời khóa biểu nào vào database" });
    }

    res.json({
      message: "Thời khóa biểu đã được tạo và lưu thành công",
      data: savedSchedules,
    });
  } catch (error) {
    console.error("Error calling services:", error.message);
    res.status(500).json({
      message: "Error calling services",
      error: error.response?.data || error.message,
    });
  }
};

exports.getAllSchedules = async (req, res) => {
  try {
    const { schoolYear, semester, version } = req.query;

    const filter = {};
    if (schoolYear) filter.schoolYear = schoolYear;
    if (semester) filter.semester = Number(semester);
    if (version) filter.version = Number(version);

    const schedules = await Schedule.find(filter)
      .sort({ createdAt: -1 })
      .exec();

    if (!schedules || schedules.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thời khóa biểu nào" });
    }

    res.json({
      message: "Lấy danh sách thời khóa biểu thành công",
      data: schedules,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thời khóa biểu:", error.message);
    res.status(500).json({
      message: "Lỗi khi lấy thời khóa biểu",
      error: error.message,
    });
  }
};

exports.getScheduleVersions = async (req, res) => {
  try {
    const { schoolYear, semester } = req.query;

    if (!schoolYear || !semester) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp schoolYear và semester" });
    }

    const filter = {
      schoolYear: schoolYear,
      semester: Number(semester),
    };

    const versions = await Schedule.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$version",
          isApproved: { $max: "$isApproved" },
        },
      },
      { $sort: { _id: -1 } },
      {
        $project: {
          version: "$_id",
          isApproved: 1,
          _id: 0,
        },
      },
    ]);

    if (!versions || versions.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy version nào cho kỳ học này" });
    }

    res.json({
      message: "Lấy danh sách version thành công",
      data: versions,
    });
  } catch (error) {
    console.error("Lỗi khi lấy version:", error.message);
    res.status(500).json({
      message: "Lỗi khi lấy version",
      error: error.message,
    });
  }
};

exports.approveScheduleVersion = async (req, res) => {
  try {
    const { schoolYear, semester, version } = req.body;

    if (!schoolYear || !semester || !version) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp schoolYear, semester và version" });
    }

    const filter = {
      schoolYear: schoolYear,
      semester: Number(semester),
    };

    await Schedule.updateMany(filter, { isApproved: false });

    const updatedSchedule = await Schedule.updateMany(
      { ...filter, version: Number(version) },
      { isApproved: true }
    );

    if (updatedSchedule.matchedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy version này" });
    }

    res.json({
      message: `Version ${version} đã được duyệt thành công`,
    });
  } catch (error) {
    console.error("Lỗi khi duyệt version:", error.message);
    res.status(500).json({
      message: "Lỗi khi duyệt version",
      error: error.message,
    });
  }
};

exports.unapproveScheduleVersion = async (req, res) => {
  try {
    const { schoolYear, semester, version } = req.body;

    if (!schoolYear || !semester || !version) {
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp schoolYear, semester và version" });
    }

    const filter = {
      schoolYear: schoolYear,
      semester: Number(semester),
      version: Number(version),
    };

    const updatedSchedule = await Schedule.updateMany(filter, {
      isApproved: false,
    });

    if (updatedSchedule.matchedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy version này" });
    }

    res.json({
      message: `Hủy duyệt version ${version} thành công`,
    });
  } catch (error) {
    console.error("Lỗi khi hủy duyệt version:", error.message);
    res.status(500).json({
      message: "Lỗi khi hủy duyệt version",
      error: error.message,
    });
  }
};

exports.getApprovedSchedule = async (req, res) => {
  try {
    const { className, schoolYear, semester } = req.query;

    if (!className || !schoolYear || !semester) {
      return res.status(400).json({
        message: "Vui lòng cung cấp className, schoolYear và semester",
      });
    }

    const filter = {
      className: className,
      schoolYear: schoolYear,
      semester: Number(semester),
      isApproved: true,
    };

    const schedule = await Schedule.findOne(filter).exec();

    if (!schedule) {
      return res.status(404).json({
        message: "Không tìm thấy thời khóa biểu đã được duyệt cho lớp này",
      });
    }

    res.json({
      message: "Lấy thời khóa biểu đã được duyệt thành công",
      data: schedule,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thời khóa biểu:", error.message);
    res.status(500).json({
      message: "Lỗi khi lấy thời khóa biểu",
      error: error.message,
    });
  }
};

exports.getTeacherSchedule = async (req, res) => {
  try {
    const { schoolYear, semester, teacherId } = req.query;

    if (!schoolYear || !semester || !teacherId) {
      return res.status(400).json({
        message: "Vui lòng cung cấp schoolYear, semester và teacherId",
      });
    }

    const filter = {
      schoolYear: schoolYear,
      semester: Number(semester),
      isApproved: true,
    };

    const schedules = await Schedule.find(filter).exec();

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        message: "Không tìm thấy thời khóa biểu đã được duyệt cho kỳ học này",
      });
    }

    const teacherSchedule = schedules
      .map((schedule) => {
        const filteredSchedule = schedule.schedule
          .map((day) => {
            const filteredPeriods = day.periods.filter((period) => {
              const match = String(period.teacher_id) === String(teacherId);
              return match;
            });
            return {
              day: day.day,
              periods: filteredPeriods,
            };
          })
          .filter((day) => day.periods.length > 0);

        if (filteredSchedule.length === 0) {
          return null;
        }

        return {
          className: schedule.className,
          schoolYear: schedule.schoolYear,
          semester: schedule.semester,
          schedule: filteredSchedule,
        };
      })
      .filter((schedule) => schedule !== null);

    if (teacherSchedule.length === 0) {
      return res.status(404).json({
        message: "Không có tiết học nào của giáo viên này trong kỳ học đã chọn",
      });
    }

    res.json({
      message: "Lấy thời khóa biểu của giáo viên thành công",
      data: teacherSchedule,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thời khóa biểu của giáo viên:", error.message);
    res.status(500).json({
      message: "Lỗi khi lấy thời khóa biểu",
      error: error.message,
    });
  }
};
