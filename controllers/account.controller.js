import Stripe from "stripe";
import Deal from "../models/deal.model.js";
import UserPayment  from "../models/userPayment.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const connectAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider, paypalEmail, paypalMerchantId } = req.body;

    let userPayment = await UserPayment.findOne({ userId });

    // correct client URL
    const clientUrl = process.env.CLIENT_URL || process.env.LOCAL_CLIENT_URL;

    // STRIPE FLOW 
    if (provider === "stripe") {
      let stripeAccountId;

      if (!userPayment || !userPayment.stripeAccountId) {
        // create Stripe connected account
        const stripeAccount = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: req.user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });

        stripeAccountId = stripeAccount.id;

        if (!userPayment) {
          // first time setup
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

      // Generate onboarding link
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${clientUrl}/settings?refresh=true`,
        return_url: `${clientUrl}/settings?success=true`,
        type: "account_onboarding",
      });

      return res.json({
        success: true,
        provider: "stripe",
        accountId: stripeAccountId,
        onboardingUrl: accountLink.url,
      });
    }

    // ============ PAYPAL FLOW ============
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

    // Determine provider info
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



export const investInStartup = async (req, res) => {
  try {
    const investorId = req.user.id;
    const { entrepreneurId, startupName, industry, amount, equity, stage, method } = req.body;

    // fetch investor + startup payment info
    const [investorPayment, startupPayment] = await Promise.all([
      UserPayment.findOne({ userId: investorId }),
      UserPayment.findOne({ userId: entrepreneurId }),
    ]);

    if (!investorPayment) return res.status(400).json({ error: "Investor has no payment setup" });
    if (!startupPayment) return res.status(400).json({ error: "Startup has no payment setup" });

    let deal;

    if (method === "stripe") {
      if (!investorPayment.stripeAccountId) return res.status(400).json({ error: "Investor not connected with Stripe" });
      if (!startupPayment.stripeAccountId) return res.status(400).json({ error: "Startup not connected with Stripe" });

      const account = await stripe.accounts.retrieve(startupPayment.stripeAccountId);
      if (account.capabilities.transfers !== "active") {
        return res.status(400).json({
          error: "Startup Stripe account not ready. Complete onboarding to activate transfers.",
          onboardingUrl: generateOnboardingUrl(account.id),
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: `Investment in ${startupName}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/invest/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/invest/cancel`,
        payment_intent_data: {
          on_behalf_of: startupPayment.stripeAccountId,
          transfer_data: { destination: startupPayment.stripeAccountId },
        },
      });

      deal = await Deal.create({
        investorId,
        entrepreneurId,
        startupName,
        industry,
        amount,
        equity,
        stage,
        status: "Due Diligence",
      });

      return res.json({ success: true, deal, checkoutUrl: session.url });
    }

    if (method === "paypal") {
      if (!investorPayment.paypalEmail || !startupPayment.paypalEmail) {
        return res.status(400).json({ error: "Both parties must have PayPal setup" });
      }

      const transaction = {
        type: "transfer",
        senderId: investorId,
        receiverId: entrepreneurId,
        amount,
        currency: "usd",
        status: "pending",
        metadata: { method: "paypal" },
      };

      investorPayment.transactions.push(transaction);
      startupPayment.transactions.push(transaction);

      await Promise.all([investorPayment.save(), startupPayment.save()]);

      deal = await Deal.create({
        investorId,
        entrepreneurId,
        startupName,
        industry,
        amount,
        equity,
        stage,
        status: "Due Diligence",
      });

      return res.json({ success: true, transaction, deal });
    }

    return res.status(400).json({ error: "Invalid payment method" });
  } catch (err) {
    console.error("Invest error:", err);
    res.status(500).json({ error: err.message });
  }
};