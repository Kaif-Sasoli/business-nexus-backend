export default function videoHandlers(io, socket, onlineUsers) {
  // Caller invites callee
  socket.on("call:invite", ({ fromUserId, toUserId, callType }) => {
    const toSocketId = onlineUsers.get(String(toUserId));
    if (toSocketId) {
      io.to(toSocketId).emit("call:incoming", { fromUserId, callType });
    } else {
      socket.emit("call:error", { message: "User is offline" });
    }
  });

  // Callee accepts
  socket.on("call:accept", ({ fromUserId, toUserId }) => {
    const toSocketId = onlineUsers.get(String(toUserId));
    if (toSocketId) io.to(toSocketId).emit("call:accepted", { fromUserId });
  });

  // Callee declines
  socket.on("call:decline", ({ fromUserId, toUserId }) => {
    const toSocketId = onlineUsers.get(String(toUserId));
    if (toSocketId) io.to(toSocketId).emit("call:declined", { fromUserId });
  });

  // SDP offer
  socket.on("webrtc:offer", ({ toUserId, fromUserId, sdp }) => {
    const toSocketId = onlineUsers.get(String(toUserId));
    if (toSocketId) io.to(toSocketId).emit("webrtc:offer", { fromUserId, sdp });
  });

  // SDP answer
  socket.on("webrtc:answer", ({ toUserId, fromUserId, sdp }) => {
    const toSocketId = onlineUsers.get(String(toUserId));
    if (toSocketId) io.to(toSocketId).emit("webrtc:answer", { fromUserId, sdp });
  });

  // ICE candidates
  socket.on("webrtc:ice", ({ toUserId, fromUserId, candidate }) => {
    const toSocketId = onlineUsers.get(String(toUserId));
    if (toSocketId) io.to(toSocketId).emit("webrtc:ice", { fromUserId, candidate });
  });

  // End call (✅ notify BOTH peers)
  socket.on("call:end", ({ toUserId, fromUserId }) => {
    const toSocketId = onlineUsers.get(String(toUserId));

    if (toSocketId) {
      io.to(toSocketId).emit("call:ended", { fromUserId });
    }

    // Also notify sender so they clean up too
    socket.emit("call:ended", { fromUserId, toUserId });
  });
}
