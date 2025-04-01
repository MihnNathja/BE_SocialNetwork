const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
    conversation_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Conversation", 
        required: true,
        index: true // Thêm index để tối ưu query
    },
    sender_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    message_type: { 
        type: String, 
        enum: ["text", "image"], 
        default: "text" 
    },
    image_url: { 
        type: String, 
        default: null // Thêm field cho URL ảnh
    },
    timestamp: { 
        type: Date, 
        default: Date.now,
        index: true // Thêm index cho timestamp
    },
    reply_to: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Message", 
        default: null 
    },
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true 
});

// Thêm compound index cho queries phổ biến
MessageSchema.index({ conversation_id: 1, timestamp: -1 });

// Thêm virtual field để lấy thông tin reply message
MessageSchema.virtual('reply_message', {
    ref: 'Message',
    localField: 'reply_to',
    foreignField: '_id',
    justOne: true
});


const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
