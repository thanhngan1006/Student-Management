const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/scoreControllers");
const upload = require('../middlewares/upload');
const { verifyTokenViaUserService } = require("../middlewares/authViaUserService");

router.get('/:id/scores-by-semester', scoreController.getStudentScoresGroupedBySemester);
router.get('/:id/scores', scoreController.getStudentScoresBySemester);
router.post('/import-scores', verifyTokenViaUserService, upload.single('file'), scoreController.importStudentScores);
router.put("/scores/update", scoreController.updateScore);
router.get("/scores/:studentId/by-teacher/:tdt_id", scoreController.getStudentScoreboardByTeacher);
router.get('/export/pdf', scoreController.exportClassScoresPdf);
router.get('/export/pdf/total', scoreController.exportClassSummaryPdf);
router.get('/export/pdf/subject', scoreController.exportSubjectScoresPdf);
router.post('/send-report-card/:class_id', scoreController.sendReportCardsToClassParents);
router.get('/send-email', scoreController.sendEmail);
router.post('/import-behavior', upload.single('file'), scoreController.importBehavior);
router.post('/promote-review', scoreController.reviewPromotion);
router.get('/:studentId/latest', scoreController.getLatestScoreboardByStudent);
router.get('/status-behavior', scoreController.getStatusAndBehavior);

module.exports = router;
