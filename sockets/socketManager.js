const registerChatHandlers = require('./handlers/chatHandler.js');
const registerMessageHandlers = require('./handlers/messageHandler.js');

const onlineUsers = new Map(); // userId -> socketId

const initializeSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('✅ New socket connected:', socket.id);

    try {
      registerChatHandlers(socket, io, onlineUsers);
    } catch (error) {
      console.error('Error in chatHandler:', error);
    }

    try {
      registerMessageHandlers(socket, io, onlineUsers);
    } catch (error) {
      console.error('Error in messageHandler:', error);
    }

  });
};

module.exports = initializeSockets;
