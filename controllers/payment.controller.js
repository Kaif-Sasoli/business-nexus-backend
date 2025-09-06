import UserPayment from "../models/userPayment.model.js";
import { createStripeAccount, createOnboardingLink } from "../services/stripe.service.js";

export const connectAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider, paypalEmail, paypalMerchantId } = req.body;

    let userPayment = await UserPayment.findOne({ userId });
    const clientUrl = process.env.CLIENT_URL || process.env.LOCAL_CLIENT_URL;

    // STRIPE FLOW
    if (provider === "stripe") {
      let stripeAccountId;

      if (!userPayment || !userPayment.stripeAccountId) {
        const stripeAccount = await createStripeAccount(req.user.email);
        stripeAccountId = stripeAccount.id;

        if (!userPayment) {
          userPayment = await UserPayment.create({
            userId,
            provider: "stripe",
            stripeAccountId,
            balance: 0,
            transactions: [],
          });
        } else {
          userPayment.provider = "stripe";
          userPayment.stripeAccountId = stripeAccountId;
          await userPayment.save();
        }
      } else {
        stripeAccountId = userPayment.stripeAccountId;
      }

      const accountLink = await createOnboardingLink(stripeAccountId, clientUrl);
      return res.json({
        success: true,
        provider: "stripe",
        accountId: stripeAccountId,
        onboardingUrl: accountLink.url,
      });
    }

    // PAYPAL FLOW
    if (provider === "paypal") {
      if (!paypalEmail) {
        return res.status(400).json({ error: "PayPal email required" });
      }

      if (!userPayment) {
        userPayment = await UserPayment.create({
          userId,
          provider: "paypal",
          paypalEmail,
          paypalMerchantId: paypalMerchantId || null,
          balance: 0,
          transactions: [],
        });
      } else {
        userPayment.provider = "paypal";
        userPayment.paypalEmail = paypalEmail;
        userPayment.paypalMerchantId = paypalMerchantId || null;
        await userPayment.save();
      }

      return res.json({
        success: true,
        provider: "paypal",
        account: userPayment,
      });
    }

    return res.status(400).json({ error: "Invalid provider" });
  } catch (err) {
    console.error("Account connect error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getCurrentAccounts = async (req, res) => {
  try {
    const account = await UserPayment.findOne({ userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "No payment account found" });
    }

    let accountInfo = { provider: account.provider };

    if (account.provider === "stripe") {
      accountInfo.stripeAccountId = account.stripeAccountId;
    } else if (account.provider === "paypal") {
      accountInfo.paypalEmail = account.paypalEmail;
      accountInfo.paypalMerchantId = account.paypalMerchantId;
    }
    accountInfo.balance = account.balance;
    accountInfo.transactions = account.transactions;

    return res.json({ success: true, account: accountInfo });
  } catch (err) {
    console.error("Get account error:", err);
    res.status(500).json({ error: err.message });
  }
};
