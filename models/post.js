const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
    {
        content: {
            caption: { type: String, required: true },
            hashtags: [{ type: String }],
            pictures: [{ type: String, required: true }],
        },
        userid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        created_at: { type: Date, default: Date.now },
        isStory: { type: Boolean, default: false },
        location: { type: String },
        reactions: [
            {
                userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                type: { type: String, enum: ["like", "love", "haha", "wow", "sad", "angry"] },
                updated_at: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true } // Thêm timestamps để có createdAt và updatedAt tự động
);

module.exports = mongoose.model("Post", PostSchema);
