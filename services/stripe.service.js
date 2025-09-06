import stripe from "../config/stripe.js";

export const createStripeAccount = async (email) => {
  return await stripe.accounts.create({
    type: "express",
    country: "US",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
};

export const createOnboardingLink = async (accountId, clientUrl) => {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${clientUrl}/settings?refresh=true`,
    return_url: `${clientUrl}/settings?success=true`,
    type: "account_onboarding",
  });
};

export const createCheckoutSession = async (
entrepreneurId,
startupStripeId,
  startupName,
  amount,
  investmentMeta
) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Investment in ${startupName}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.CLIENT_URL}/profile/entrepreneur/${entrepreneurId}`,
    cancel_url: `${process.env.CLIENT_URL}/invest/cancel`,
    payment_intent_data: {
      on_behalf_of: startupStripeId,
      transfer_data: { destination: startupStripeId },
    },
    metadata: investmentMeta,
  });
};

export const getStripeAccount = async (accountId) => {
  return await stripe.accounts.retrieve(accountId);
};
