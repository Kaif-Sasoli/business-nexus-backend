import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["transfer", "deposit", "withdrawal"], 
      required: true,
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    },   
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
    }, 
    amount: { 
        type: Number, 
        required: true 
    }, 
    currency: { 
        type: String, 
        default: "usd" 
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    metadata: { type: Object },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    
    provider: { 
        type: String, 
        enum: ["stripe", "paypal"], 
        required: true },
    stripeAccountId: { 
        type: String,
         default: null 
    },
    paypalEmail: { 
        type: String, 
        default: null 
    },
    paypalMerchantId: { 
        type: String, 
        default: null },

    // Wallet balance 
    balance: { 
        type: Number,
        default: 0 
    }, 

    // All transactions
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("UserPayment", userPaymentSchema);
