import express from 'express'
import { body, validationResult } from 'express-validator'
import { auth } from '../middlewares/authMiddleware.js'
import * as entrepreneurController from '../controllers/entrepreneur.controller.js'

const router = express.Router();

router.post('/createStartup', auth(['entrepreneur']), 
   entrepreneurController.createStartup
)

router.get('/startup/:id',  
entrepreneurController.getStartupByUserId);

// Entrepreneur dashboard route
router.get("/", auth(["entrepreneur"]), 
   entrepreneurController.getEntrepreneurDashboard
);


router.get("/all", entrepreneurController.getAllEntrepreneursWithStartups);



router.get("/search", entrepreneurController.searchEntrepreneurs);

export default router