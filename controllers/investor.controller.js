import userModel from "../models/user.model.js";
import investorProfileModel from "../models/investorProfile.model.js";
import collaborationModel from '../models/collaboration.model.js'
import dealModel from '../models/deal.model.js'
import { validationResult } from "express-validator";


export const updateInvestorSpecificDetails = async (req, res) => {
  try {
    //  validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    console.log("ID invetor:", id)
    const { industries, investmentStages, investmentCriteria, totalInvestments, investmentRange } =
      req.body;

    const user = await userModel.findById(id);
    if (!user || user.role !== "investor") {
      return res.status(404).json({ success: false, message: "Investor not found" });
    }

    // Save/update profile
    const investorProfile = await investorProfileModel.findOneAndUpdate(
      { userId: user._id },
      {
        industries: industries || [],
        investmentStages: investmentStages || [],
        investmentCriteria: investmentCriteria || [],
        totalInvestments: totalInvestments ?? 0,
        investmentRange: investmentRange || { min: null, max: null },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Investor details updated successfully",
      investor: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio || "",
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastActiveAt: user.lastActiveAt,
        location: user.location || "",
        industries: investorProfile.industries,
        investmentStages: investorProfile.investmentStages,
        investmentCriteria: investorProfile.investmentCriteria,
        totalInvestments: investorProfile.totalInvestments,
        investmentRange: investorProfile.investmentRange,
        portfolioCompanies: investorProfile.portfolioCompanies || [],
      },
    });
  } catch (error) {
    console.error("Error updating investor details: ", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};


export const getUserWithInvestorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user
    const user = await userModel.findById(id)
      .select("-password -refreshToken -__v -updatedAt -createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch investor profile
    const investorProfile = await investorProfileModel.findOne({ userId: user._id }).lean();

    // Convert user to plain object and normalize id
    const userObj = user.toObject();
    userObj.id = userObj._id;
    delete userObj._id;

    // Merge user and investor profile
    const mergedProfile = {
      ...userObj,
      ...(investorProfile ? {
        industries: investorProfile.industries,
        investmentStages: investorProfile.investmentStages,
        investmentCriteria: investorProfile.investmentCriteria,
        totalInvestments: investorProfile.totalInvestments,
        investmentRange: investorProfile.investmentRange || { min: null, max: null }
      } : {})
    };

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      investor: mergedProfile
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Something went wrong" });
  }
};


export const searchInvestor = async (req, res) => {
  try {
    const { searchQuery, industries, stages, minInvestment, maxInvestment, location } = req.query;
    let filters = {};

    //  Search users by name OR location
    if (searchQuery) {
      const users = await userModel.find({
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { location: { $regex: searchQuery, $options: "i" } }
        ]
      }).select("_id");

      const userIds = users.map(u => u._id);
      if (userIds.length === 0) {
        return res.json({ success: true, count: 0, data: [] });
      }

      filters.userId = { $in: userIds };
    }

    // Extra filters
    if (industries) filters.industries = { $in: industries.split(",") };
    if (stages) filters.investmentStages = { $in: stages.split(",") };
    if (location) filters.location = { $regex: location, $options: "i" };

    if (minInvestment || maxInvestment) {
      filters["investmentRange.min"] = { $gte: Number(minInvestment) || 0 };
      if (maxInvestment) filters["investmentRange.max"] = { $lte: Number(maxInvestment) };
    }

    // Final query
    const investors = await investorProfileModel
      .find(filters)
      .populate("userId", "name bio avatar isOnline role location");

    // Format for InvestorCard
    const formatted = investors
      .filter(inv => inv.userId && inv.userId.role === "investor")
      .map(inv => ({
        id: inv.userId._id.toString(),
        name: inv.userId.name,
        isOnline: inv.userId.isOnline,
        avatarUrl: inv.userId.avatar,
        bio: inv.userId.bio,
        totalInvestments: inv.totalInvestments ?? 0,
        investmentStage: inv.investmentStages || [],
        investmentInterests: inv.industries || [],
        minimumInvestment: inv.investmentRange?.min ?? 0,
        maximumInvestment: inv.investmentRange?.max ?? 0
      }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error("Investor search error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};


export const getRecommendedInvestors = async (req, res) => {
  try {
    // Get query params 
    const { industries, stages, limit = 10 } = req.query;

    // Build filters
    let filters = {};
    if (industries) {
      filters.industries = { $in: industries.split(",") };
    }
    if (stages) {
      filters.investmentStages = { $in: stages.split(",") };
    }

    // Find investor profiles with filters
    const investors = await investorProfileModel
      .find(filters)
      .populate("userId", "name bio avatar isOnline role") 
      .limit(Number(limit));

    // Format the response
    const formatted = investors
      .filter(inv => inv.userId && inv.userId.role === "investor")
      .map(inv => ({
        id: inv.userId._id.toString(),
        name: inv.userId.name,
        isOnline: inv.userId.isOnline,
        bio: inv.userId.bio,
        avatarUrl: inv.userId.avatar, 
        totalInvestments: inv.totalInvestments ?? 0, 
        investmentStage: inv.investmentStages || [], 
        investmentInterests: inv.industries || [], 
        minimumInvestment: inv.investmentRange?.min ?? 0,
        maximumInvestment: inv.investmentRange?.max ?? 0
      }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    console.error("Error fetching recommended investors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommended investors",
      error: error.message
    });
  }
};


export const getInvestorDashboard = async (req, res) => {
  try {
    const investorId = req.user.id; 

    const [collaborations, deals] = await Promise.all([
      collaborationModel.find({ investorId })
        .populate("entrepreneurId", "name email avatar")
        .populate("startupId", "name description industry"),
      
      dealModel.find({ investorId })
        .populate("entrepreneurId", "name email avatar")
        .sort({ createdAt: -1 })
    ]);

    // Aggregate stats
    const totalInvestments = deals.reduce((sum, deal) => sum + deal.amount, 0);
    const totalStartups = new Set(deals.map(d => d.startupName)).size;

    console.log("Deals:",deals)
    // Response
    res.json({
      success: true,
      data: {
        collaborationsCount: collaborations.length,
        dealsCount: deals.length,
        totalInvestments,
        totalStartups,
        collaborations,
        deals,
      },
    });
  } catch (err) {
    console.error("Investor Dashboard Error:", err);
    res.status(500).json({ error: "Something went wrong: " + err.message });
  }
};
