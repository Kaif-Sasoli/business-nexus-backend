import express from 'express'
import * as meetingController from '../controllers/meeting.controller.js'
import { auth } from '../middlewares/authMiddleware.js'
import { body, validationResult } from 'express-validator'

const router = express.Router();

router.post("/create", 
        auth(['entrepreneur']),
            [
          body("participants")
            .isArray({ min: 1 }).withMessage("At least one participant is required.")
            .custom((arr) => arr.every(id => typeof id === "string"))
            .withMessage("Participants must be an array of user IDs."),
            
          body("title")
            .trim()
            .escape()
            .notEmpty().withMessage("Title is required.")
            .isLength({ min: 3, max: 100 }).withMessage("Title must be 3-100 characters long."),
            
          body("description")
            .optional()
            .trim()
            .escape()
            .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters."),
            
          body("startTime")
            .notEmpty().withMessage("Start time is required.")
            .isISO8601().withMessage("Invalid start time format."),
            
          body("endTime")
            .notEmpty().withMessage("End time is required.")
            .isISO8601().withMessage("Invalid end time format.")
            .custom((value, { req }) => {
              if (new Date(value) <= new Date(req.body.startTime)) {
                throw new Error("End time must be after start time.");
              }
              return true;
            })
        ],
     meetingController.createMeeting);

    // Call this api from frontend
router.get('/get-meetings', auth(['investor', 'entrepreneur']), 
        meetingController.getUserMeetings);

// Investor accepts a meeting
router.put("/accept/:id", auth(['investor']), meetingController.acceptMeeting);

router.put("/reject/:id", auth(['investor']), meetingController.rejectMeeting);

router.put("/cancel/:id", auth(['entrepreneur']), meetingController.cancelMeeting);

// new routes for live meeting
router.put("/start/:id", auth(["entrepreneur"]), meetingController.startMeeting);
router.put("/end/:id", auth(["entrepreneur"]), meetingController.endMeeting);
router.get("/:id", auth(["investor", "entrepreneur"]), meetingController.getMeetingById);

export default router;