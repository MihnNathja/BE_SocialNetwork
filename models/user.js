const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },

  profile: {
    name: { type: String, default: "" },
    favoriteTag: { type: [String], default: [] }, // Mảng tag yêu thích
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" }, // Đường dẫn ảnh đại diện
  },

  // Danh sách bạn bè
  friends: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

