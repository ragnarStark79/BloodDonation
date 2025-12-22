import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function debugDonations() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Get ALL donations
        const all = await Donation.find({}).select('_id name stage status organizationId').lean();
        console.log(`📊 Total donations in database: ${all.length}\n`);

        // Group by status
        const byStatus = {};
        all.forEach(d => {
            byStatus[d.status] = (byStatus[d.status] || 0) + 1;
        });
        console.log('By Status:', byStatus);

        // Group by stage
        const byStage = {};
        all.forEach(d => {
            byStage[d.stage] = (byStage[d.stage] || 0) + 1;
        });
        console.log('By Stage:', byStage);

        // Show what the API would return (status: active or completed)
        const apiResult = await Donation.find({
            status: { $in: ['active', 'completed'] }
        }).select('_id name stage status').lean();

        console.log(`\n🔍 What API returns (status: active or completed): ${apiResult.length} donations`);
        if (apiResult.length > 0) {
            console.log('\nDetails:');
            apiResult.forEach(d => {
                console.log(`  - ${d.name || 'Unknown'} | Stage: ${d.stage} | Status: ${d.status}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugDonations();
