const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/PostController');

router.get("/:userId", ctrls.getFriendPosts);
router.post("/reaction/:postId", ctrls.addOrUpdateReaction);
router.delete("/reaction/:postId", ctrls.deleteReaction);
router.get("/myPosts/:userId", ctrls.getMyPosts);

module.exports = router;