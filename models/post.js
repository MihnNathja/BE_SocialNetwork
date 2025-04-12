const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
    {
        content: {
            caption: { type: String, required: true },
            hashtags: [{ type: String }],
            pictures: [{ type: String, required: true }],
        },
        userid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        isStory: { type: Boolean, default: false },
        location: { type: String },
        reaction: {
            like: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            love: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            haha: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            heart: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: []
            }],
            wow: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            sad: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            angry: [{
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: []
            }],
            // Thêm các loại cảm xúc khác nếu muốn
          },
    },
    { timestamps: true } // Thêm timestamps để có createdAt và updatedAt tự động
);

module.exports = mongoose.model("Post", PostSchema);
