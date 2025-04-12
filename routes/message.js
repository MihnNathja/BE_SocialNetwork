const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController.js');
const upload = require('../middlewares/multer2');

// Lấy tin nhắn của một conversation
router.get('/:conversation_id', MessageController.getMessages);

// Gửi tin nhắn text
router.post('/send', MessageController.sendMessage);

// Gửi tin nhắn hình ảnh
router.post('/send-image', upload.single('image'), MessageController.sendImageMessage);

// Xóa tin nhắn
router.delete('/:message_id', MessageController.deleteMessage);

module.exports = router;