const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const LoginInfo = require("../models/LoginInfo");
const User = require("../models/User");
require("dotenv").config();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const { JWT_SECRET, ADMIN_EMAIL, ADMIN_EMAIL_PASS } = process.env;

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const loginInfo = await LoginInfo.findOne({ username });
    if (!loginInfo) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, loginInfo.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    const user = await User.findById(loginInfo.user_id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    // const token = jwt.sign(
    //   { id: user._id, role: user.role, tdt_id: user.tdt_id, name: user.name },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '1h' }
    // );

    const tokenPayload = {
      id: user._id,
      role: user.role,
      tdt_id: user.tdt_id,
      name: user.name,
    };

    if (user.role === "advisor") {
      tokenPayload.advisor_type = user.advisor_type;
    }

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const userResponse = {
      id: user._id,
      tdt_id: user.tdt_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (user.role === "advisor") {
      userResponse.advisor_type = user.advisor_type;
    }

    res.status(200).json({
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error.message);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Lấy từ middleware xác thực

    const loginInfo = await LoginInfo.findOne({ user_id: userId });
    if (!loginInfo)
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông tin đăng nhập" });

    const isMatch = await bcrypt.compare(oldPassword, loginInfo.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    const hashedNew = await bcrypt.hash(newPassword, 10);
    loginInfo.password = hashedNew;

    await loginInfo.save();
    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    console.error("Lỗi đổi mật khẩu:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword } = req.body;

    const loginInfo = await LoginInfo.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });
    if (!loginInfo) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản đăng nhập" });
    }

    const isMatch = await bcrypt.compare(oldPassword, loginInfo.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    res.status(200).json({ message: "Mật khẩu chính xác" });
  } catch (err) {
    console.error("Lỗi xác thực mật khẩu:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "15m",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: ADMIN_EMAIL,
        pass: ADMIN_EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: ADMIN_EMAIL,
      to: email,
      subject: "Đặt lại mật khẩu Stdportal",
      html: `<p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới để đặt lại:</p>
               <a href="http://localhost:5174/new-password/${token}">Đặt lại mật khẩu</a>`,
    });

    res.status(200).json({ message: "Đã gửi email đặt lại mật khẩu" });
  } catch (err) {
    console.error("Lỗi gửi link đặt lại mật khẩu:", err.message);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const loginInfo = await LoginInfo.findOne({ user_id: userId });
    if (!loginInfo)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });

    loginInfo.password = await bcrypt.hash(newPassword, 10);
    await loginInfo.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("Lỗi đặt lại mật khẩu:", err.message);
    res.status(500).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

exports.verify = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ user: decoded });
  } catch (err) {
    res.status(403).json({ message: "Token không hợp lệ" });
  }
};
