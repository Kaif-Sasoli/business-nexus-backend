// server/roomHandlers.js
export default function roomHandlers(io, socket) {
  socket.on("room:join", ({ roomId, userId }) => {
    socket.join(roomId);

    // Send existing socket ids in the room to the new socket 
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    

    const others = clients.filter((id) => id !== socket.id);
    socket.emit("room:users", { users: others });

    // notify existing members 
    socket.to(roomId).emit("room:user-joined", { socketId: socket.id, userId });
  });

  socket.on("webrtc:offer", ({ roomId, fromUserId, sdp, toSocketId }) => {
    io.to(toSocketId).emit("webrtc:offer", {
      fromUserId,
      sdp,
      fromSocketId: socket.id,
    });
  });

  socket.on("webrtc:answer", ({ roomId, fromUserId, sdp, toSocketId }) => {
    io.to(toSocketId).emit("webrtc:answer", {
      fromUserId,
      sdp,
      fromSocketId: socket.id,
    });
  });

  socket.on("webrtc:ice", ({ roomId, fromUserId, candidate, toSocketId }) => {
    io.to(toSocketId).emit("webrtc:ice", {
      fromUserId,
      candidate,
      fromSocketId: socket.id,
    });
  });

  socket.on("room:leave", ({ roomId, userId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("room:user-left", { socketId: socket.id, userId });
  });

  socket.on("disconnect", () => {
    // notify rooms this socket was in
    const rooms = Array.from(socket.rooms || []).filter((r) => r !== socket.id);
    rooms.forEach((roomId) => {
      socket.to(roomId).emit("room:user-left", { socketId: socket.id });
    });
  });
};
  