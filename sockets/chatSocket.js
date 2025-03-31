let onlineUsers = {}; // Lưu danh sách user online

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("New user connected:", socket.id);

        // Khi user kết nối
        socket.on("user_connected", (userId) => {
            onlineUsers[userId] = socket.id;  // Lưu userId và socketId
            console.log(`User ${userId} is online`);
            
            // Gửi danh sách online cho user mới kết nối
            socket.emit("update_online_users", Object.keys(onlineUsers));
            
            // Gửi thông báo cho các user khác
            socket.broadcast.emit("user_status_change", userId, true);
            
            // Cập nhật danh sách cho tất cả
            io.emit("update_online_users", Object.keys(onlineUsers));
        });

        // Khi nhận yêu cầu trạng thái online
        socket.on("request_online_status", () => {
            // Gửi lại danh sách người dùng online cho client đã yêu cầu
            const onlineUserIds = Object.keys(onlineUsers);
            socket.emit("update_online_users", onlineUserIds);
        });

        // Khi user ngắt kết nối
        socket.on("disconnect", () => {
            let disconnectedUser = null;

            // Tìm và xóa user trong onlineUsers khi disconnect
            Object.keys(onlineUsers).forEach(userId => {
                if (onlineUsers[userId] === socket.id) {
                    disconnectedUser = userId;
                    delete onlineUsers[userId];
                }
            });

            if (disconnectedUser) {
                console.log(`User ${disconnectedUser} disconnected`);
                // Gửi thông báo cho tất cả các client
                io.emit("user_status_change", disconnectedUser, false);
                io.emit("update_online_users", Object.keys(onlineUsers));
            }
        });
    });
};
