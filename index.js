const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const initRoutes = require('./routes');
const connectDB = require("./config/MongoDB");
const initializeSockets = require("./sockets/socketManager");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());
connectDB();
initRoutes(app);

// Khởi tạo tất cả các socket
initializeSockets(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});