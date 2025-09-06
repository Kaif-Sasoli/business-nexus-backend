import express from "express";
import * as paymentController from "../controllers/payment.controller.js";
import { auth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/connect", auth(["investor", "entrepreneur"]), 
            paymentController.connectAccount);

router.get("/me", auth(["investor", "entrepreneur"]), 
        paymentController.getCurrentAccounts);

export default router;
