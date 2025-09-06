import express from "express";
import { auth } from "../middlewares/authMiddleware.js";
import * as accountController from "../controllers/account.controller.js";

const router = express.Router();

router.post("/connect", auth(["investor", "entrepreneur"]),
  accountController.connectAccount
);

router.get("/", auth(["investor", "entrepreneur"]),
  accountController.getCurrentAccounts
);

// POST /api/invest
router.post("/invest", auth(["investor"]), accountController.investInStartup);

export default router;
