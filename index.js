const express = require('express');
require('dotenv').config();
const http = require('http'); // Import HTTP module
const { Server } = require('socket.io'); // Import socket.io
const initRoutes = require('./routes')
const connectDB = require("./config/MongoDB");
const chatSocket = require("./sockets/chatSocket");

// Sử dụng express.json() để parse JSON body từ client
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
connectDB();
initRoutes(app);

// Kết nối Socket.IO
chatSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});