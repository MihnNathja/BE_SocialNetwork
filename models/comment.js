const mongoose = require('mongoose');

// Định nghĩa schema cho comment
const commentSchema = new mongoose.Schema({
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post', // Liên kết với model Post
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Liên kết với model User
    required: true
  },
  content: {
    type: String,
    required: true,
    minlength: 1, // Đảm bảo rằng comment không rỗng
    maxlength: 500 // Giới hạn độ dài bình luận
  },
  create_at: {
    type: Date,
    default: Date.now
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment', // Liên kết với comment cha nếu là reply
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Liên kết với model User để lưu danh sách những người thích
  }],
  is_deleted: {
    type: Boolean,
    default: false
  }
});

// Tạo model từ schema
const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
