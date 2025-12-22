import mongoose from 'mongoose';

// Connect directly
await mongoose.connect('mongodb://localhost:27017/liforce');

console.log('🔌 Connected to MongoDB\n');

// Your correct organization ID
const correctOrgId = '6946ff84e5bb59549eb37464';

// Get blood units collection
const BloodUnit = mongoose.connection.collection('bloodunits');

// Check current state
const allUnits = await BloodUnit.find({}).toArray();
console.log(`📦 Total blood units: ${allUnits.length}`);

if (allUnits.length > 0) {
    // Show current org IDs
    const orgIds = {};
    allUnits.forEach(unit => {
        const id = unit.organizationId?.toString() || 'null';
        orgIds[id] = (orgIds[id] || 0) + 1;
    });

    console.log('\n📊 Current Organization IDs:');
    for (const [id, count] of Object.entries(orgIds)) {
        console.log(`  ${id}: ${count} units`);
    }

    // Update all units
    console.log(`\n🔧 Updating all units to: ${correctOrgId}`);
    const result = await BloodUnit.updateMany(
        {},
        { $set: { organizationId: new mongoose.Types.ObjectId(correctOrgId) } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} blood units!`);
    console.log(`\n🎉 Done! Refresh your dashboard now.`);
} else {
    console.log('\n⚠️  No blood units found!');
}

await mongoose.connection.close();
