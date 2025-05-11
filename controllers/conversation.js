const mongoose = require("mongoose");
const { Conversation, User } = require("../models");
const moment = require("moment-timezone");


const getChatList = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Lấy danh sách cuộc trò chuyện có liên quan đến userId
        const conversations = await Conversation.find({
            participants: new mongoose.Types.ObjectId(userId)
        }).sort({ "last_message.timestamp": -1 });

        // Lấy thông tin chi tiết của cuộc trò chuyện
        const chatList = await Promise.all(conversations.map(async (conv) => {
            // Lấy người tham gia khác
            const otherUserId = conv.participants.find(id => id.toString() !== userId);
            const otherUser = await User.findById(otherUserId, "profile.name profile.avatar isOnline lastSeen");
            
            return {
                conversationId: conv._id,
                user: {
                    id: otherUser._id,
                    name: otherUser.profile.name,
                    avatar: otherUser.profile.avatar,
                    isOnline: otherUser.isOnline,
                    lastSeen: otherUser.lastSeen
                },
                lastMessage: {
                    ...conv.last_message,
                    Time: moment(conv.last_message.timestamp)
                        .tz("Asia/Ho_Chi_Minh") // Chuyển về múi giờ Việt Nam
                        .format("hh:mm A") // Định dạng 12 giờ với AM/PM
                },
                //unreadMessages: conv.unread_messages[userId] || 0
                unreadMessages: conv.unread_messages.get(userId.toString()) || 0

            };
        }));

        res.status(200).json({ success: true, chatList });
    } catch (error) {
        console.error("Error fetching chat list:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
const createOrGetPrivateConversation = async (req, res) => {
  const { userId, userIdMe } = req.query;

  if (!userId || !userIdMe) {
    return res.status(400).json({ message: "Thiếu userId hoặc userIdMe" });
  }

  try {
    // Tìm cuộc trò chuyện private giữa 2 người (bất kể thứ tự)
    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [userId, userIdMe], $size: 2 }
    });

    // Nếu chưa có thì tạo
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, userIdMe],
        type: "private",
        unread_messages: {
          [userId]: 0,
          [userIdMe]: 0
        }
      });
    }

    return res.status(200).json({ conversationId: conversation._id.toString() });

  } catch (error) {
    console.error("Lỗi createOrGetPrivateConversation:", error);
    return res.status(500).json({ message: "Lỗi server khi xử lý cuộc trò chuyện" });
  }
};

module.exports = {
    getChatList,
    createOrGetPrivateConversation
};
