const express = require("express");
const router = express.Router();
const authController = require("../controllers/authControllers");
// const {authenticateToken} = require("../../../middleware/auth");
const { authenticateToken } = require("../middlewares/auth");

router.get("/verify", authController.verify);
router.post("/login", authController.login);
router.post(
  "/change-password",
  authenticateToken,
  authController.changePassword
);
router.post(
  "/verify-password",
  authenticateToken,
  authController.verifyPassword
);
router.post("/send-reset-link", authController.sendResetLink);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
