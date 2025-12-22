import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function checkDonations() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check all donations in ready-storage stage
        const allReadyStorage = await Donation.find({
            stage: 'ready-storage'
        }).populate('organizationId', 'organizationType organizationName Name').lean();

        console.log(`📊 Total donations in ready-storage stage: ${allReadyStorage.length}\n`);

        if (allReadyStorage.length > 0) {
            console.log('Status breakdown:');
            allReadyStorage.forEach(d => {
                const orgName = d.organizationId?.organizationName || d.organizationId?.Name || 'Unknown';
                const orgType = d.organizationId?.organizationType || 'Unknown';
                console.log(`  - ${d.name} | Status: ${d.status} | Org: ${orgName} (${orgType})`);
            });
        }

        // Also check donations with status "active" or "completed"
        const activeDonations = await Donation.find({
            status: { $in: ['active', 'completed'] }
        }).select('_id stage status name').lean();

        console.log(`\n📋 Donations with status "active" or "completed": ${activeDonations.length}`);
        if (activeDonations.length > 0) {
            console.log('Stage breakdown:');
            const stageCount = {};
            activeDonations.forEach(d => {
                stageCount[d.stage] = (stageCount[d.stage] || 0) + 1;
            });
            console.log(stageCount);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDonations();
