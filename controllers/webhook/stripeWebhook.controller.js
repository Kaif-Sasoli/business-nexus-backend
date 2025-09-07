import Deal from "../../models/deal.model.js";
import UserPayment from "../../models/userPayment.model.js";
import stripe from "../../config/stripe.js";

export const handleStripeWebhook = async (req, res) => {
  try {
    console.log("Stripe WeebHook HItted")
    
    const sig = req.headers["stripe-signature"];
    let event;

    event = stripe.webhooks.constructEvent(
      req.body, 
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

console.log("Event in hook:", event)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const {
        investorId,
        entrepreneurId,
        startupName,
        industry,
        amount,
        equity,
        stage,
      } = session.metadata;

      // 1. Create transaction object
      const transaction = {
        type: "transfer",
        senderId: investorId,
        receiverId: entrepreneurId,
        amount: Number(amount),   
        currency: "usd",
        status: "completed",
        metadata: { method: "stripe", sessionId: session.id },
      };

      // 2. Update investor & entrepreneur payments
      const [investorPayment, startupPayment] = await Promise.all([
        UserPayment.findOne({ userId: investorId }),
        UserPayment.findOne({ userId: entrepreneurId }),
      ]);

      if (investorPayment) {
        investorPayment.transactions.push(transaction);
        await investorPayment.save();
      }

      if (startupPayment) {
        startupPayment.transactions.push(transaction);
        startupPayment.balance += Number(amount); 
        await startupPayment.save();
      }

      // 3. Save deal
      await Deal.create({
        investorId,
        entrepreneurId,
        startupName,
        industry,
        amount: Number(amount),
        equity: Number(equity),
        stage,
        status: "Due Diligence",
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};


// export const handleStripeWebhook = async (req, res) => {
//   try {
//     console.log("Stripe Webhook Hitted");

//     const sig = req.headers["stripe-signature"];
//     let event;

//     if (process.env.NODE_ENV === "development" && !sig) {
//       // 👉 Skip signature check in dev mode (Postman testing)
//       event = req.body; 
//       console.log("⚠️ Dev mode: Skipping Stripe signature verification");
//     } else {
//       // Normal Stripe signature verification
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET
//       );
//     }

//     console.log("Event in hook:", event);

//     // … rest of your business logic …
//     res.json({ received: true });
//   } catch (err) {
//     console.error("Stripe webhook error:", err);
//     res.status(400).send(`Webhook Error: ${err.message}`);
//   }
// };