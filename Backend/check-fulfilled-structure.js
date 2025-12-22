import mongoose from 'mongoose';
import Request from './modules/Request.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('🔍 Checking your fulfilled request...\n');

// Check with the NEW query (assignedTo.organizationId)
const countNew = await Request.countDocuments({
    'assignedTo.organizationId': orgId,
    status: 'FULFILLED'
});

console.log(`✅ Fulfilled requests (NEW query): ${countNew}`);

// Check with the OLD query (organizationId) 
const countOld = await Request.countDocuments({
    organizationId: orgId,
    status: 'FULFILLED'
});

console.log(`⚠️  Fulfilled requests (OLD query): ${countOld}`);

// Show ALL fulfilled requests to see their structure
const allFulfilled = await Request.find({ status: 'FULFILLED' }).sort({ updatedAt: -1 }).limit(5);

console.log(`\n📊 All FULFILLED requests (latest 5):`);
allFulfilled.forEach((r, i) => {
    console.log(`${i + 1}. Blood: ${r.bloodGroup}, Units: ${r.unitsNeeded}`);
    console.log(`   organizationId: ${r.organizationId}`);
    console.log(`   assignedTo.organizationId: ${r.assignedTo?.organizationId || 'NOT SET'}`);
    console.log(`   updatedAt: ${r.updatedAt.toISOString()}`);
    console.log('');
});

await mongoose.connection.close();
