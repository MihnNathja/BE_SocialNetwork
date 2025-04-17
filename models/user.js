const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  isOnline: { type: Boolean, default: false }, // Trạng thái online
  lastSeen: { type: Date, default: Date.now },  // Lần cuối online

  profile: {
    name: { type: String, default: "" },
    favoriteTag: { type: [String], default: [] }, // Mảng tag yêu thích
    bio: { type: String, default: "" },
    avatar: { type: String, default: "" }, // Đường dẫn ảnh đại diện
  },

  // Danh sách bạn bè
  friends: {
    pending: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    accepted: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
    blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

