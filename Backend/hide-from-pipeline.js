import mongoose from 'mongoose';
import Donation from './modules/Donation.js';
import User from './modules/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function hideFromPipeline() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Find all donations with status "completed" in ready-storage or completed stage
        const donations = await Donation.find({
            status: 'completed',
            stage: { $in: ['completed', 'ready-storage'] }
        }).populate('organizationId', 'organizationType organizationName Name');

        console.log(`📊 Found ${donations.length} donations to hide from READY FOR STORAGE\n`);

        if (donations.length === 0) {
            console.log('✅ No donations to hide!');
            process.exit(0);
        }

        let updated = 0;

        for (const donation of donations) {
            try {
                const org = donation.organizationId;
                const orgType = org?.organizationType || 'HOSPITAL';

                if (orgType === 'BANK') {
                    await Donation.updateOne(
                        { _id: donation._id },
                        { $set: { status: 'stored' } }
                    );
                    console.log(`✅ [BLOOD BANK] ${donation.donorName || 'Unknown'} → "stored"`);
                } else {
                    await Donation.updateOne(
                        { _id: donation._id },
                        { $set: { status: 'used' } }
                    );
                    console.log(`✅ [HOSPITAL] ${donation.donorName || 'Unknown'} → "used"`);
                }
                updated++;
            } catch (err) {
                console.error(`❌ Error updating ${donation.donorName}:`, err.message);
            }
        }

        console.log(`\n📈 Hidden ${updated} donations from pipeline`);
        console.log(`✅ Complete!`);
        console.log(`\n💡 Refresh browser (Ctrl+F5) - READY FOR STORAGE should be EMPTY!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

hideFromPipeline();
