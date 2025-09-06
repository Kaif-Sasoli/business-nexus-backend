// server.js
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import chatHandlers from "./sockets/chat.js";
import videoHandlers from "./sockets/video.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.LOCAL_CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Attach chat socket handlers
  chatHandlers(io, socket, onlineUsers);
  videoHandlers(io, socket, onlineUsers);
});

app.set("io", io);
app.set("onlineUsers", onlineUsers);

server.listen(process.env.PORT || 5000, () => {
  console.log(`⚙️ Server running on port ${process.env.PORT || 5000}`);
});
