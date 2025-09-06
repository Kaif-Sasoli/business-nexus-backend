import UserPayment from "../models/userPayment.model.js";
import { createCheckoutSession, getStripeAccount } from "../services/stripe.service.js";
import { createPaypalTransaction } from "../services/paypal.service.js";

export const investInStartup = async (req, res) => {
  try {

    const investorId = req.user.id;
    const { entrepreneurId, startupId, startupName, industry, amount, equity, stage, method } = req.body;
   
    const [investorPayment, startupPayment] = await Promise.all([
      UserPayment.findOne({ userId: investorId }),
      UserPayment.findOne({ userId: entrepreneurId }),
    ]);

    if (!investorPayment) return res.status(400).json({ error: "Investor has no payment setup" });
    if (!startupPayment) return res.status(400).json({ error: "Startup has no payment setup" });

    // STRIPE FLOW
    if (method === "stripe") {
      if (!investorPayment.stripeAccountId) return res.status(400).json({ error: "Investor not connected with Stripe" });
      if (!startupPayment.stripeAccountId) return res.status(400).json({ error: "Startup not connected with Stripe" });

      const account = await getStripeAccount(startupPayment.stripeAccountId);
      if (account.capabilities.transfers !== "active") {
        return res.status(400).json({
          error: "Startup Stripe account not ready. Complete onboarding.",
        });
      }
      const meta = {
        investorId: String(investorId),
        entrepreneurId: String(entrepreneurId),
        startupId: String(startupId || ""),
        startupName: String(startupName || ""),
        industry: String(industry || ""),
        amount: String(amount), // stringified!
        equity: String(equity),
        stage: String(stage || "Seed"),
      };

      const session = await createCheckoutSession(
        entrepreneurId,
        startupPayment.stripeAccountId,
        startupName,
        amount,
        meta
      );


      // const session = await createCheckoutSession(
      //   entrepreneurId,
      //   startupPayment.stripeAccountId,
      //   startupName,
      //   amount,
      //   { investorId, entrepreneurId,  startupName, industry, amount, equity, stage }
      // );

     console.log("Created Stripe session:", session.id);
      return res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
      }

    // PAYPAL FLOW
    if (method === "paypal") {
      if (!investorPayment.paypalEmail || !startupPayment.paypalEmail) {
        return res.status(400).json({ error: "Both parties must have PayPal setup" });
      }

      // For now, just mock — don’t save to DB until webhook
      const transaction = createPaypalTransaction(investorId, entrepreneurId, amount);
      return res.json({ success: true, transaction });
    }

    return res.status(400).json({ error: "Invalid payment method" });
  } catch (err) {
    console.error("Invest error:", err);
    res.status(500).json({ error: err.message });
  }
};
