const router = require('express').Router()
const ctrls = require('../controllers/user')
const upload = require("../middlewares/multer");

router.get('/getUserByUsername/:username', ctrls.getUserByUsername);
router.get('/getProfile/:userId', ctrls.getProfile);
router.post('/login', ctrls.login);
router.post('/register', ctrls.register);
router.post('/verifyAccount', ctrls.verifyAccount);
router.post('/forgot-password', ctrls.forgotPassword);
router.post('/verifyOTP', ctrls.verifyOTP);
router.post('/reset-password', ctrls.resetPassword);
router.put("/update-profile", upload.single("file"), ctrls.updateProfile);
router.get('/search/user', ctrls.searchUser);
router.get("/users/:userId/profile/:userIdMe", ctrls.getProfileUser);
router.post("/users/:userId/addFriend/:userIdMe", ctrls.addFriend);
router.put("/users/:userId/acceptFriend/:userIdMe", ctrls.acceptFriend);
router.put("/users/:userId/rejectFriend/:userIdMe", ctrls.rejectFriend);
router.put("/users/:userId/cancelFriendRequest/:userIdMe", ctrls.cancelFriendRequest);
router.delete("/users/:userId/unFriend/:userIdMe", ctrls.unFriend);
router.get("/friendrequests/:userId", ctrls.getFriendRequests);
router.get("/friends/:userId", ctrls.getFriends);
router.get("/friendsuggested/:userId", ctrls.getSuggestedFriends);


module.exports = router