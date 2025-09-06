import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    investorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entrepreneurId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    startupName: { 
      type: String, 
      required: true 
    },
    industry: { 
      type: String 
    },

    // Investment details
    amount: { type: Number, required: true }, 
    equity: { type: Number, required: true }, 
    stage: {
      type: String,
      enum: ["Seed", "Series A", "Series B", "Series C", "IPO"],
      required: true,
    },

    // Deal status
    status: {
      type: String,
      enum: [
        "Due Diligence",
        "Term Sheet",
        "Negotiation",
        "Closed",
        "Passed",
      ],
      default: "Due Diligence",
    },

    // Link with a transaction 
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Deal", dealSchema);
