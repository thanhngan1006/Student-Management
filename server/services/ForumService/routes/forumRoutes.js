const express = require("express");
const router = express.Router();
const forumController = require("../controllers/forumControllers");
// const { authenticateToken, allowStudentAndAdvisorOnlyAndOwner } = require("../../../middleware/auth");
const {
  authenticateToken,
  allowStudentAndAdvisorOnlyAndOwner,
} = require("../middlewares/auth");

router.get("/class/:classId/posts", forumController.getPostsByClass);
router.post(
  "/posts",
  authenticateToken,
  allowStudentAndAdvisorOnlyAndOwner,
  forumController.createPost
);
router.post(
  "/posts/:postId/comments",
  authenticateToken,
  forumController.addComment
);
router.post("/posts/:postId/like", forumController.toggleLike);
router.delete("/posts/:postId", authenticateToken, forumController.deletePost);

module.exports = router;
