const axios = require("axios");
require("dotenv").config(); // Nạp biến môi trường

const IMMEDIATE_SENDING = true;

const scheduleReportCardSending = async () => {
  try {
    console.log("Bắt đầu lên lịch gửi bảng điểm...");

    let semester;
    try {
      const semesterRes = await axios.get(
        `${process.env.VITE_EDUCATION_SERVICE_URL}/api/semesters/current`
      );
      semester = semesterRes.data;
      console.log("Dữ liệu học kỳ từ API:", JSON.stringify(semester));
    } catch (apiErr) {
      console.error("Lỗi khi lấy dữ liệu học kỳ từ API:", apiErr.message);
      // Bạn có thể xử lý lỗi ở đây, ví dụ như dừng lại hoặc dùng dữ liệu dự phòng
      console.log("Không thể lấy học kỳ, dừng tiến trình hẹn giờ.");
      return;
    }

    const endDateVN = new Date("2025-05-11T00:40:00.000+07:00");

    console.log("Lên lịch gửi bảng điểm vào:", endDateVN.toLocaleString());

    const now = new Date();
    let timeUntilSend = endDateVN.getTime() - now.getTime();

    if (IMMEDIATE_SENDING) {
      timeUntilSend = 10 * 1000; // Gửi sau 10 giây để kiểm tra
    }

    if (timeUntilSend <= 0 && !IMMEDIATE_SENDING) {
      console.log("Đã quá thời gian gửi hoặc thời gian không hợp lệ.");
      return;
    }

    console.log(
      `Hẹn gửi vào ${endDateVN.toLocaleString()} (còn ${Math.floor(
        timeUntilSend / 1000
      )} giây)`
    );

    setTimeout(async () => {
      try {
        console.log("Bắt đầu gửi bảng điểm...");

        const classListRes = await axios.get(
          `${process.env.VITE_CLASS_SERVICE_URL}/api/classes/khoi`
        );
        console.log("Danh sách lớp:", JSON.stringify(classListRes.data));
        const classes = classListRes.data;
        const semesterId = semester._id;

        if (!classes || classes.length === 0) {
          console.log("Không có lớp nào để gửi.");
          return;
        }

        for (const classItem of classes) {
          const classId = classItem.class_id;
          if (!classId) {
            console.error(
              `Lớp không có class_id: ${JSON.stringify(classItem)}`
            );
            continue;
          }

          try {
            const url = `${process.env.VITE_SCORE_SERVICE_URL}/api/students/send-report-card/${classId}?semester_id=${semesterId}`;
            console.log(`Gửi yêu cầu tới: ${url}`);
            await axios.post(url);
            console.log(`Gửi thành công cho lớp ${classId}`);
          } catch (err) {
            console.error(
              `Lỗi gửi lớp ${classItem.name || classId}: ${err.message}`
            );
            if (err.response) {
              console.error(
                `Status: ${err.response.status}, Data: ${JSON.stringify(
                  err.response.data
                )}`
              );
            }
          }
        }

        console.log("Đã gửi bảng điểm cho tất cả lớp.");
      } catch (err) {
        console.error("Lỗi khi gửi bảng điểm:", err.message);
        if (err.response) {
          console.error(
            `Status: ${err.response.status}, Data: ${JSON.stringify(
              err.response.data
            )}`
          );
        }
      }
    }, timeUntilSend);
  } catch (err) {
    console.error("Lỗi trong quá trình lên lịch:", err.message);
    if (err.response) {
      console.error(
        `Status: ${err.response.status}, Data: ${JSON.stringify(
          err.response.data
        )}`
      );
    }
  }
};

console.log("Khởi động hệ thống và lên lịch gửi bảng điểm...");
scheduleReportCardSending();
