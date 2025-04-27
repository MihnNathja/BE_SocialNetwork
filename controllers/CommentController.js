const mongoose = require('mongoose');
const moment = require("moment-timezone");
const Comment = require('../models/comment');

// Tạo comment
exports.createCommentByPostId = async (req, res) => {
  const { postId } = req.params;
  const { userId, content, parent } = req.body;

  // Kiểm tra postId và userId có hợp lệ không
  if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: 'postId hoặc userId không hợp lệ' });
  }

  // Kiểm tra parent nếu có
  if (parent && !mongoose.isValidObjectId(parent)) {
    return res.status(400).json({ message: 'parent không hợp lệ' });
  }

  try {
    const newComment = new Comment({
      post_id: postId,
      user_id: userId,
      content,
      create_at: new Date(),  
      isDeleted: false,
      parent: parent || null  // Nếu parent có, lưu vào; nếu không, gán null
    });

    // Lưu bình luận mới vào cơ sở dữ liệu
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("🔥 Lỗi tạo comment:", error); // In lỗi ra console
    res.status(500).json({ message: 'Lỗi server', error: error.message }); // Trả về lỗi nếu có
  }
};


// Lấy danh sách bình luận với Aggregation Pipeline của Mongo
exports.getCommentsByPostId = async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.query.userId;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: "postId không hợp lệ!" });
  }
  try {
    const comments = await Comment.aggregate([
      {
        $match: {
          post_id: new mongoose.Types.ObjectId(postId),
          is_deleted: false
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_info'
        }
      },
      {
        $unwind: {
          path: '$user_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: 'parent',
          foreignField: '_id',
          as: 'parent_comment'
        }
      },
      {
        $unwind: {
          path: '$parent_comment',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'parent_comment.user_id',
          foreignField: '_id',
          as: 'parent_user_info'
        }
      },
      {
        $unwind: {
          path: '$parent_user_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { create_at: -1 }
      },
      {
        $project: {
          id: '$_id',
          postId: '$post_id',
          userId: '$user_info._id',
          userName: { $ifNull: ['$user_info.username', 'Ẩn danh'] },
          avatarUrl: { $ifNull: ['$user_info.profile.avatar', ''] },
          content: 1,
          parent: '$parent_comment._id',
          parentUserName: { $ifNull: ['$parent_user_info.username', null] },
          createdAt: {
            $dateToString: {
              date: "$create_at",
              timezone: "Asia/Ho_Chi_Minh"
            }
          },
          likes: 1,
          myLike: { 
            $cond: {
              if: { $in: [currentUserId, '$likes'] },
              then: true,
              else: false
            }
          },
          isDeleted: '$is_deleted'
        }
      }
    ]);
    
    res.status(200).json(comments);
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
// Hủy thích
exports.unlikeCommentByCommentId = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.query;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment không tồn tại' });

    // Gỡ userId khỏi danh sách
    comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
    await comment.save();

    res.status(200).json({ message: 'Đã bỏ like' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
