import mongoose from "mongoose";

const InvestorProfileSchema = new mongoose.Schema({

  // Reference to the user who owns this profile
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    unique: true 
  },

   // Investment interests
    industries: {
      type: [String],
      default: []
    }, 
  // Stages of investment
    investmentStages: {
      type: [String],
      default: []
    },
  // Specific criteria of the investor 
    investmentCriteria: {
      type: [String],  
      default: [] 
    },
  
  // Number of investments
  totalInvestments: { 
    type: Number, 
    default: 0 
  },
  // Number of investments made
  investmentRange: {
    min: { 
        type: Number, 
    }, 
    max: { 
        type: Number, 
    }   
  },
 
});


export default mongoose.model("InvestorProfile", InvestorProfileSchema);
