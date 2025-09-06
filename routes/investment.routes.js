import express from "express";
import * as investmentController from "../controllers/investment.controller.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/invest", auth(["investor", "entrepreneur"]), investmentController.investInStartup);

export default router;
