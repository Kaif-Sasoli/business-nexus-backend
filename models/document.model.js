import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String,
        required: true
    },
    size: { 
        type: Number 
    }, 
    path: { 
        type: String, 
        required: true 
    },
    uploadedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    version: { 
        type: Number, 
        default: 1 
    },
    status: { 
        type: String, 
        enum: ["active", "archived"], 
        default: "active" 
    },
    shared: { 
        type: Boolean, 
        default: false 
    },
    signature: { 
        type: String 
    },
    downloadCount: { 
        type: Number, 
        default: 0 
    },
  },
  { timestamps: true }
);

// Virtual property for human-readable size
documentSchema.virtual("sizeMB").get(function () {
  return (this.size / (1024 * 1024)).toFixed(2) + " MB";
});

export default mongoose.model("Document", documentSchema);
