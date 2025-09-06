import transporter from '../config/emailConfig.js'
import { emailVerificationTemplate } from '../public/views/emailTemplete.js'
import userModel from '../models/user.model.js'
import tempUserModel from '../models/tempUser.model.js'
import entrepreneurProfileModel from '../models/entrepreneurProfile.model.js'
import investorProfileModel from '../models/investorProfile.model.js'
import { generateAccessAndRefereshTokens } from '../utils/generateAccessAndRefereshTokens.js'
import { generateOTP } from '../utils/generateOTP.js'
import { validationResult } from "express-validator";


export const sendMail = async (email, otp) => {
    try{
    const info =  await transporter.sendMail({
    from: '"BusinessNexus" <kaifbrahui9@gmail.com>', 
    to: email, 
    subject: "Verify your Email", 
    text:  `Your OTP is: ${otp}`, 
    html: emailVerificationTemplate(otp), 
    })
      return "Email sent successfully"

  } catch(error) {
     throw new Error("Couldn't send mail: " + error.message)
  }
}

// Verify email
export const verifyEmail = async (req, res) => {
         try {

           const { id, email, verificationCode } = req.body
            // Find temp user
            const tempUser = await tempUserModel.findOne({ _id: id, email });
            if (!tempUser) return res.status(404).json({ error: "User not found." });

            // Check OTP
            if (tempUser.verificationCode !== Number(verificationCode)) {
                return res.status(401).json({ error: "Invalid OTP." });
            }

            if (tempUser.verificationExpiry < Date.now()) {
                return res.status(410).json({ error: "OTP has expired." }); 
            }            

            const verfiedUser = await userModel.findOne({ email });
            if (verfiedUser) return res.status(409).json({ error: "User already exists" });

        // Move user to main collection
          const createdUser = await userModel.create({
                name: tempUser.name,
                email: tempUser.email,
                password: tempUser.password,
                role: tempUser.role,
                isEmailVerified: true,
                isOnline: true
            });

            // Create role-specific profile
            if (createdUser.role === "entrepreneur") {
              await entrepreneurProfileModel.create({ userId: createdUser._id });
            } else if (createdUser.role === "investor") {
              await investorProfileModel.create({ userId: createdUser._id });
            }

            const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(createdUser);

            const safeUser = {
                id: createdUser._id,
                name: createdUser.name,
                email: createdUser.email,
                role: createdUser.role,
                bio: createdUser.bio,
                avatar: createdUser.avatar,
                location: createdUser.location,
                isOnline: true
            };
          return res
            .cookie('refreshToken', refreshToken, {
              httpOnly: true,
              secure: false,
              sameSite: 'lax'
            })
            .status(200)
            .json({ message: "Email verified successfully", user: safeUser, accessToken });
    
         } catch (error) {
          res.status(500).json({ error: "Something went wrong."});
         }
}


export const resendEmail = async (req, res) => {
    try {
      // Check validation errors first
      const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({
           error: errors.array()[0].msg  
         });
       }
       
      const { id, email } = req.body;

      // Find temp user
      const tempUser = await tempUserModel.findOne({ _id: id, email });
      if (!tempUser) return res.status(404).json({ error: "User not found." });

      const otp = generateOTP();

      // Update verification code & expiry
      tempUser.verificationCode = otp;
      tempUser.verificationExpiry = Date.now() + 5 * 60 * 1000;
      await tempUser.save();

      // resend mail to user
      await sendMail(email, otp);

      // send response to user
      res.status(200).json({
      message: "Verification code resent successfully.",
      otp, 
    });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
}
    
