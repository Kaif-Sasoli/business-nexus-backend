import { Router } from 'express'
import * as invstorController from '../controllers/investor.controller.js'
import { auth } from '../middlewares/authMiddleware.js'
import { body } from "express-validator";
import sanitizeHtml from "sanitize-html";

const router = Router();

// custom sanitizer wrapper for HTML
const cleanString = (value) => sanitizeHtml(value?.trim() || "");

router.get('/me/:id', invstorController.getUserWithInvestorProfile);

 
// Update investor-specific details
router.patch(
  "/update-specific-detials/:id",
  auth(["investor"]),
  [
    body("industries").optional().isArray().withMessage("industries must be an array"),
    body("industries.*").isString().trim().customSanitizer(cleanString),

    body("investmentStages").optional().isArray().withMessage("investmentStages must be an array"),
    body("investmentStages.*").isString().trim().customSanitizer(cleanString),

    body("investmentCriteria").optional().isArray().withMessage("investmentCriteria must be an array"),
    body("investmentCriteria.*").isString().trim().customSanitizer(cleanString),

    body("totalInvestments").optional().isNumeric().withMessage("totalInvestments must be a number").toInt(),

    body("investmentRange.min").optional().isNumeric().toInt(),
    body("investmentRange.max").optional().isNumeric().toInt(),
  ],
  invstorController.updateInvestorSpecificDetails
);


router.get("/search", invstorController.searchInvestor);

// Get Recommend Investors
router.get("/recommended-investors",  invstorController.getRecommendedInvestors);
// auth(["investor", "admin"]),

router.get('/get-dashboard', auth(['investor']), 
      invstorController.getInvestorDashboard)

export default router   