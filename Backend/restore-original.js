import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function restoreOriginal() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Find all donations with status "used" or "stored" and restore them to "completed"
        const result = await Donation.updateMany(
            {
                status: { $in: ['used', 'stored'] },
                stage: { $in: ['completed', 'ready-storage'] }
            },
            {
                $set: { status: 'completed' }
            }
        );

        console.log(`📊 Restored ${result.modifiedCount} donations to status "completed"`);
        console.log(`✅ Original behavior restored!`);
        console.log(`\n💡 Refresh your browser - donations should now appear in READY FOR STORAGE column`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

restoreOriginal();
