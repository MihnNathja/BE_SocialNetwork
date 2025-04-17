const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/PostController');

router.post("/reaction/:postId", ctrls.addOrUpdateReaction);
router.delete("/reaction/:postId", ctrls.deleteReaction);
router.get("/myPosts/:userId", ctrls.getMyPosts);
router.get("/postDetail", ctrls.getPostByID);
router.get("/:userId", ctrls.getFriendPosts);

module.exports = router;