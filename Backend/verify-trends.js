import mongoose from 'mongoose';
import Donation from './modules/Donation.js';
import Request from './modules/Request.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('📊 DATABASE CHECK FOR MONTHLY TRENDS\n');

const donationCount = await Donation.countDocuments({ organizationId: orgId });
const fulfilledCount = await Request.countDocuments({ organizationId: orgId, status: 'FULFILLED' });

console.log(`✅ Donations in DB: ${donationCount}`);
console.log(`✅ Fulfilled Requests in DB: ${fulfilledCount}\n`);

if (donationCount === 0 && fulfilledCount === 0) {
    console.log('⚠️  NO DATA - Chart will be empty!');
    console.log('💡 Need to create sample data\n');
} else {
    console.log('✓ Data exists! Checking dates...\n');

    if (donationCount > 0) {
        const latest = await Donation.findOne({ organizationId: orgId }).sort({ createdAt: -1 });
        console.log(`Latest Donation: ${latest.createdAt}`);
    }

    if (fulfilledCount > 0) {
        const latest = await Request.findOne({ organizationId: orgId, status: 'FULFILLED' }).sort({ updatedAt: -1 });
        console.log(`Latest Fulfilled Request: ${latest.updatedAt}`);
    }
}

await mongoose.connection.close();
