module.exports = (socket, io, onlineUsers) => {
  socket.on('user_connected', (userId) => {
    socket.data.userId = userId;
    onlineUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} connected`);

    io.emit("update_online_users", Array.from(onlineUsers.keys()));
    socket.broadcast.emit("user_status_change", userId, true);
  });

  socket.on('request_online_status', () => {
    socket.emit("update_online_users", Array.from(onlineUsers.keys()));
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      onlineUsers.delete(userId);
      io.emit("user_status_change", userId, false);
      io.emit("update_online_users", Array.from(onlineUsers.keys()));
      console.log(`❌ User ${userId} disconnected`);
    }
  });
};
