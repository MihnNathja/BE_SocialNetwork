let onlineUsers = {}; // Lưu danh sách user online

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("New user connected:", socket.id);

        // Khi user kết nối
        socket.on("user_connected", (userId) => {
            onlineUsers[userId] = socket.id;  // Lưu userId và socketId
            console.log(`User ${userId} is online`);
            io.emit("update_online_users", Object.keys(onlineUsers));  // Cập nhật danh sách user online cho tất cả các client
        });
        // Khi nhận yêu cầu trạng thái online
        socket.on("request_online_status", () => {
        // Gửi lại danh sách người dùng online cho client đã yêu cầu
        const onlineUserIds = Object.keys(onlineUsers);
        io.to(socket.id).emit("update_online_users", onlineUserIds);
        });

        // Khi user tham gia phòng chat
        socket.on("join_conversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation ${conversationId}`);
        });

        // Khi nhận tin nhắn
        socket.on("send_message", (data) => {
            io.to(data.conversationId).emit("new_message", data);  // Phát tin nhắn cho tất cả người tham gia phòng chat
        });

        // Khi user ngắt kết nối
        socket.on("disconnect", () => {
            let disconnectedUser = null;

            // Tìm và xóa user trong onlineUsers khi disconnect
            Object.keys(onlineUsers).forEach(userId => {
                if (onlineUsers[userId] === socket.id) {
                    disconnectedUser = userId;
                    delete onlineUsers[userId];  // Xóa user khỏi danh sách online
                }
            });

            if (disconnectedUser) {
                console.log(`User ${disconnectedUser} disconnected`);
                io.emit("update_online_users", Object.keys(onlineUsers));  // Cập nhật lại danh sách user online sau khi ngắt kết nối
            }
        });
    });
};
