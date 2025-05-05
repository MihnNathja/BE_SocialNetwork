const Message = require('../../models/message');
const Conversation = require('../../models/conversation');
const User = require('../../models/user');
const moment = require('moment-timezone');

const formatTimestamp = (date) => {
  return moment(date).tz('Asia/Ho_Chi_Minh').format('HH:mm - DD/MM/YYYY');
};

module.exports = (socket, io, onlineUsers) => {
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('typing', ({ conversationId, userId, isTyping }) => {
    socket.to(conversationId).emit('user_typing', { userId, isTyping });
  });

  socket.on('send_message', async (messageData) => {
    try {
      const { conversation_id, sender, content, message_type, timestamp } = messageData;

      const newMessage = await Message.create({
        conversation_id,
        sender_id: sender.id,
        content,
        message_type,
        timestamp: new Date(parseInt(timestamp)),
      });

      const conversation = await Conversation.findById(conversation_id);
      const receiverId = conversation.participants.find(id => id !== sender.id);

      const lastMessageContent = message_type === 'image' ? 'Đã gửi hình ảnh' : content;

      await Conversation.findByIdAndUpdate(conversation_id, {
        $set: {
          last_message: {
            content: lastMessageContent,
            sender_id: sender.id,
            timestamp: newMessage.createdAt,
            message_type
          },
          updatedAt: new Date()
        },
        $inc: {
          [`unread_messages.${receiverId}`]: 1
        }
      });

      const senderInfo = await User.findById(sender.id).select('_id username profile.name profile.avatar');

      io.to(conversation_id).emit('new_message', {
        id: newMessage._id,
        conversation_id,
        sender_id: {
          _id: senderInfo._id,
          username: senderInfo.username,
          name: senderInfo.profile.name,
          avatar: senderInfo.profile.avatar
        },
        content,
        message_type,
        timestamp: formatTimestamp(newMessage.createdAt),
        createdAt: newMessage.createdAt
      });

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('notification', {
          type: 'new_message',
          senderId: sender.id,
          content: `Tin nhắn mới từ ${senderInfo.profile.name}`
        });
      }

    } catch (err) {
      console.error(err);
      socket.emit('message_error', { message: 'Lỗi gửi tin nhắn', error: err.message });
    }
  });

  socket.on('mark_read', async ({ conversationid, userid }) => {
    await Conversation.findByIdAndUpdate(conversationid, {
      $set: { [`unread_messages.${userid}`]: 0 }
    });
  });
};
