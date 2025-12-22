import mongoose from 'mongoose';
import Donation from './modules/Donation.js';
import User from './modules/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function cleanupAllCompleted() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all donations with status "completed" (these should be hidden from pipeline)
        const donations = await Donation.find({
            status: 'completed'
        }).populate('organizationId', 'organizationType organizationName Name');

        console.log(`📊 Found ${donations.length} donations with status "completed"\n`);

        if (donations.length === 0) {
            console.log('✅ No donations to clean up!');
            process.exit(0);
        }

        let hospitalCount = 0;
        let bloodBankCount = 0;
        let unknownCount = 0;

        for (const donation of donations) {
            const org = donation.organizationId;

            if (!org) {
                console.log(`⚠️  Donation ${donation._id} (${donation.name}) - no organization, marking as "used"`);
                donation.status = 'used';
                await donation.save();
                unknownCount++;
                continue;
            }

            if (org.organizationType === 'HOSPITAL') {
                donation.status = 'used';
                donation.history.push({
                    stage: donation.stage,
                    action: 'Blood used on patient',
                    performedBy: org._id,
                    performedAt: new Date(),
                    notes: 'Cleanup: Hospital donation marked as used'
                });
                await donation.save();
                hospitalCount++;
                console.log(`✅ [HOSPITAL] ${donation.name} → "used"`);
            } else if (org.organizationType === 'BANK') {
                donation.status = 'stored';
                donation.history.push({
                    stage: donation.stage,
                    action: 'Added to inventory',
                    performedBy: org._id,
                    performedAt: new Date(),
                    notes: 'Cleanup: Blood bank donation marked as stored'
                });
                await donation.save();
                bloodBankCount++;
                console.log(`✅ [BLOOD BANK] ${donation.name} → "stored"`);
            } else {
                console.log(`⚠️  Unknown org type for ${donation.name}: ${org.organizationType}`);
                donation.status = 'used';
                await donation.save();
                unknownCount++;
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`   Hospital donations → "used": ${hospitalCount}`);
        console.log(`   Blood bank donations → "stored": ${bloodBankCount}`);
        console.log(`   Unknown → "used": ${unknownCount}`);
        console.log(`   Total processed: ${hospitalCount + bloodBankCount + unknownCount}`);
        console.log(`\n✅ Cleanup complete!`);
        console.log(`💡 Refresh your browser (Ctrl+F5) to see changes.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupAllCompleted();
