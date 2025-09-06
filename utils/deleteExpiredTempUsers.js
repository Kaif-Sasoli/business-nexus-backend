import cron from 'node-cron'
import tempUserModel from '../models/tempUser.model.js';

export const deleteExpiredTempUsers = () => {
    console.log("🕒 Cron job initialized: runs every 30 minutes");
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();

            const result = await tempUserModel.deleteMany({
                verificationExpiry: { $lt: now }
            });

            console.log(`🗑️ Deleted ${result.deletedCount} expired temp users.`);
        } catch (error) {
            console.error("❌ Error deleting expired temp users:", error.message);
        }
    });
};
