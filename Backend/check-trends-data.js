import mongoose from 'mongoose';
import Donation from './modules/Donation.js';
import Request from './modules/Request.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('🔍 Checking data for Monthly Trends chart...\n');

// Check Donations
const donationCount = await Donation.countDocuments({
    organizationId: new mongoose.Types.ObjectId(orgId)
});
console.log(`📊 Total Donations: ${donationCount}`);

if (donationCount > 0) {
    const recentDonations = await Donation.find({
        organizationId: new mongoose.Types.ObjectId(orgId)
    }).limit(3).sort({ createdAt: -1 });
    console.log('Recent donations:', recentDonations.map(d => ({
        id: d._id,
        createdAt: d.createdAt,
        stage: d.stage
    })));
}

// Check Fulfilled Requests
const fulfilledCount = await Request.countDocuments({
    organizationId: new mongoose.Types.ObjectId(orgId),
    status: 'FULFILLED'
});
console.log(`\n✅ Fulfilled Requests: ${fulfilledCount}`);

if (fulfilledCount > 0) {
    const recentFulfilled = await Request.find({
        organizationId: new mongoose.Types.ObjectId(orgId),
        status: 'FULFILLED'
    }).limit(3).sort({ updatedAt: -1 });
    console.log('Recent fulfilled requests:', recentFulfilled.map(r => ({
        id: r._id,
        updatedAt: r.updatedAt,
        unitsNeeded: r.unitsNeeded
    })));
}

console.log(`\n💡 Summary:`);
console.log(`   - If both are 0, the chart will be empty`);
console.log(`   - We need to create sample Donation records for the chart to show data`);

await mongoose.connection.close();
