import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function detailedCheck() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Check donations in ready-storage STAGE
        const readyStorageDonations = await Donation.find({
            stage: 'ready-storage'
        }).select('donorName stage status').lean();

        console.log(`📊 Donations in "ready-storage" STAGE: ${readyStorageDonations.length}`);
        if (readyStorageDonations.length > 0) {
            console.log('\nDetails:');
            readyStorageDonations.forEach(d => {
                console.log(`   - ${d.donorName}: stage="${d.stage}", status="${d.status}"`);
            });
        }

        // Check what the API query returns
        const apiQuery = { status: { $in: ["active", "completed"] } };
        const apiResult = await Donation.find(apiQuery).select('donorName stage status').lean();

        console.log(`\n🔍 API Query Result (status: active or completed): ${apiResult.length} donations`);
        if (apiResult.length > 0) {
            console.log('\nThese will show in UI:');
            apiResult.forEach(d => {
                console.log(`   - ${d.donorName}: stage="${d.stage}", status="${d.status}"`);
            });
        }

        console.log(`\n💡 READY FOR STORAGE column will show: ${apiResult.filter(d => d.stage === 'ready-storage').length} donors`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

detailedCheck();
