const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/PostController');


router.post("/reaction/:postId", ctrls.addOrUpdateReaction);
router.delete("/reaction/:postId", ctrls.deleteReaction);
router.get("/myPosts/:userId", ctrls.getMyPosts);
router.get("/postDetail", ctrls.getPostByID);
router.post("/create", ctrls.createPost);
router.get('/search', ctrls.searchPostsByHashtag);
router.get("/:userId", ctrls.getFriendPosts);
router.post("/story/create", ctrls.createStory);
router.get("/story/:userId", ctrls.getUserStories)

module.exports = router;