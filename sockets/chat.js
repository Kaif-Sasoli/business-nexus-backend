import messageModel from "../models/message.model.js";

export default function chatHandlers(io, socket, onlineUsers) {
  // Register user and check for offline messages
  socket.on("register", async (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`✅ Registered user ${userId}`);

    try {
      const unreadMessages = await messageModel.find({
        receiverId: userId,
        isRead: false
      });

      if (unreadMessages.length > 0) {
        socket.emit("offlineMessages", unreadMessages);

        // Mark as delivered
        await messageModel.updateMany(
          { receiverId: userId, isRead: false },
          { $set: { isRead: true } }
        );
      }
    } catch (error) {
      console.error("Error fetching offline messages:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (let [userId, sId] of onlineUsers.entries()) {
      if (sId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User ${userId} disconnected`);
        break;
      }
    }
  });
}
