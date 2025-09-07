import meetingModel from "../models/meeting.model.js";
import { validationResult } from "express-validator";
import Collaboration from "../models/collaboration.model.js";
import mongoose from "mongoose";
import { nanoid } from "nanoid";



export const createMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { participants, title, description, startTime, endTime, roomUrl } = req.body;
    const organizer = req.user.id;

    if (!participants || participants.length === 0) {
      return res.status(400).json({
        error: "No participants selected",
        message: "Please select at least one investor to schedule a meeting."
      });
    }

    const participantObjectIds = participants.map(id => new mongoose.Types.ObjectId(id));
    const organizerObjectId = new mongoose.Types.ObjectId(organizer);

    // Validate collaborations
    const collaborations = await Collaboration.find({
      status: "accepted",
      $or: [
        { entrepreneurId: organizerObjectId, investorId: { $in: participantObjectIds } },
        { investorId: organizerObjectId, entrepreneurId: { $in: participantObjectIds } }
      ]
    });

    if (!collaborations || collaborations.length === 0) {
      return res.status(403).json({
        message: "You can only create meetings with your accepted collaborators."
      });
    }

    // Prepare participants
    const participantArray = participantObjectIds.map(userId => ({ user: userId, status: "pending" }));
    participantArray.push({ user: organizerObjectId, status: "accepted" });

    // Conflict detection
    const conflict = await meetingModel.findOne({
      "participants.user": { $in: participantObjectIds.concat(organizerObjectId) },
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    });

    if (conflict) {
      return res.status(400).json({
        error: "Time conflict",
        message: "Conflict detected: one or more participants already have a meeting in this time range."
      });
    }

    //  Auto-generate roomId
    const generatedRoomId = nanoid();

    // Create meeting
    const meeting = await meetingModel.create({
      organizer: organizerObjectId,
      participants: participantArray,
      title,
      description,
      startTime,
      endTime,
      status: "scheduled",
      roomUrl: roomUrl || null,
      roomId: generatedRoomId
    });

    return res.status(201).json({
      message: "Meeting created successfully",
      meeting
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({
      message: "Something went wrong while creating the meeting.",
      error: error.message
    });
  }
};

// Accept meeting
export const acceptMeeting = async (req, res) => {
  try {
    const userId = req.user.id; // From token
    const meetingId = req.params.id;

    const meeting = await meetingModel.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is a participant
    const participant = meeting.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(403).json({ message: "You are not a participant in this meeting" });
    }

    // Update status
    participant.status = "accepted";

    await meeting.save();

    return res.status(200).json({
      message: "Meeting accepted successfully",
      meeting
    });
  } catch (error) {
    console.error("Error accepting meeting:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Reject meeting
export const rejectMeeting = async (req, res) => {
  try {
  
    const userId = req.user.id; // From token
    const meetingId = req.params.id;

    const meeting = await meetingModel.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Find participant
    const participant = meeting.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(403).json({ message: "You are not a participant in this meeting" });
    }

    // Update participant status
    participant.status = "rejected";
    await meeting.save();

    return res.status(200).json({
      message: "Meeting rejected successfully",
      meeting
    });
  } catch (error) {
    console.error("Error rejecting meeting:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// List meetings for user
export const listMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const meetings = await meetingModel.find({
      $or: [{ host: userId }, { participant: userId }]
    }).populate("host participant", "name email");

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getUserMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await meetingModel.find({
      $or: [
        { organizer: userId },
        { "participants.user": new mongoose.Types.ObjectId(userId) }
      ]
    })
      .populate("organizer", "name avatar email")
      .populate("participants.user", "name avatar email")
      .sort({ startTime: 1 }); 

    const formattedMeetings = meetings.map(meeting => ({
      id: meeting._id,
      title: meeting.title,
      description: meeting.description,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      status: meeting.status,
      roomId: meeting.roomId || null,
      roomUrl: meeting.roomUrl || null,
      organizer: {
        id: meeting.organizer._id,
        name: meeting.organizer.name,
        avatar: meeting.organizer.avatar,
        email: meeting.organizer.email
      },
      participants: meeting.participants.map(p => ({
        id: p.user._id,
        name: p.user.name,
        avatar: p.user.avatar,
        email: p.user.email,
        status: p.status
      }))
    }));

    return res.status(200).json({
      message: "Meetings fetched successfully",
      meetings: formattedMeetings
    });

  } catch (error) {
    console.error("Error fetching user meetings:", error);
    return res.status(500).json({
      message: "Something went wrong while fetching meetings.",
      error: error.message
    });
  }
};

// Cancel meeting (Only organizer can cancel)
export const cancelMeeting = async (req, res) => {
  try {

    const userId = req.user.id; 
    const meetingId = req.params.id;

    const meeting = await meetingModel.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user is the organizer
    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ message: "Only the organizer can cancel this meeting" });
    }

    // Update status to cancelled
    meeting.status = "cancelled";
    await meeting.save();

    return res.status(200).json({
      message: "Meeting cancelled successfully",
      meeting
    });
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};



  // Start a meeting 
  export const startMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user.id;

    const meeting = await meetingModel.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ message: "Only organizer can start the meeting" });
    }

    // Mark meeting as live & generate room
    meeting.status = "live";
    if (!meeting.roomId) {
      meeting.roomId = `room_${meetingId}`;
      meeting.roomUrl = `${process.env.CLIENT_URL}/meeting/${meeting.roomId}`;
    }

    await meeting.save();

  
    const io = req.app.get("io");
    io.to(meetingId.toString()).emit("meeting:started", {
      meetingId: meeting.id,
      roomId: meeting.roomId,
      roomUrl: meeting.roomUrl,
    });

    return res.status(200).json({
      message: "Meeting started",
      meeting,
    });
  } catch (error) {
    console.error("Error starting meeting:", error);
    return res
      .status(500)
      .json({ message: "Failed to start meeting", error: error.message });
  }
};

// End a meeting 
export const endMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user.id;

    const meeting = await meetingModel.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.organizer.toString() !== userId) {
      return res.status(403).json({ message: "Only organizer can end the meeting" });
    }

    meeting.status = "completed";
    await meeting.save();

    return res.status(200).json({
      message: "Meeting ended",
      meeting,
    });
  } catch (error) {
    console.error("Error ending meeting:", error);
    return res.status(500).json({ message: "Failed to end meeting", error: error.message });
  }
};

// Get meeting details 
export const getMeetingById = async (req, res) => {
  try {
    const meeting = await meetingModel
      .findById(req.params.id)
      .populate("organizer", "name avatar")
      .populate("participants.user", "name avatar");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    return res.status(200).json(meeting);
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return res.status(500).json({ message: "Failed to fetch meeting", error: error.message });
  }
};


