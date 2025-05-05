const registerChatHandlers = require('./handlers/chatHandler.js/index.js');
const registerMessageHandlers = require('./handlers/messageHandler.js');
//const registerNotificationHandlers = require('./handlers/notificationHandler');

const onlineUsers = new Map(); // userId -> socketId

const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ New socket connected:', socket.id);

    registerChatHandlers(socket, io, onlineUsers);
    registerMessageHandlers(socket, io, onlineUsers);
    registerNotificationHandlers(socket, io, onlineUsers);
  });
};

module.exports = initializeSockets;
