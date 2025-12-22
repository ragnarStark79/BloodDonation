import mongoose from 'mongoose';
import Request from './modules/Request.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('🔍 Checking Fulfilled Requests...\n');

// Check with string orgId (how backend queries)
const fulfilledCount = await Request.countDocuments({
    organizationId: orgId,
    status: 'FULFILLED'
});

console.log(`✅ Fulfilled requests (string orgId): ${fulfilledCount}`);

// Check with ObjectId (how I created sample data)
const fulfilledCountObj = await Request.countDocuments({
    organizationId: new mongoose.Types.ObjectId(orgId),
    status: 'FULFILLED'
});

console.log(`⚠️  Fulfilled requests (ObjectId): ${fulfilledCountObj}`);

// Check ALL requests for this org
const allRequests = await Request.countDocuments({
    organizationId: orgId
});

console.log(`📊 Total requests (any status): ${allRequests}\n`);

if (fulfilledCountObj > 0) {
    console.log('Found fulfilled requests with ObjectId - they need to be fixed!');
    const requests = await Request.find({
        organizationId: new mongoose.Types.ObjectId(orgId),
        status: 'FULFILLED'
    });

    console.log('\nDates:');
    requests.forEach(r => {
        console.log(`  - ${r.updatedAt.toISOString()} (${r.unitsNeeded} units)`);
    });
}

await mongoose.connection.close();
