import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending"
  }
});

const meetingSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    participants: [participantSchema],

    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "cancelled"],
      default: "scheduled"
    },

    roomUrl: {
      type: String, 
      default: null
    },
    roomId: {
      type: String, 
      default: null
    },
    
  },
  { timestamps: true }
);

// Index for conflict detection
meetingSchema.index({ "participants.user": 1, startTime: 1, endTime: 1 });

export default mongoose.model("Meeting", meetingSchema);
