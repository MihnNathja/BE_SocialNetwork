const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    message_type: { type: String, enum: ["text", "image"], default: "text" },
    timestamp: { type: Date, default: Date.now },
    reply_to: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null } // Tham chiếu tin nhắn gốc
}, { timestamps: true });

module.exports = mongoose.model("Message", MessageSchema);
