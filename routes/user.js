const router = require('express').Router()
const ctrls = require('../controllers/user')
const upload = require("../middlewares/multer");

router.get('/getUserByUsername/:username', ctrls.getUserByUsername)
router.post('/login', ctrls.login);
router.post('/register', ctrls.register);
router.post('/verifyAccount', ctrls.verifyAccount);
router.post('/forgot-password', ctrls.forgotPassword);
router.post('/verifyOTP', ctrls.verifyOTP);
router.post('/reset-password', ctrls.resetPassword);
router.post("/upload-avatar/:userId", upload.single("image"), ctrls.uploadAvatar);

module.exports = router