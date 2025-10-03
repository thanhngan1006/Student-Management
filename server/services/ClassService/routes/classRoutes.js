const express = require("express");
const router = express.Router();
const classController = require("../controllers/classControllers");
const upload = require("../middlewares/upload");
const { authenticateToken, authorizeRoles } = require("../middlewares/auth");
// const { authenticateToken, authorizeRoles } = require("../../../middleware/auth");

router.get("/classes/khoi", classController.getAllClasses);

router.get("/classes/:id", classController.getClassById);
router.get("/classes/:id/students", classController.getClassStudents);
router.get("/teachers/:id/class", classController.getClassesByTeacher);
router.get("/students/:id/advisor", classController.getAdvisorOfStudent);
router.post(
  "/classes",
  authenticateToken,
  authorizeRoles("admin"),
  classController.addClass
);
router.get("/class-size", classController.getClassSizeById);
router.post(
  "/classes/:classId/import-students",
  upload.single("file"),
  authenticateToken,
  authorizeRoles("advisor"),
  classController.importStudentsToClass
);
router.get("/students/:id/class", classController.getClassByStudentId);
router.get("/classes/:classId/advisor", classController.getAdvisorByClassId);
router.delete(
  "/classes/:classId/remove-student/:userId",
  authenticateToken,
  authorizeRoles("advisor"),
  classController.removeStudentFromClass
);
router.post(
  "/classes/:classId/add-student",
  authenticateToken,
  authorizeRoles("advisor"),
  classController.addStudentToClass
);
router.get("/classes", classController.getAllClasses);
router.put("/classes/assign-teacher", classController.assignTeacherToClass);
router.get(
  "/classes/by-teacher/:teacherId",
  classController.getClassByTeacherId
);
router.put(
  "/classes/:classId/remove-teacher",
  authenticateToken,
  authorizeRoles("admin"),
  classController.removeAdvisorFromClass
);
router.delete(
  "/classes/remove-student-if-exists/:studentId",
  authenticateToken,
  authorizeRoles("admin"),
  classController.adminDeleteStudentFromClass
);
router.get("/teacher/tdt/:tdt_id", classController.getClassesByTdtId);
router.get("/:class_id", classController.getClassById);
router.post(
  "/classes/:classId/add-advisor",
  authenticateToken,
  authorizeRoles("admin"),
  classController.addAdvisorToClass
);
router.put(
  "/classes/:classId/change-advisor",
  authenticateToken,
  authorizeRoles("admin"),
  classController.changeAdvisorOfClass
);
router.put("/classes/add-teacher", classController.addClassForTeacher);
router.put("/classes/remove-teacher", classController.removeTeacherFromClass);
router.get("/classes/:classId/subjects", classController.getSubjectsOfClass);
router.get(
  "/:class_id/available-semesters",
  classController.getAvailableSemestersForClass
);
router.post("/classes/promote", classController.promoteClasses);
router.post("/classes/graduate-12", classController.graduate12thStudents);
router.post("/approvals/submit", classController.approval);
router.get("/approvals/pending", classController.getApprovalPending);
router.patch("/approvals/:id/approve", classController.approveApproval);

module.exports = router;
