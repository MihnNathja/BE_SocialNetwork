module.exports = (socket, io, onlineUsers) => {
  socket.on('send_notification', (data) => {
    const { receiverId, type, postId, senderId, content } = data;

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('notification', {
        type,
        postId,
        senderId,
        content
      });
    }
  });
};
