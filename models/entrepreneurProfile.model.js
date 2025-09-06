import mongoose from "mongoose";

// Startup Schema
const startupSchema = new mongoose.Schema({
    entrepreneurId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Entrepreneur",
        unique: true
    },
    startupName: {
        type: String, 
        required: true
    },
    location: {
        type: String,
        default: ''
    },
    foundedAt: {
        type: Date,
        default: Date.now
    },
     // Funds
    totalFunds: {
        type: Number,
        default: 0
    },
    fundingNeeded: {
        type: Number,
        default: 0
    },
    industry: {
        type: String,
        default: ''
      },
    storageUsed: { 
      type: Number, 
      default: 0 
    }, 
    storageLimit: { 
      type: Number, 
      default: 1024 * 1024 * 1024 
    }, 
    // Startup Overview (unique to each startup)
   overview: {
        problemStatement: { type: String, default: "" },
        solution: { type: String, default: "" },
        marketOpportunity: { type: String, default: "" },
        competitiveAdvantage: { type: String, default: "" }
  },
   // Team Members
  team: {
    type: [{
        name: { type: String, default: "" },
        role: { type: String, default: "" },
        avatar: { type: String, default: "" },
        linkedin: { type: String, default: "" }
      }
    ], default: [] 
 }

}, { timestamps: true });


const entrepreneurProfileSchema = new mongoose.Schema({
  
  // Reference to the user who owns this profile
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    unique: true 
   },
   startups: { 
    type: startupSchema, 
  }
  
});


export default mongoose.model("Entrepreneur", entrepreneurProfileSchema);