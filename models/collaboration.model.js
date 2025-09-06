import mongoose from "mongoose";

const collaborationSchema = new mongoose.Schema({
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Investor id
    required: true,
  },
  entrepreneurId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Entrepreneur id
    required: true,
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Entrepreneur", 
    required: true,
  },
  message: {
    type: String,
    default: "", // message
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "withdrawn"],
    default: "pending",
  },
  respondedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model("Collaboration", collaborationSchema);
