import collaborationModel from "../models/collaboration.model.js";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";

// sends request 
// sends request 
export const sendRequest = async (req, res) => {
  try {
    const { investorId, entrepreneurId, startupId, message } = req.body;

    const [investor, entrepreneur, existingRequest] = await Promise.all([
      userModel.findOne({ _id: investorId, role: "investor" }).lean(),
      userModel.findOne({ _id: entrepreneurId, role: "entrepreneur" }).lean(),
      collaborationModel.findOne({
        investorId,
        entrepreneurId,
        startupId,
        status: { $in: ["pending", "accepted"] },
      }).lean(),
    ]);

    if (!investor) {
      return res.status(404).json({ success: false, message: "Investor not found" });
    }
    if (!entrepreneur) {
      return res.status(404).json({ success: false, message: "Entrepreneur not found" });
    }
    if (existingRequest) {
      let msg =
        existingRequest.status === "pending"
          ? "Request already pending"
          : "Request already Sent";
      return res.status(400).json({ success: false, message: msg });
    }

    // Create new request
    await collaborationModel.create({
      investorId,
      entrepreneurId,
      startupId,
      message,
      status: "pending",
    });

    return res.status(201).json({ success: true, message: "Request sent successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong", error: error.message });
  }
};

// Check if investor already sent request
export const checkRequestExists = async (req, res) => {
  try {
    const { investorId, entrepreneurId, startupId } = req.query;

    if (!investorId || !entrepreneurId || !startupId) {
      return res.status(400).json({
        success: false,
        message: "investorId, entrepreneurId and startupId are required",
      });
    }

    // find any request regardless of status
    const existingRequest = await collaborationModel.findOne({
      investorId,
      entrepreneurId,
      startupId,
    })
      .sort({ createdAt: -1 }) // get the latest request
      .lean();

    if (existingRequest) {
      return res.status(200).json({
        success: true,
        exists: true,
        status: existingRequest.status, 
        data: existingRequest,
        message: `Request already exists with status: ${existingRequest.status}`,
      });
    }

    return res.status(200).json({
      success: true,
      exists: false,
      status: null,
      message: "No request found",
    });
  } catch (error) {
    console.error("checkRequestExists error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


export const getEntrepreneurRequests = async (req, res) => {
  try {
    const entrepreneurId = req.user?.id; 
    if (!entrepreneurId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Entrepreneur ID missing",
      });
    }

    // Fetch only requests that belong to this entrepreneur
    const requests = await collaborationModel
      .find({ entrepreneurId: entrepreneurId }) 
      .populate("investorId", "name email role avatar bio isOnline") 
      .sort({ createdAt: -1 }) 
      .lean();

    // Separate counts
    const pendingCount = requests.filter(r => r.status === "pending").length;
    const acceptedCount = requests.filter(r => r.status === "accepted").length;
    const rejectedCount = requests.filter(r => r.status === "rejected").length;

    // Format for frontend
    const formattedRequests = requests.map((r) => ({
      id: r._id.toString(),
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      investor: {
        id: r.investorId?._id?.toString(),
        name: r.investorId?.name,
        email: r.investorId?.email,
        role: r.investorId?.role,
        avatarUrl: r.investorId?.avatar || "",
        bio: r.investorId?.bio || "",
        isOnline: r.investorId?.isOnline || false,
      },
      entrepreneurId: r.entrepreneurId?.toString(),
    }));

    return res.status(200).json({
      success: true,
      totalRequests: formattedRequests.length,
      pendingCount,
      acceptedCount,
      rejectedCount,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("getEntrepreneurRequests error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};


// Entrepreneur response
export const respondRequest = async (req, res) => {
  try {
    const entrepreneurId = req.user?.id; 
    const { requestId } = req.params;
    const { action } = req.body; 

    if (!entrepreneurId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const request = await collaborationModel.findOne({
      _id: requestId,
      entrepreneurId: entrepreneurId
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Update status
    request.status = action;
    request.respondedAt = new Date();
    await request.save();

    return res.status(200).json({
      success: true,
      message: `Request ${action} successfully`,
      data: request
    });

  } catch (error) {
    console.error('respondRequwest error:', error);
    return res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
  }
};

export const getEntrepreneurAcceptedCollaborators = async (req, res) => {
  try {
    const entrepreneurId = req.user?.id;

    if (!entrepreneurId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Entrepreneur ID missing",
      });
    }

    // Find accepted collaborations for this entrepreneur
    const collaborations = await collaborationModel
      .find({
        entrepreneurId,
        status: "accepted",
      })
      .populate("investorId", "name avatar") 
      .lean();

    const collaborators = collaborations.map((c) => ({
      id: c.investorId?._id?.toString(),
      name: c.investorId?.name || "Unnamed",
      avatar: c.investorId?.avatar || "",
    }));

    return res.status(200).json({
      success: true,
      total: collaborators.length,
      data: collaborators,
    });
  } catch (error) {
    console.error("getEntrepreneurAcceptedCollaborators error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};