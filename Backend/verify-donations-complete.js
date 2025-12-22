import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('=== DONATION VERIFICATION ===\n');

// Count donations
const count = await Donation.countDocuments({ organizationId: orgId });
console.log(`Total donations for org: ${count}\n`);

if (count > 0) {
    // Get all donations
    const all = await Donation.find({ organizationId: orgId }).sort({ createdAt: -1 });

    console.log('All donations:');
    all.forEach((d, i) => {
        console.log(`${i + 1}. ${d.donorName} - ${d.bloodGroup} - ${d.createdAt.toISOString()}`);
    });

    // Simulate backend query for December 2025
    const now = new Date();
    const decStart = new Date(now.getFullYear(), 11, 1); // Month 11 = December
    const decEnd = new Date(now.getFullYear(), 11 + 1, 0, 23, 59, 59);

    console.log(`\nQuerying for December 2025:`);
    console.log(`  Start: ${decStart.toISOString()}`);
    console.log(`  End: ${decEnd.toISOString()}`);

    const decCount = await Donation.countDocuments({
        organizationId: orgId,
        createdAt: { $gte: decStart, $lte: decEnd }
    });

    console.log(`  Result: ${decCount} donations`);

    // Query for November 2025
    const novStart = new Date(now.getFullYear(), 10, 1); // Month 10 = November  
    const novEnd = new Date(now.getFullYear(), 10 + 1, 0, 23, 59, 59);

    console.log(`\nQuerying for November 2025:`);
    console.log(`  Start: ${novStart.toISOString()}`);
    console.log(`  End: ${novEnd.toISOString()}`);

    const novCount = await Donation.countDocuments({
        organizationId: orgId,
        createdAt: { $gte: novStart, $lte: novEnd }
    });

    console.log(`  Result: ${novCount} donations`);
}

await mongoose.connection.close();
