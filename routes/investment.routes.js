import express from "express";
import * as investmentController from "../controllers/investment.controller.js";
import { auth } from "../middlewares/authMiddleware.js";
import { body } from "express-validator";

const router = express.Router();

router.post("/invest", auth(["investor", "entrepreneur"]), 
    [
        body("entrepreneurId")
        .isMongoId()
        .withMessage("Invalid entrepreneur ID"),
        body("startupId")
        .optional()
        .isMongoId()
        .withMessage("Invalid startup ID"),
        body("startupName")
        .trim()
        .escape()
        .isLength({ min: 2, max: 100 }),
        body("industry")
        .trim()
        .escape()
        .isLength({ min: 2, max: 50 }),
        body("amount")
        .isFloat({ min: 1 })
        .withMessage("Amount must be > 0"),
        body("equity")
        .isFloat({ min: 0.1, max: 100 })
        .withMessage("Equity must be between 0.1 and 100"),
        body("stage")
        .isIn(["Seed", "Series A", "Series B", "Series C", "IPO"]),
        body("method")
        .isIn(["stripe", "paypal"]),
      ],
investmentController.investInStartup);

export default router;
