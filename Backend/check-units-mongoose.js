import mongoose from 'mongoose';
import BloodUnit from './modules/BloodUnit.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log(`🔍 Checking blood units for org: ${orgId}\n`);

// Count using Mongoose model (how backend does it)
const count = await BloodUnit.countDocuments({
    organizationId: new mongoose.Types.ObjectId(orgId),
    status: "AVAILABLE"
});

console.log(`📦 Available units: ${count}`);

// Show all units
const all = await BloodUnit.find({ organizationId: new mongoose.Types.ObjectId(orgId) }).limit(5);
console.log(`\n📋 Sample units (first 5):`);
all.forEach((unit, i) => {
    console.log(`  ${i + 1}. ${unit.bloodGroup} - ${unit.status} - ${unit.barcode || 'No barcode'}`);
});

// Check if there are units without this orgId
const totalUnits = await BloodUnit.countDocuments({});
console.log(`\n🌐 Total units in system: ${totalUnits}`);

// Group by organizationId
const byOrg = await BloodUnit.aggregate([
    { $group: { _id: "$organizationId", count: { $sum: 1 } } }
]);

console.log(`\n📊 Units by Organization:`);
byOrg.forEach(item => {
    console.log(`  ${item._id}: ${item.count} units`);
});

await mongoose.connection.close();
