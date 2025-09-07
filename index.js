import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import chatHandlers from "./sockets/chat.js";
import videoHandlers from "./sockets/video.js";
import roomHandlers from "./sockets/roomHandlers.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.LOCAL_CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

// set io 
app.set("io", io);
app.set("onlineUsers", onlineUsers);

app.use((req, res, next) => {
  req.io = io; 
  next();
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Attach socket handlers
  chatHandlers(io, socket, onlineUsers);
  videoHandlers(io, socket, onlineUsers);
  roomHandlers(io, socket);
});

server.listen(process.env.PORT || 5000, () => {
  console.log(`⚙️ Server running on port ${process.env.PORT || 5000}`);
});
