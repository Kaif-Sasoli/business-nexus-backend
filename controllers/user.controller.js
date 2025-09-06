import userModel from '../models/user.model.js'
import { validationResult } from "express-validator";

export const updateUserProfile = async (req, res) => {
  try {

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
      });
    }

    const { name, location, bio } = req.body;
    const userId = req.user.id; 

    // Prepare update data
    const updateData = {
      name,
      location,
      bio,
    };

    // If avatar uploaded, add its URL
    if (req.file?.path) {
      updateData.avatar = req.file.path; 
    }

    // Update user in DB
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true } 
    ).select("-password -refreshToken -isEmailVerified -createdAt -lastActiveAt -updatedAt -__v"); 

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userResponse = updatedUser.toObject();
    userResponse.id = userResponse._id;
    delete userResponse._id;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await userModel.findById(id).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Normalize user object before sending
    const normalizedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      location: user.location,
      avatarUrl: user.avatar || "",  
      isOnline: user.isOnline,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
    };

    res.status(200).json({ success: true, user: normalizedUser });
  } catch (err) {
    console.error("getUserById error:", err);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};