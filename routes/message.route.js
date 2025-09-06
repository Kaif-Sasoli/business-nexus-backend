// routes/messages.routes.js
import express from "express";
import * as messageController from "../controllers/message.controller.js";
import { auth } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

// Send message
router.post("/send", auth(['investor', 'entrepreneur']), messageController.sendMessage);

// Get all conversations
router.get("/conversations", auth(['investor', 'entrepreneur']),
 messageController.getChatConversations);

// Get messages between logged-in user & a partner
router.get("/:partnerId", auth(["investor", "entrepreneur"]),
  messageController.getMessagesBetweenUsers
);


export default router;
