import tempUserModel from '../models/tempUser.model.js'
import { sendMail } from './email.controller.js';
import { generateOTP } from "../utils/generateOTP.js"
import userModel from '../models/user.model.js';
import { validationResult } from "express-validator";
import { generateAccessAndRefereshTokens } from '../utils/generateAccessAndRefereshTokens.js'


// Register User
export const register = async (req, res) => {
    try {

        // Check validation errors first
       const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            error: errors.array()[0].msg  
          });
        }

        // Destructure body
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const isUser = await userModel.findOne({ email });
        if(isUser) return res.status(409).json({ error: "User already exists!" });

         // Generate OTP
        const otp = generateOTP()

        // Create a temp user
        const user = await tempUserModel.create({
             name,
             email,
             password,
             role,
             verificationCode: otp,
             isEmailVerified: true,
             isOnline: true
        });
        

        // await sendMail(email, otp);
        res.status(201).json({ message: "An OTP has been sent to your email address. Please verify to continue.",
           id: user._id, 
           email: user.email 
          });

    } catch (error) {
       return res.status(500).json({ error: error.message || 'Something went wrong.' });
    }
}



export const signIn = async (req, res) => {
   try {

    // Check validation errors first
     const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: errors.array()[0].msg  
        });
      }

    const { email, password } = req.body;

      // Find user exists
      let user = await userModel.findOne({ email })
      if (!user) return res.status(404).json({ error: "Invalid email or password."})
    
      // Check password
       const isMatch = await user.comparePassword(password);
       if (!isMatch) {
         return res.status(403).json({ error: "Invalid email or password."})
       }
     
      // Generate tokens
      const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user);

      user.isOnline = true;
      user.refreshToken = refreshToken; 
      await user.save();

       const safeUser = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            bio: user.bio,
            avatar: user.avatar,
            location: user.location,
            isOnline: user.isOnline
          };

      // Send response with cookie
      return res.status(200)
              .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
              })
              .json({ message: "Login successful", user: safeUser, accessToken });
   } catch (error) {
         return res.status(500).json({ error: error.message || 'Something went wrong.' })
   }
}


export const logout = async (req, res) => {
  try {
    // Clear refreshToken 
   const user =  await userModel.findByIdAndUpdate( req.user._id,
      { $set: { isOnline: false, refreshToken: null } },
      { new: true } 
    );

    // Clear cookies
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
};
