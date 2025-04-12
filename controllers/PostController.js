const Post = require("../models/post");
const User = require("../models/user");
const moment = require("moment-timezone");

const getFriendPosts = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Tìm user và danh sách bạn bè
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const friendIds = user.friends;

    // 2. Lấy post của bạn bè
    const posts = await Post.find({ userid: { $in: friendIds } })
      .populate({
        path: "userid",
        select: "_id profile.name profile.avatar"
      })
      .sort({ createdAt: -1 }) // Bài mới nhất lên đầu
      .lean();

      const formattedPosts = posts.map(post => {
        const vietnamTime = moment(post.createdAt)
          .tz("Asia/Ho_Chi_Minh")
          .format("HH:mm DD/MM/YYYY");
        
          // Đổi profile.avatar -> avatar
      const avatar = post.userid?.profile?.avatar || null;
      const name = post.userid?.profile?.name || "Unknown";
      const _id = post.userid?._id || null;
      return {
        ...post,
        userid: {
          _id,
          name,
          avatar
        },
        createdAt: vietnamTime
      };
    });
  
      res.status(200).json(formattedPosts);
  } catch (err) {
    console.error("Error fetching friend posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  getFriendPosts,
};
