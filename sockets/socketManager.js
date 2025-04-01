// sockets/socketManager.js
const chatSocket = require('./chatSocket');
const messageSocket = require('./messageSocket');

const initializeSockets = (io) => {
    // Namespace cho chat socket cũ
    const chatIo = io.of('/chat');
    chatSocket(chatIo);

    // Namespace cho message socket mới
    const messageIo = io.of('/message');
    messageSocket(messageIo);
};

module.exports = initializeSockets;