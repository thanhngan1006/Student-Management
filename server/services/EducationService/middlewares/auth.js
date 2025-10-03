const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Không có token" });

  jwt.verify(token, process.env.JWT_SECRET || "secret_key", (err, user) => {
    if (err) {
      console.log("Lỗi verify token:", err.message);
      return res.sendStatus(403);
    }

    // console.log("User from token:", user);

    req.user = user;
    next();
  });
};

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Bạn không có quyền truy cập" });
    }

    // if (user.role === "advisor") {
    //   return next();
    // }

    next();
  };
};

exports.allowStudentAndAdvisorOnlyAndOwner = (req, res, next) => {
  const { role, id } = req.user;
  const { author_id } = req.body;

  if ((role === "advisor" || role === "student") && author_id === id) {
    return next();
  }

  return res.status(403).json({
    message: "Chỉ giáo viên, học sinh và đúng người đăng mới được phép",
  });
};

exports.checkAdvisorType = (requiredTypes) => {
  return (req, res, next) => {
    if (req.user.role !== "advisor") {
      return res.status(403).json({ message: "Không phải advisor" });
    }

    const advisorTypes = req.user.advisor_type || [];

    const hasPermission = requiredTypes.some((type) =>
      advisorTypes.includes(type)
    );
    if (!hasPermission) {
      return res.status(403).json({ message: "Không đủ quyền advisor" });
    }

    next();
  };
};
