const User = require("../models/user"); // Import User model từ Mongoose
const Post = require("../models/post");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendMail } = require("../utils/mail");
const cloudinary = require("../config/cloudinary");

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
        fullname: user.profile.name,
        avatar: user.profile.avatar,
        friendsCount: user.friends.length,
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
};
