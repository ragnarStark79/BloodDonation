import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('=== DATABASE CHECK FOR MONTHLY TRENDS ===\n');

const Donation = mongoose.model('Donation');
const Request = mongoose.model('Request');

const donationCount = await Donation.countDocuments({ organizationId: orgId });
const fulfilledCount = await Request.countDocuments({ organizationId: orgId, status: 'FULFILLED' });

console.log(`Donations: ${donationCount}`);
console.log(`Fulfilled Requests: ${fulfilledCount}`);

if (donationCount > 0) {
    const sample = await Donation.findOne({ organizationId: orgId });
    console.log(`\nSample Donation createdAt: ${sample.createdAt}`);
}

if (fulfilledCount > 0) {
    const sample = await Request.findOne({ organizationId: orgId, status: 'FULFILLED' });
    console.log(`Sample Fulfilled Request updatedAt: ${sample.updatedAt}`);
}

await mongoose.connection.close();
