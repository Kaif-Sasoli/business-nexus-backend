import mongoose from "mongoose";

const tempUserSchema = new mongoose.Schema({
        name : {
          type: String,
          required: true,
          minlength: 4,
          trim: true
        },
        email: {
            type: String,
            required: true,
            match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                     'Please fill a valid email address']
        },
        password : {
             type: String,
             required: true
        },
         role: {
            type: String,
            enum: ["investor", "entrepreneur"], 
            required: true 
        },
        verificationCode : {
            type: Number
        },
        verificationExpiry: {
            type: Date, 
            default: () => Date.now() + 5 * 60 * 1000
        },
}, { timestamps: true });


export default mongoose.model("TempUser", tempUserSchema);