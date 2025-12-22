import mongoose from 'mongoose';
import Donation from './modules/Donation.js';
import User from './modules/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function cleanupHospitalDonations() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all donations in ready-storage stage with status "completed"
        const donations = await Donation.find({
            stage: 'ready-storage',
            status: 'completed'
        }).populate('organizationId', 'organizationType organizationName Name');

        console.log(`📊 Found ${donations.length} donations in READY FOR STORAGE with status "completed"\n`);

        if (donations.length === 0) {
            console.log('✅ No donations to clean up!');
            process.exit(0);
        }

        let hospitalCount = 0;
        let bloodBankCount = 0;

        for (const donation of donations) {
            const org = donation.organizationId;

            if (!org) {
                console.log(`⚠️  Skipping donation ${donation._id} - no organization found`);
                continue;
            }

            if (org.organizationType === 'HOSPITAL') {
                // Mark as "used" for hospitals
                donation.status = 'used';
                donation.history.push({
                    stage: 'ready-storage',
                    action: 'Blood used on patient',
                    performedBy: org._id,
                    performedAt: new Date(),
                    notes: 'Cleanup: Marked as used (hospital - no inventory)'
                });
                await donation.save();
                hospitalCount++;
                console.log(`✅ [HOSPITAL] ${org.organizationName || org.Name}: Donation ${donation._id} → "used"`);
            } else if (org.organizationType === 'BANK') {
                // Mark as "stored" for blood banks
                donation.status = 'stored';
                donation.history.push({
                    stage: 'ready-storage',
                    action: 'Added to inventory',
                    performedBy: org._id,
                    performedAt: new Date(),
                    notes: 'Cleanup: Marked as stored (blood bank inventory)'
                });
                await donation.save();
                bloodBankCount++;
                console.log(`✅ [BLOOD BANK] ${org.organizationName || org.Name}: Donation ${donation._id} → "stored"`);
            }
        }

        console.log(`\n📈 Summary:`);
        console.log(`   Hospital donations marked as "used": ${hospitalCount}`);
        console.log(`   Blood bank donations marked as "stored": ${bloodBankCount}`);
        console.log(`\n✅ Cleanup complete! READY FOR STORAGE column should now be empty.`);
        console.log(`💡 Refresh your browser to see the changes.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

cleanupHospitalDonations();
