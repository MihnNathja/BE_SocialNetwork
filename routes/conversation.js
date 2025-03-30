const router = require('express').Router()
const ctrls = require('../controllers/conversation')
const upload = require("../middlewares/multer");

router.get('/chatlist/:userId', ctrls.getChatList);


module.exports = router