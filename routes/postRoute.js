const express = require('express');
const router = express.Router();
const ctrls = require('../controllers/PostController');

router.get("/:userId", ctrls.getFriendPosts);


module.exports = router;