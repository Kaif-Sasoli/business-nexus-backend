// models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  }
}, {
  timestamps: true 
});


messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
// Index for quick unread count lookups
messageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
