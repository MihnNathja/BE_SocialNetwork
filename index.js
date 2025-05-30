const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const initRoutes = require('./routes');
const connectDB = require("./config/MongoDB");
const initializeSockets = require("./sockets/socketManager");
const attachIO = require('./middlewares/socketmiddleware'); // Thêm dòng này

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] // BẮT BUỘC cho Android
});

connectDB();
app.use(express.json());
app.use(attachIO(io));
initRoutes(app);
initializeSockets(io);
// ✅ HEALTHCHECK cho Railway
app.get('/', (req, res) => {
   res.send('✅ Server is alive and running!');
});
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
