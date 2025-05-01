const Post = require("../models/post");
const User = require("../models/user");
const moment = require("moment-timezone");
const mongoose = require("mongoose");

const getFriendPosts = async (req, res) => {
  try {
    const userId = req.params.userId;

    // 1. Tìm user và danh sách bạn bè
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    //const friendIds = user.friends.accepted;
    const friendIds = (user.friends?.accepted || []).map(id => new mongoose.Types.ObjectId(id));


    // 2. Lấy post của bạn bè
    const posts = await Post.find({ userid: { $in: friendIds } })
      .populate({
        path: "userid",
        select: "_id profile.name profile.avatar"
      })
      .sort({ createdAt: -1 }) // Bài mới nhất lên đầu
      .lean();

      // 3. Format bài viết và gán myReaction
    const formattedPosts = posts.map(post => {
      const vietnamTime = moment(post.createdAt)
        .tz("Asia/Ho_Chi_Minh")
        .format("HH:mm DD/MM/YYYY");

      const avatar = post.userid?.profile?.avatar || null;
      const name = post.userid?.profile?.name || "Unknown";
      const _id = post.userid?._id || null;

      // Tìm cảm xúc hiện tại của user này với bài viết
      let myReaction = null;
      if (post.reactions) {
        for (const [key, userIds] of Object.entries(post.reactions)) {
          if (userIds.map(String).includes(userId)) {
            myReaction = mapReactionKeyToLabel(key);
            break;
          }
        }
      }

      return {
        ...post,
        userid: {
          _id,
          name,
          avatar
        },
        createdAt: vietnamTime,
        myReaction
      };
    });

    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error("Error fetching friend posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const addOrUpdateReaction = async (req, res) => {
  const { postId } = req.params;
  const { userId, reaction } = req.body;

  try {
    const englishReaction = reactionMap[reaction] || "like";  // Nếu không có trong map, mặc định là "like"

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Xoá userId khỏi tất cả các reaction cũ (nếu có)
    for (const key in post.reactions) {
        if (Array.isArray(post.reactions[key])) {
            post.reactions[key] = post.reactions[key].filter(id => id.toString() !== userId.toString());
        }
    }

    // Thêm userId vào reaction mới
    if (!Array.isArray(post.reactions[englishReaction])) {
      post.reactions[reacenglishReactiontion] = [];  // Khởi tạo nếu chưa có mảng
    }
    post.reactions[englishReaction].push(userId);

    await post.save();
    res.status(200).json({ message: "Reaction updated" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  }
};
const deleteReaction = async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.query;

  try {
  // Lấy bài viết từ database
  const post = await Post.findById(postId);

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

// Lặp qua tất cả các loại reaction để tìm reaction của userId
let reactionFound = false;
for (const [reaction, userIds] of Object.entries(post.reactions)) {
  const userIndex = userIds.indexOf(userId);

  if (userIndex !== -1) {
    // Nếu tìm thấy userId trong reaction, xóa userId khỏi mảng
    userIds.splice(userIndex, 1);
    post.reactions[reaction] = userIds;  // Cập nhật lại mảng reaction

    reactionFound = true;  // Đánh dấu là đã tìm thấy và xóa thành công
    break;
  }
}

if (!reactionFound) {
  return res.status(400).json({ message: "Reaction not found for this user" });
}

// Lưu bài viết đã cập nhật
await post.save();

return res.status(200).json({ message: "Reaction removed successfully" });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  }
};
const getMyPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const posts = await Post.find({ userid: userId })
      .populate({
        path: "userid",
        select: "_id profile.name profile.avatar"
      })
      .sort({ createdAt: -1 }) // Bài mới nhất lên đầu
      .lean();

      // 3. Format bài viết và gán myReaction
    const formattedPosts = posts.map(post => {
      const vietnamTime = moment(post.createdAt)
        .tz("Asia/Ho_Chi_Minh")
        .format("HH:mm DD/MM/YYYY");

      const avatar = post.userid?.profile?.avatar || null;
      const name = post.userid?.profile?.name || "Unknown";
      const _id = post.userid?._id || null;

      // Tìm cảm xúc hiện tại của user này với bài viết
      let myReaction = null;
      if (post.reactions) {
        for (const [key, userIds] of Object.entries(post.reactions)) {
          if (userIds.map(String).includes(userId)) {
            myReaction = mapReactionKeyToLabel(key);
            break;
          }
        }
      }

      return {
        ...post,
        userid: {
          _id,
          name,
          avatar
        },
        createdAt: vietnamTime,
        myReaction
      };
    });

    res.status(200).json(formattedPosts);
  } catch (err) {
    console.error("Error fetching friend posts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Hàm chuyển key -> label tiếng Việt
function mapReactionKeyToLabel(key) {
  const map = {
    like: "Thích",
    love: "Thương",
    haha: "Haha",
    wow: "Wow",
    sad: "Buồn",
    angry: "Giận",
    heart: "Tim" // nếu có dùng
  };
  return map[key] || null;
}

const reactionMap = {
  "Thích": "like",
  "Thương": "love",
  "Haha": "haha",
  "Tim": "heart",
  "Wow": "wow",
  "Buồn": "sad",
  "Giận": "angry"
};

const getPostByID = async (req, res) => {
  try {
    const postId = req.query.postId;
    const userId = req.query.userId;

    // Kiểm tra nếu thiếu postId hoặc userId
    if (!postId || !userId) {
      return res.status(400).json({ message: "postId and userId are required" });
    }

    // Kiểm tra xem postId có phải là một ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid postId format" });
    }

    // Kiểm tra xem userId có phải là một ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    // Tìm bài viết theo ID và populate thông tin người dùng
    const post = await Post.findById(postId)
    .populate({
      path: "userid",
      select: "_id profile.name profile.avatar"
    });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Kiểm tra xem thông tin người dùng có tồn tại không
    const user = post.userid;
    if (!user) {
      return res.status(404).json({ message: "User not found for the post" });
    }

    // Format thời gian
    const vietnamTime = moment(post.createdAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("HH:mm DD/MM/YYYY");

      const avatar = post.userid?.profile?.avatar || null;
      const name = post.userid?.profile?.name || "Unknown";
      const _id = post.userid?._id || null;

    // Tìm cảm xúc của user này đối với bài viết
    let myReaction = null;
    if (post.reactions) {
      for (const [key, userIds] of Object.entries(post.reactions)) {
        if (userIds.map(String).includes(userId)) {
          myReaction = mapReactionKeyToLabel(key);
          break;
        }
      }
    }

    // Cấu trúc lại dữ liệu bài viết
    const formattedPost = {
      _id: post._id.toString(),  // ID bài viết
      content: post.content,
      isStory: post.isStory,
      location: post.location,
      reactions: post.reactions,
      myReaction: myReaction,  // Cảm xúc của người dùng đối với bài viết
      userid: {
        _id,
        name,
        avatar,
      },
      createdAt: vietnamTime,
      updatedAt: moment(post.updatedAt).tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY"),
    };

    res.status(200).json(formattedPost);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
  getFriendPosts,
  addOrUpdateReaction,
  deleteReaction,
  getMyPosts,
  getPostByID
};
