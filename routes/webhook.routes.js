import express from "express";
import { handleStripeWebhook } from "../controllers/webhook/stripeWebhook.controller.js";
import { handlePaypalWebhook } from "../controllers/webhook/paypalWebhook.controller.js";

const router = express.Router();

// Stripe requires raw body
router.post("/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

// PayPal can use JSON
router.post("/paypal", express.json(), handlePaypalWebhook);

export default router;
