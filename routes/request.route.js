import express from 'express'
import { auth } from '../middlewares/authMiddleware.js'
import * as collaborationController from '../controllers/collaboration.controller.js'

const router = express.Router();

// Send request
router.post("/send", collaborationController.sendRequest); 

// check is request is already sent
router.get("/check", collaborationController.checkRequestExists);

// Get Entrepreneur 
router.get("/entrepreneur/:entrepreneurId", auth(['entrepreneur']),
        collaborationController.getEntrepreneurRequests);

router.put('/:requestId/respond', auth(['entrepreneur']), 
collaborationController.respondRequest);

router.get("/entrepreneur/collaborators", auth(['entrepreneur']), 
collaborationController.getEntrepreneurAcceptedCollaborators);


export default router;