const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentControllers");

router.get("/:id", departmentController.getDepartmentDetail);
router.get('/', departmentController.getAllDepartment);
router.post("/:departmentId/add-teacher", departmentController.addTeacherToDepartment);
router.delete("/:departmentId/subjects/:subjectId/users/:userId", departmentController.removeTeacherFromSubject);
router.get("/:tdt_id/subjects", departmentController.getSubjectOfTeacher);
router.get('/of-user/:userId', departmentController.getDepartmentOfTeacher);

module.exports = router;
