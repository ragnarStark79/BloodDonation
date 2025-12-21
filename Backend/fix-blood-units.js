import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const fixUnits = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));

        // Find all ISSUED units
        const issuedUnits = await BloodUnit.find({ status: 'ISSUED' });
        console.log(`📦 Found ${issuedUnits.length} ISSUED units\n`);

        if (issuedUnits.length > 0) {
            console.log('Details:');
            issuedUnits.forEach((unit, idx) => {
                console.log(`   ${idx + 1}. ${unit.bloodGroup} - Status: ${unit.status}`);
            });
            console.log('');

            // Ask if we should change them to AVAILABLE
            console.log('💡 These units should be AVAILABLE (not ISSUED) for blood bank to use them.\n');
            console.log('📝 Changing all ISSUED units to AVAILABLE...\n');

            const result = await BloodUnit.updateMany(
                { status: 'ISSUED' },
                { $set: { status: 'AVAILABLE' } }
            );

            console.log(`✅ Updated ${result.modifiedCount} unit(s) from ISSUED → AVAILABLE`);
            console.log('✨ Your blood bank inventory is now available!\n');

            // Show current status
            const nowAvailable = await BloodUnit.find({ status: 'AVAILABLE' });
            console.log(`📊 Current AVAILABLE units: ${nowAvailable.length}`);

            const byGroup = {};
            nowAvailable.forEach(u => {
                byGroup[u.bloodGroup] = (byGroup[u.bloodGroup] || 0) + 1;
            });

            console.log('   Breakdown:');
            Object.entries(byGroup).forEach(([group, count]) => {
                console.log(`     - ${group}: ${count} units`);
            });
        } else {
            console.log('✨ No ISSUED units found. Check other statuses:\n');

            const allUnits = await BloodUnit.find({});
            const byStatus = {};
            allUnits.forEach(u => {
                byStatus[u.status] = (byStatus[u.status] || 0) + 1;
            });

            console.log('Current inventory by status:');
            Object.entries(byStatus).forEach(([status, count]) => {
                console.log(`   ${status}: ${count}`);
            });
        }

        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixUnits();
