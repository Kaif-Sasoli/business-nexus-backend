// Mock for now
export const createPaypalTransaction = (investorId, entrepreneurId, amount) => {
  return {
    type: "transfer",
    senderId: investorId,
    receiverId: entrepreneurId,
    amount,
    currency: "usd",
    status: "pending",
    metadata: { method: "paypal" },
  };
};
