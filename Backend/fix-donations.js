import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

// First delete all existing donations for this org
console.log('🗑️  Deleting old donations...');
const deleted = await Donation.deleteMany({ organizationId: orgId });
console.log(`Deleted ${deleted.deletedCount} old donations\n`);

console.log('🩸 Creating NEW donations with correct orgId format...\n');

const now = new Date();
const names = ['John Doe', 'Jane Smith', 'Bob Wilson'];

// Current month (December 2025): 3 donations
for (let i = 0; i < 3; i++) {
    await Donation.create({
        organizationId: orgId, // String, not ObjectId!
        createdBy: orgId,
        donorName: names[i % names.length],
        phone: `981234567${i}`,
        bloodGroup: ['A+', 'B+', 'O+'][i],
        stage: 'completed',
        donationType: 'WHOLE_BLOOD',
        donationDate: new Date(now.getFullYear(), now.getMonth(), 5 + i * 5),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 5 + i * 5)
    });
    console.log(`✅ Donation ${i + 1} - Dec 2025`);
}

// Last month (November 2025): 5 donations
for (let i = 0; i < 5; i++) {
    await Donation.create({
        organizationId: orgId, // String, not ObjectId!
        createdBy: orgId,
        donorName: names[i % names.length],
        phone: `982234567${i}`,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][i],
        stage: 'completed',
        donationType: 'WHOLE_BLOOD',
        donationDate: new Date(now.getFullYear(), now.getMonth() - 1, 10 + i * 3),
        createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10 + i * 3)
    });
    console.log(`✅ Donation ${i + 1} - Nov 2025`);
}

console.log('\n🎉 Created 8 donations with STRING orgId!');
console.log('\n💡 Hard refresh dashboard (Ctrl+Shift+R) to see the chart!');

await mongoose.connection.close();
