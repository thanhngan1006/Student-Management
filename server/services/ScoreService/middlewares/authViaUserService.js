const axios = require("axios");
require("dotenv").config();

exports.verifyTokenViaUserService = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không có token xác thực" });
  }

  try {
    // const response = await axios.get("http://localhost:4003/api/auth/verify", {
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //   },
    // });

    const response = await axios.get(
      `${process.env.USER_SERVICE_URL}/api/auth/verify`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    req.user = response.data.user; // Dữ liệu user từ token đã được xác thực
    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Xác thực token thất bại:", error.message);
    res.status(403).json({ message: "Token không hợp lệ hoặc hết hạn" });
  }
};
