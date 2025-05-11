const User = require("../models/user"); // Import User model từ Mongoose
const Post = require("../models/post");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendMail } = require("../utils/mail");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");


// 📌 Lấy thông tin người dùng theo username
const getUserByUsername = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).select("-password"); // Loại bỏ password khi trả về
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu người dùng:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi khi lấy dữ liệu người dùng" });
    }
};
const getProfile = async (req, res) => {
    try {
      const { userId } = req.params;
      // Tìm user theo ID
      const user = await User.findById(userId).select("username profile avatar friends bio favoriteTags");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Đếm số bài viết của user
      const postsCount = await Post.countDocuments({ userid: userId });
  
      // Chuẩn bị dữ liệu trả về
      const responseData = {
        id: user._id,
        username: user.username,
        name: user.profile.name,
        avatar: user.profile.avatar,
        friendsCount: user.friends.accepted.length,
        postsCount: postsCount, // Số lượng bài viết
        bio: user.profile.bio,
        favoriteTags: user.profile.favoriteTag || []
      };
  
      res.status(200).json(responseData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

// 📌 Đăng nhập người dùng
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Vui lòng cung cấp username và password" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Sai username hoặc password" });
        }

        const userData = user.toObject();
        delete userData.password; // Xóa password trước khi gửi về

        return res.status(200).json({
            message: "Đăng nhập thành công",
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                name: user.profile.name,
                avatar: user.profile.avatar,
            }
        });
    } catch (error) {
        console.error("Lỗi khi đăng nhập:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại sau" });
    }
};

// 📌 Đăng ký người dùng
const register = async (req, res) => {
    const { username, email, password } = req.body;

    // 🔹 Kiểm tra xem các trường có đầy đủ không
    if (!username || !email || !password ) {
        return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }


    try {
        // 🔹 Kiểm tra username hoặc email đã tồn tại chưa
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username hoặc email đã tồn tại" });
        }

        // 🔹 Tạo OTP ngẫu nhiên và mã hóa mật khẩu
        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Tạo user mới
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            otp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        await newUser.save();
        await sendMail(email, "Xác minh tài khoản", `Mã OTP của bạn là: ${otp}`);

        return res.status(200).json({ message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản." });
    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};


// 📌 Xác minh tài khoản bằng OTP
const verifyAccount = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: "Vui lòng xác nhận mã OTP" });
    }

    try {
        const user = await User.findOne({ email, otp });
        if (!user) {
            return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        return res.status(200).json({ message: "Xác minh tài khoản thành công!" });
    } catch (error) {
        console.error("Lỗi xác minh tài khoản:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};

// 📌 Quên mật khẩu - Gửi OTP
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Vui lòng cung cấp email" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email không tồn tại" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        user.otp = otp;
        user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendMail(email, "Quên mật khẩu", `Mã OTP của bạn là: ${otp}`);

        return res.status(200).json({ message: "Đã gửi mã OTP đến email của bạn." });
    } catch (error) {
        console.error("Lỗi quên mật khẩu:", error);
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
};
// 📌 Xác nhận OTP khi lấy lại mật khẩu
const verifyOTP =  async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp ) {
        return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin" });
    }
    try {
        const user = await User.findOne({ email, otp });
        if (!user) {
            return res.status(400).json({ message: "Mã OTP không hợp lệ" });
        }

        user.otp = null;
        await user.save();

        return res.status(200).json({ message: "Mã OTP chính xác" });
    } catch (error) {
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại." });
    }
    
}
// 📌 Đặt lại mật khẩu

const resetPassword = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ thông tin." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Mật khẩu xác nhận không khớp." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    try {
        // Kiểm tra xem email có tồn tại không
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Email không tồn tại." });
        }

        // Mã hóa mật khẩu mới
        user.password = await bcrypt.hash(newPassword, 10);
        
        // Xóa thông tin OTP để tránh sử dụng lại
        user.otp = null;
        user.otpExpiresAt = null;
        await user.save();

        return res.status(200).json({ message: "Đặt lại mật khẩu thành công." });
    } catch (error) {
        return res.status(500).json({ message: "Đã xảy ra lỗi, vui lòng thử lại sau." });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { userId, fullname, bio } = req.body;
        let avatarUrl = null;

        // Nếu có file ảnh thì upload lên Cloudinary
        if (req.file) {
            try {
                avatarUrl = await uploadImageToCloudinary(req.file);
            } catch (error) {
                return res.status(500).json({ error: "Lỗi upload ảnh!" });
            }
        }

        // Cập nhật thông tin user
        await updateUserProfile(userId, fullname, bio, avatarUrl, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server!" });
    }
};

// Upload ảnh lên Cloudinary
const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "avatars" },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        stream.end(file.buffer);
    });
};

// Cập nhật user vào database
async function updateUserProfile(userId, fullname, bio, avatarUrl, res) {
    try {
        const updateData = {};
        if (fullname) updateData["profile.name"] = fullname;
        if (bio) updateData["profile.bio"] = bio;
        if (avatarUrl) updateData["profile.avatar"] = avatarUrl;

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!user) return res.status(404).json({ error: "Người dùng không tồn tại!" });

        res.json({
            message: "Cập nhật thành công!",
            user: {
                fullname: user.profile.name,
                bio: user.profile.bio,
                avatar: user.profile.avatar,
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi cập nhật thông tin!" });
    }
}

const searchUser = async (req, res) => {
    try {
        // Lấy từ khóa tìm kiếm từ query string
        const { keyword, userId } = req.query;  // Thêm userId để tính bạn chung

        
        // Nếu không có từ khóa, trả về lỗi
        if (!keyword) {
          return res.status(400).json({ message: 'Vui lòng cung cấp từ khóa tìm kiếm' });
        }
        // Lấy thông tin người dùng hiện tại để lấy danh sách bạn bè
        const currentUser = await User.findById(userId); // Lấy thông tin người dùng hiện tại
        const currentUserFriends = currentUser.friends.accepted;  // Lấy danh sách bạn bè của người dùng hiện tại
    
        // Tìm kiếm người dùng trong profile.name và email
        const users = await User.find({
          $or: [
            { 'profile.name': { $regex: keyword, $options: 'i' } }, // Tìm theo tên
            // { email: { $regex: keyword, $options: 'i' } }            // Tìm theo email
          ]
        }).select('username email profile.name profile.avatar friends.accepted'); // Chọn các trường cần thiết
         // Tính số bạn chung
         const result = [];
         for (let user of users) {
           const userFriends = user.friends.accepted;
     
           // Tính số bạn chung
           const mutualFriends = userFriends.filter(friend => currentUserFriends.includes(friend.toString())).length;
     
           // Kiểm tra xem người dùng hiện tại có phải là bạn của người tìm kiếm không
           const isFriend = currentUserFriends.includes(user._id.toString());
     
           // Thêm kết quả vào mảng
           result.push({
             userId: user._id,
             name: user.profile.name,
             avatarResId: user.profile.avatar,
             mutualFriends: mutualFriends,  // Thêm số bạn chung
             isFriend: isFriend  // Thêm trường isFriend
           });
         }
     
         // Trả về kết quả tìm kiếm
         return res.status(200).json(result);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Có lỗi xảy ra khi tìm kiếm người dùng' });
    }
};

const uploadAvatar = async (req, res) => {
    // try {
    //     const { userId } = req.params;

    //     if (!req.file) {
    //         return res.status(400).json({ error: "Vui lòng chọn ảnh để upload!" });
    //     }

    //     // Lưu ảnh tạm vào file buffer
    //     const fileBuffer = `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`;

    //     // Upload ảnh lên Cloudinary
    //     const result = await cloudinary.uploader.upload(fileBuffer, {
    //         folder: "avatars", 
    //     });

    //      // Cập nhật URL avatar vào MongoDB
    //      const user = await User.findByIdAndUpdate(userId, 
    //         { avatar: result.secure_url, updatedAt: new Date() }, 
    //         { new: true }
    //     ).select("_id username email avatar updatedAt");

    //     return res.json({ message: "Upload thành công", user });
    // } catch (error) {
    //     return res.status(500).json({ error: error.message });
    // }
};
const getProfileUser = async (req, res) => {
    try {
      const { userId, userIdMe } = req.params; // userId là ID người được xem profile, userIdUser là ID người yêu cầu
      // Tìm user theo ID
      const user = await User.findById(userId).select("username profile avatar friends bio favoriteTags");
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Tìm user yêu cầu (người đang xem profile)
      const requester = await User.findById(userIdMe).select("friends");
  
      if (!requester) {
        return res.status(404).json({ message: "Requester not found" });
      }
  
      // Kiểm tra mối quan hệ giữa user và requester
      let relationship = "none"; // Mặc định là không có mối quan hệ
      if (requester.friends.accepted.includes(userId)) {
        relationship = "friend"; // Nếu đã là bạn bè
      } else if (requester.friends.pending.includes(userId)) {
        relationship = "pending"; // Nếu đang chờ chấp nhận kết bạn
     } else if (user.friends.pending.includes(userIdMe)) {
        relationship = "received"; // Người ta đã gửi lời mời cho bạn
      } else if (requester.friends.blocked.includes(userId)) {
        relationship = "blocked"; // Nếu bị chặn
      }
  
      // Đếm số bài viết của user
      const postsCount = await Post.countDocuments({ userid: userId });
  
      // Chuẩn bị dữ liệu trả về
      const responseData = {
        id: user._id,
        username: user.username,
        name: user.profile.name,
        avatar: user.profile.avatar,
        friendsCount: user.friends.accepted.length,
        postsCount: postsCount, // Số lượng bài viết
        bio: user.profile.bio,
        favoriteTags: user.profile.favoriteTag || [],
        relationship: relationship // Trả về mối quan hệ
      };
  
      res.status(200).json(responseData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};
const addFriend = async (req, res) => {
    const { userId, userIdMe } = req.params;
    
  
    try {
      if (userId === userIdMe) {
        return res.status(400).json({ message: "Không thể kết bạn với chính mình." });
      }
  
      const fromUser = await User.findById(userIdMe);
      const toUser = await User.findById(userId);
  
      if (!fromUser || !toUser) {
        return res.status(404).json({ message: "Người dùng không tồn tại." });
      }
  
      // Kiểm tra đã là bạn bè chưa
      if (toUser.friends.accepted.includes(userIdMe)) {
        return res.status(400).json({ message: "Hai người đã là bạn bè." });
      }
  
      // Kiểm tra đã gửi lời mời chưa
      if (toUser.friends.pending.includes(userIdMe)) {
        return res.status(400).json({ message: "Đã gửi lời mời kết bạn rồi." });
      }
  
      // Gửi lời mời: thêm fromUserId vào toUser.friends.pending
      toUser.friends.pending.push(userIdMe);
      await toUser.save();
  
      return res.status(200).json({ message: "Đã gửi lời mời kết bạn." });
    } catch (error) {
      console.error("Add friend error:", error);
      return res.status(500).json({ message: "Lỗi máy chủ." });
    }
};
const acceptFriend = async (req, res) => {
    const { userId, userIdMe } = req.params;
    console.log(userId);
    console.log(userIdMe);
    try {
      const me = await User.findById(userIdMe);
      const you = await User.findById(userId);
  
      if (!me || !you) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }
  
      // Kiểm tra xem có lời mời không
      if (!me.friends.pending.includes(userId)) {
        return res.status(400).json({ message: 'Không có lời mời kết bạn nào từ người này.' });
      }
  
      // Xóa khỏi danh sách lời mời
      me.friends.pending = me.friends.pending.filter(id => id.toString() !== userId);
      // Thêm bạn bè cho cả hai
      me.friends.accepted.push(userId);
      you.friends.accepted.push(userIdMe);
  
      await me.save();
      await you.save();
  
      return res.status(200).json({ message: 'Đã chấp nhận lời mời kết bạn.' });
    } catch (error) {
      console.error('Accept friend error:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
  };

  const rejectFriend = async (req, res) => {
    const { userId, userIdMe } = req.params;
  
    try {
      const me = await User.findById(userIdMe);
      const you = await User.findById(userId);
  
      if (!me || !you) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }
  
      // Kiểm tra xem có lời mời không
      if (!me.friends.pending.includes(userId)) {
        return res.status(400).json({ message: 'Không có lời mời kết bạn nào từ người này.' });
      }
  
      // Xóa lời mời kết bạn từ danh sách pending
      me.friends.pending = me.friends.pending.filter(id => id.toString() !== userId);
  
      await me.save();
  
      return res.status(200).json({ message: 'Đã từ chối lời mời kết bạn.' });
    } catch (error) {
      console.error('Reject friend error:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
  };
  
const getFriendRequests = async (req, res) => {
  const { userId } = req.params;

  try {
    const currentUser = await User.findById(userId).lean();
    if (!currentUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const pendingIds = currentUser.friends.pending; // Người đã gửi lời mời

    const users = await User.find({ _id: { $in: pendingIds } })
      .select("profile.name profile.avatar friends.accepted")
      .lean();

    // Lấy danh sách bạn bè của currentUser để tính mutual friends
    const currentUserFriends = currentUser.friends.accepted.map(id => id.toString());

    const response = users.map((user) => {
      const mutualCount = user.friends.accepted.filter(id =>
        currentUserFriends.includes(id.toString())
      ).length;

      return {
        userId: user._id,
        name: user.profile.name,
        avatarResId: user.profile.avatar,
        mutualFriends: mutualCount.toString(),
        type: 0 // TYPE_REQUEST
      };
    });

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi lấy lời mời kết bạn" });
  }
};

const getFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy user hiện tại
    const currentUser = await User.findById(userId).select('friends.accepted');
    if (!currentUser) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const currentFriendIds = currentUser.friends.accepted.map(id => id.toString());

    // Lấy thông tin chi tiết các bạn bè
    const friends = await User.find({
      _id: { $in: currentFriendIds }
    }).select('profile.name profile.avatar friends.accepted');

    // Xử lý trả về
    const result = friends.map(friend => {
      const friendId = friend._id.toString();

      // Tính số bạn chung (giữa chính user và từng người bạn)
      const mutualCount = friend.friends.accepted
        .map(fid => fid.toString())
        .filter(fid => currentFriendIds.includes(fid)).length;

      return {
        userId: friendId,
        name: friend.profile.name,
        avatarResId: friend.profile.avatar,
        mutualFriends: mutualCount,
        isFriend: true
      };
    });

    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Có lỗi xảy ra khi lấy danh sách bạn bè" });
  }
};
const unFriend = async (req, res) => {
  const { userId, userIdMe } = req.params;

  if (!userId || !userIdMe) {
    return res.status(400).json({ message: "Thiếu userId hoặc userIdMe" });
  }

  try {
    // Gỡ userId khỏi danh sách bạn bè của userIdMe
    await User.findByIdAndUpdate(userIdMe, {
      $pull: { "friends.accepted": userId }
    });

    // Gỡ userIdMe khỏi danh sách bạn bè của userId
    await User.findByIdAndUpdate(userId, {
      $pull: { "friends.accepted": userIdMe }
    });

    return res.status(200).json({ message: "Huỷ kết bạn thành công" });

  } catch (error) {
    console.error("Lỗi huỷ kết bạn:", error);
    return res.status(500).json({ message: "Lỗi server khi huỷ kết bạn" });
  }
};

const getSuggestedFriends = async (req, res) => {
  const { userId } = req.params;

  try {
    // Lấy thông tin người dùng
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Lấy danh sách bạn bè đã kết bạn và đang chờ xác nhận
     // Danh sách bạn bè và pending của user
    const friends = [...user.friends.accepted, ...user.friends.pending].map(id => id.toString());
    //console.log("User's friends (accepted + pending):", friends);

    // Lấy danh sách bạn bè của user (để tìm friends of friends)
    const friendsData = await User.find(
      { _id: { $in: user.friends.accepted } },
      "friends.accepted"
    );

    // Tìm friends of friends
    let friendsOfFriendsSet = new Set();
    friendsData.forEach(friend => {
      friend.friends.accepted.forEach(fof => {
        const fofId = fof.toString();
        if (fofId !== userId && !friends.includes(fofId)) {
          friendsOfFriendsSet.add(fofId);
        }
      });
    });

    //console.log("Friends of friends (loại trừ bạn cũ và chính mình):", friendsOfFriendsSet);

    // Tìm người dùng theo danh sách bạn của bạn
    const suggestedFriends = await User.find({
      _id: { $in: Array.from(friendsOfFriendsSet).map(id => new mongoose.Types.ObjectId(id)) }
    }).limit(10);

    if (suggestedFriends.length === 0) {
      return res.status(200).json({ message: "Không có bạn bè gợi ý" });
    }

    // Tính số bạn chung và định dạng kết quả
    const result = await Promise.all(
      suggestedFriends.map(async (friend) => {
        const mutualFriends = friend.friends.accepted.filter(id =>
          user.friends.accepted.includes(id.toString())
        ).length;

        return {
          userId: friend._id,
          name: friend.profile.name,
          avatarResId: friend.profile.avatar,
          mutualFriends: mutualFriends.toString(),
          type: 1,
          isRequestSent: friend.friends.pending.includes(userId)
        };
      })
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const cancelFriendRequest = async (req, res) => {
  const { userId, userIdMe } = req.params;

  try {
    // Lấy user gửi lời mời (userIdMe)
    const sender = await User.findById(userIdMe);
    if (!sender) return res.status(404).json({ message: "Người gửi không tồn tại" });

    // Lấy user nhận lời mời (userId)
    const receiver = await User.findById(userId);
    if (!receiver) return res.status(404).json({ message: "Người nhận không tồn tại" });

    // Xóa userId khỏi danh sách pending của sender
    receiver.friends.pending = receiver.friends.pending.filter(id => id.toString() !== userIdMe);
    await receiver.save();

    // // Xóa userIdMe khỏi danh sách requested của receiver (nếu bạn dùng requested)
    // if (receiver.friends.requested) {
    //   receiver.friends.requested = receiver.friends.requested.filter(id => id.toString() !== userIdMe);
    // }
    // await receiver.save();

    return res.status(200).end(); // Trả về thành công nhưng không có body
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
    getUserByUsername,
    login,
    register,
    verifyAccount,
    forgotPassword,
    verifyOTP,
    resetPassword,
    uploadAvatar,
    getProfile,
    updateProfile,
    searchUser,
    getProfileUser,
    addFriend,
    acceptFriend,
    rejectFriend,
    getFriendRequests,
    getFriends,
    unFriend,
    getSuggestedFriends,
    cancelFriendRequest
};
