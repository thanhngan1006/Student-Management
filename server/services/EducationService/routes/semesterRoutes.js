const express = require("express");
const router = express.Router();
const semesterController = require("../controllers/semesterControllers");
const upload = require("../middlewares/upload");
// const { authenticateToken, authorizeRoles } = require("../../../middleware/auth");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth");

router.get("/school-years", semesterController.getSchoolYear);
router.get(
  "/semester-by-schoolyear",
  semesterController.getSemesterBySchoolYear
);

router.get("/current", semesterController.getCurrentSemester);
router.get("/:id", semesterController.getSemesterById);
router.get("/", semesterController.getAllSemesters);
router.post(
  "/import-semesters",
  upload.single("file"),
  authenticateToken,
  authorizeRoles("admin", "advisor"),
  semesterController.importSemesters
);
router.get("/code/:code", semesterController.getSemesterByCode);
router.post("/by-years", semesterController.getSemestersByYears);

module.exports = router;
