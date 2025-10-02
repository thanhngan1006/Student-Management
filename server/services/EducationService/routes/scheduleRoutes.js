const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleControllers");

router.post('/generate-schedule', scheduleController.generateSchedule);
router.get('/schedules', scheduleController.getAllSchedules);
router.get('/version', scheduleController.getScheduleVersions);
router.post('/approve', scheduleController.approveScheduleVersion);
router.get('/approved', scheduleController.getApprovedSchedule);
router.post('/unapprove', scheduleController.unapproveScheduleVersion);
router.get('/teacher', scheduleController.getTeacherSchedule);

module.exports = router;
