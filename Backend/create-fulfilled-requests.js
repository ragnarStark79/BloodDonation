import mongoose from 'mongoose';
import Request from './modules/Request.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('🩸 Creating sample fulfilled requests for chart testing...\n');

// Create sample fulfilled requests for different months
const sampleRequests = [
    // Current month (assume Dec/Jan for now, using recent dates)
    { unitsNeeded: 2, updatedAt: new Date(), month: 'Current' },
    { unitsNeeded: 3, updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), month: 'Last Month' },
    { unitsNeeded: 1, updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), month: '2 Months Ago' },
    { unitsNeeded: 5, updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), month: '3 Months Ago' },
];


for (let i = 0; i < sampleRequests.length; i++) {
    const req = await Request.create({
        organizationId: new mongoose.Types.ObjectId(orgId),
        bloodGroup: 'A+',
        unitsNeeded: sampleRequests[i].unitsNeeded,
        urgency: 'MEDIUM',
        status: 'FULFILLED',
        location: { type: 'Point', coordinates: [0, 0], address: 'Test Location' },
        patientName: 'Test Patient',
        hospitalName: 'Test Hospital',
        contactNumber: '1234567890',
        updatedAt: sampleRequests[i].updatedAt, // Important for the graph
        createdAt: sampleRequests[i].updatedAt
    });
    console.log(`✅ Created ${sampleRequests[i].month}: ${req.unitsNeeded} units - Status: ${req.status}`);
}

console.log(`\n🎉 Successfully created ${sampleRequests.length} fulfilled requests!`);

// Verify count
const count = await Request.countDocuments({
    organizationId: new mongoose.Types.ObjectId(orgId),
    status: 'FULFILLED'
});

console.log(`\n📊 Total fulfilled requests for org ${orgId}: ${count}`);
console.log('\n💡 Now refresh your dashboard to see the teal line on the chart!');

await mongoose.connection.close();
