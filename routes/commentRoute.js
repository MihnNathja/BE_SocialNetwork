const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/CommentController');

router.post("/posts/:postId/comments", ctrls.createCommentByPostId);
router.delete("/comments/:commentId", ctrls.deleteCommentByCommentId);
router.get("/posts/:postId/comments", ctrls.getCommentsByPostId);
router.post("/comments/:commentId/like", ctrls.likeCommentByCommentId)

module.exports = router;