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
    const posts = await Post.find({ userid: { $in: friendIds }, isStory: false })
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
    const posts = await Post.find({ userid: userId, isStory: false })
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

const createStory = async (req, res) => {
  try {
    const { userid, content, isStory} = req.body;
    const userIdValue = typeof userid === "object" && userid._id ? userid._id : userid;
    if (!userid || !content) {
      return res.status(400).json({ message: "userid và content là bắt buộc" });
    }

    const newStory = new Post({
      userid: userIdValue,
      isStory: isStory,
      content: {
        caption: content.caption,
        pictures: content.pictures,
        hashtags: extractHashtags(content.hashtags)
      }
    });

    const savedStory = await newStory.save();
    res.status(201).json({
      message: "Story đã được tạo",
      story: savedStory
    });
  } catch (err) {
    console.error("Lỗi khi tạo story:", err);
    res.status(500).json({ message: "Lỗi server khi tạo story" });
  }
};
function extractHashtags(text) {
  if (!text) return [];
  return text.match(/#\w+/g) || [];
}
const getUserStories = async (req, res) => {
  
  try {
    const userId = req.params.userId;
      // 1. Tìm danh sách bạn bè
      const user = await User.findById(userId).lean();
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const friendIds = user.friends?.accepted || [];
      const visibleUserIds = [user._id, ...friendIds.map(id => new mongoose.Types.ObjectId(id))];

      // 2. Tính thời gian 24h trước
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 3. Aggregation pipeline
    const stories = await Post.aggregate([
      {
        $match: {
          isStory: true,
          userid: { $in: visibleUserIds },
          createdAt: { $gte: twentyFourHoursAgo }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userid',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $sort: { createdAt: -1 } }
    ]);
        // 4. Format lại dữ liệu
        const formattedStories = stories.map(story => ({
          _id: story._id,
          content: story.content,
          createdAt: moment(story.createdAt).tz("Asia/Ho_Chi_Minh").format("HH:mm DD/MM/YYYY"),
          userid: {
            _id: story.user._id,
            name: story.user.profile?.name || 'Unknown',
            avatar: story.user.profile?.avatar || null
          }
        }));
    
        return res.status(200).json(formattedStories);
      } catch (err) {
        console.error('Lỗi khi lấy stories:', err);
        return res.status(500).json({ message: 'Lỗi server' });
      }
};

const searchPostsByHashtag = async (req, res) => {
  try {
    const { keyword, userId } = req.query;

    if (!keyword) {
      return res.status(400).json({ message: "Hashtag is required" });
    }
    // Tìm tất cả bài viết chứa hashtag (không phân biệt # hay không, không phân biệt hoa thường)
    const regex = new RegExp(`^#?${keyword}$`, "i");

    const posts = await Post.find({ "content.hashtags": { $in: [regex] } })
      .populate({
        path: "userid",
        select: "_id profile.name profile.avatar"
      })
      .sort({ createdAt: -1 })
      .lean();

    // Format kết quả giống getFriendPosts
    const formattedPosts = posts.map(post => {
      const vietnamTime = moment(post.createdAt)
        .tz("Asia/Ho_Chi_Minh")
        .format("HH:mm DD/MM/YYYY");

      const avatar = post.userid?.profile?.avatar || null;
      const name = post.userid?.profile?.name || "Unknown";
      const _id = post.userid?._id || null;

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
    console.error("Error searching posts by hashtag:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getFriendPosts,
  addOrUpdateReaction,
  deleteReaction,
  getMyPosts,
  getPostByID,
  createStory,
  getUserStories,
  searchPostsByHashtag
};
