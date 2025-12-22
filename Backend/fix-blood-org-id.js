import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

// Define schema
const bloodUnitSchema = new mongoose.Schema({}, { strict: false });
const BloodUnit = mongoose.model('BloodUnit', bloodUnitSchema, 'bloodunits');

async function fixBloodUnits() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected!\n');

        // The correct organization ID from your user
        const correctOrgId = '6946ff84e5bb59549eb37464';

        console.log(`📋 Checking blood units in database...`);
        const allUnits = await BloodUnit.find({});
        console.log(`   Total units found: ${allUnits.length}`);

        if (allUnits.length === 0) {
            console.log('\n⚠️  No blood units found in database!');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Group by organizationId
        const byOrg = {};
        allUnits.forEach(unit => {
            const orgId = unit.organizationId?.toString() || 'null';
            byOrg[orgId] = (byOrg[orgId] || 0) + 1;
        });

        console.log('\n📊 Units by Organization ID:');
        Object.entries(byOrg).forEach(([orgId, count]) => {
            console.log(`   ${orgId}: ${count} units`);
        });

        // Check if units already have correct org ID
        const unitsWithCorrectOrg = await BloodUnit.countDocuments({
            organizationId: new mongoose.Types.ObjectId(correctOrgId)
        });

        console.log(`\n✅ Units with correct org ID (${correctOrgId}): ${unitsWithCorrectOrg}`);

        if (unitsWithCorrectOrg === allUnits.length) {
            console.log('\n✨ All units already have the correct organization ID!');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Update all units to correct organization ID
        console.log(`\n🔧 Updating all ${allUnits.length} units to organization ID: ${correctOrgId}`);

        const result = await BloodUnit.updateMany(
            {},
            { $set: { organizationId: new mongoose.Types.ObjectId(correctOrgId) } }
        );

        console.log(`\n✅ Update complete!`);
        console.log(`   Modified: ${result.modifiedCount} units`);
        console.log(`   Matched: ${result.matchedCount} units`);

        // Verify the fix
        const verifyCount = await BloodUnit.countDocuments({
            organizationId: new mongoose.Types.ObjectId(correctOrgId)
        });
        console.log(`\n🎉 Verification: ${verifyCount} units now have the correct organization ID!`);
        console.log('\n💡 Now refresh your dashboard to see the charts!');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

console.log('🩸 Blood Units Organization ID Fix Script');
console.log('=========================================\n');

fixBloodUnits();
