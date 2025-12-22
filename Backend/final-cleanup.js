import mongoose from 'mongoose';
import Donation from './modules/Donation.js';
import User from './modules/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function finalCleanup() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Find donations in completed or ready-storage stage with status "active"
        const donations = await Donation.find({
            stage: { $in: ['completed', 'ready-storage'] },
            status: 'active'
        }).populate('organizationId', 'organizationType organizationName Name');

        console.log(`📊 Found ${donations.length} donations to hide from pipeline\n`);

        if (donations.length === 0) {
            console.log('✅ No donations to clean up!');
            process.exit(0);
        }

        let updated = 0;

        for (const donation of donations) {
            try {
                const org = donation.organizationId;
                const orgType = org?.organizationType || 'UNKNOWN';
                const orgName = org?.organizationName || org?.Name || 'Unknown';

                // Just update the status field - don't add to history to avoid validation issues
                if (orgType === 'HOSPITAL' || orgType === 'UNKNOWN') {
                    await Donation.updateOne(
                        { _id: donation._id },
                        { $set: { status: 'used' } }
                    );
                    console.log(`✅ ${donation.name || 'Unknown'} [${orgName}] → "used"`);
                    updated++;
                } else if (orgType === 'BANK') {
                    await Donation.updateOne(
                        { _id: donation._id },
                        { $set: { status: 'stored' } }
                    );
                    console.log(`✅ ${donation.name || 'Unknown'} [${orgName}] → "stored"`);
                    updated++;
                }
            } catch (err) {
                console.error(`❌ Error updating ${donation.name}:`, err.message);
            }
        }

        console.log(`\n📈 Updated ${updated} donations (NOT deleted, just hidden from pipeline)`);
        console.log(`✅ Cleanup complete!`);
        console.log(`\n💡 Refresh your browser (Ctrl+F5) - READY FOR STORAGE should be empty!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

finalCleanup();
