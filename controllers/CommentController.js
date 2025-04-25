const Comment = require('../models/comment');

// Tạo bình luận
exports.createCommentByPostId = async (req, res) => {
  const { post_id, content, parent } = req.body;
  const user_id = req.user.id; 

  try {
    const comment = new Comment({
      post_id,
      user_id,
      content,
      parent
    });

    await comment.save();
    return res.status(201).json(comment);
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

//Lấy danh sách bình luận
exports.getCommentsByPostId = async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.query.userId;


  try {
      const comments = await Comment.find({ post_id: postId, is_deleted: false })
      .populate('user_id', 'username profile')  
      .sort({ create_at: -1 })
      .lean();
      
      const result = comments.map(c => ({
        id: c._id,
        postId: c.post_id,
        userId: c.user_id?._id || null,
        userName: c.user_id?.username || 'Ẩn danh',
        avatarUrl: c.user_id?.profile?.avatar || '',
        content: c.content,
        createdAt: c.create_at,
      
        likes: Array.isArray(c.likes) ? c.likes.map(id => id.toString()) : [],
        myLike: Array.isArray(c.likes) && c.likes.some(id => id.toString() === currentUserId?.toString()),
      
        isDeleted: c.is_deleted
      }));
    
      

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Xóa bình luận
exports.deleteCommentByCommentId = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Đánh dấu comment là đã xóa
    comment.is_deleted = true;
    await comment.save();

    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Thích bình luận
exports.likeCommentByCommentId = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.query;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment không tồn tại' });

    // Thêm userId nếu chưa có
    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
      await comment.save();
    }

    res.status(200).json({ message: 'Đã like thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

exports.unlikeCommentByCommentId = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.query;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment không tồn tại' });

    // Gỡ userId khỏi danh sách
    comment.likes = comment.likes.filter(id => id !== userId);
    await comment.save();

    res.status(200).json({ message: 'Đã bỏ like' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
