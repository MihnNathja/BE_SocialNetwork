const multer = require("multer");

// Cấu hình Multer để lưu ảnh vào RAM
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
