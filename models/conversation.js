const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    last_message: {
        sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        message_type: { type: String, enum: ["text", "image"], default: "text" }
    },
    unread_messages: { type: Map, of: Number, default: {} }, // Số tin chưa đọc cho mỗi user
    type: { type: String, enum: ["private", "group"], default: "private" }
}, { timestamps: true });

module.exports = mongoose.model("Conversation", ConversationSchema);
