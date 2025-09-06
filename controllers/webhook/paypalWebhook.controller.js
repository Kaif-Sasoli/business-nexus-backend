import Deal from "../../models/deal.model.js";

export const handlePaypalWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const transaction = event.resource;

      const {
        investorId,
        entrepreneurId,
        startupId,
        startupName,
        industry,
        amount,
        equity,
        stage,
      } = transaction.supplementary_data?.related_metadata || {};

      await Deal.create({
        investorId,
        entrepreneurId,
        startupId,
        startupName,
        industry,
        amount,
        equity,
        stage,
        status: "Due Diligence",
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("PayPal webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
