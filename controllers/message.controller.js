// controllers/message.controller.js
import messageModel from "../models/message.model.js";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";


export const sendMessage = async (req, res) => {
  try {
    // what are whe are doing here
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Save message
    const newMessage = await messageModel.create({
      senderId,
      receiverId,
      content,
      isRead: false,
    });

    const normalizedMessage = {
      id: newMessage._id.toString(),
      senderId: newMessage.senderId.toString(),
      receiverId: newMessage.receiverId.toString(),
      content: newMessage.content,
      isRead: newMessage.isRead,
      timestamp: newMessage.createdAt.toISOString(),
      createdAt: newMessage.createdAt.toISOString(),
    };

    // Emit to receiver if online
    const receiverSocketId = onlineUsers.get(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", normalizedMessage);

      // mark as delivered if sent instantly
      await messageModel.findByIdAndUpdate(newMessage._id, { isRead: true });
    }

    // Also emit back to sender for UI update
    const senderSocketId = onlineUsers.get(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSent", normalizedMessage);
    }

    return res.status(201).json({ success: true, message: normalizedMessage });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getChatConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id); 

    const conversations = await messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            participants: {
              $cond: [
                { $gt: ["$senderId", "$receiverId"] },
                ["$receiverId", "$senderId"],
                ["$senderId", "$receiverId"],
              ],
            },
          },
          lastMessage: { $first: "$$ROOT" },
          updatedAt: { $first: "$createdAt" },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const { senderId, receiverId } = conv.lastMessage;

        const partnerId =
          senderId.toString() === userId.toString()
            ? receiverId
            : senderId;

        const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

        // Count unread messages
        const unreadCount = await messageModel.countDocuments({
          senderId: partnerObjectId,
          receiverId: userId,
          isRead: false,
        });

        // Fetch partner user info
        const partner = await userModel.findById(partnerObjectId).select(
          "name avatar role isOnline"
        );
        
       return {
          id: conv._id.participants.join("-"),
          participants: [senderId, receiverId],
          partner: {
            id: partner._id,
            name: partner.name,
            avatarUrl: partner.avatar,
            role: partner.role,
            isOnline: partner.isOnline
          },
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
          unreadCount,
        };
      })
    );
     
    res.status(200).json({ success: true, conversations: enriched });
  } catch (error) {
    console.error("getChatConversations error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching conversations",
    });
  }
};


// export const getMessagesBetweenUsers = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { partnerId } = req.params;

//     if (!partnerId) {
//       return res.status(400).json({ success: false, message: "partnerId is required" });
//     }

//     const messages = await messageModel.find({
//       $or: [
//         { senderId: userId, receiverId: partnerId },
//         { senderId: partnerId, receiverId: userId }
//       ]
//     }).sort({ createdAt: 1 });

//     // Mark messages as read
//     await messageModel.updateMany(
//       { senderId: partnerId, receiverId: userId, isRead: false },
//       { $set: { isRead: true } }
//     );

//     const normalizedMessages = messages.map(m => ({
//       id: m._id.toString(),
//       senderId: m.senderId,
//       receiverId: m.receiverId,
//       content: m.content,
//       isRead: m.isRead,
//       timestamp: m.createdAt,   
//     }));

//     res.status(200).json({ success: true, messages: normalizedMessages });
//   } catch (err) {
//     console.error("getMessagesBetweenUsers error:", err);
//     res.status(500).json({ success: false, message: "Server error while fetching messages" });
//   }
// };

export const getMessagesBetweenUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { partnerId } = req.params;

    if (!partnerId) {
      return res
        .status(400)
        .json({ success: false, message: "partnerId is required" });
    }

    // Fetch messages
    const messages = await messageModel
      .find({
        $or: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      })
      .sort({ createdAt: 1 });

    // Mark partner's unread messages as read
    await messageModel.updateMany(
      { senderId: partnerId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // Fetch partner details
    const partner = await userModel.findById(partnerId).select(
      "_id name isOnline avatar"
    );

    if (!partner) {
      return res
        .status(404)
        .json({ success: false, message: "Partner not found" });
    }

    const normalizedMessages = messages.map((m) => ({
      id: m._id.toString(),
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      isRead: m.isRead,
      timestamp: m.createdAt,
      createdAt: m.createdAt
    }));

    const normalizedPartner = {
      id: partner._id.toString(),
      name: partner.name,
      isOnline: partner.isOnline,
      avatarUrl: partner.avatar, 
    };

    res.status(200).json({
      success: true,
      messages: normalizedMessages,
      partner: normalizedPartner,
    });
  } catch (err) {
    console.error("getMessagesBetweenUsers error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    });
  }
};


