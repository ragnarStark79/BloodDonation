import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('🩸 Creating donations for Monthly Trends...\n');

const now = new Date();
const names = ['John Doe', 'Jane Smith', 'Bob Wilson'];

// Current month: 3 donations
for (let i = 0; i < 3; i++) {
    await Donation.create({
        organizationId: new mongoose.Types.ObjectId(orgId),
        createdBy: new mongoose.Types.ObjectId(orgId),
        donorName: names[i % names.length],
        phone: `981234567${i}`,
        bloodGroup: ['A+', 'B+', 'O+'][i],
        stage: 'completed',
        donationType: 'WHOLE_BLOOD',
        donationDate: new Date(now.getFullYear(), now.getMonth(), 5 + i * 5),
        createdAt: new Date(now.getFullYear(), now.getMonth(), 5 + i * 5)
    });
    console.log(`✅ Donation ${i + 1} - Current month`);
}

// Last month: 5 donations
for (let i = 0; i < 5; i++) {
    await Donation.create({
        organizationId: new mongoose.Types.ObjectId(orgId),
        createdBy: new mongoose.Types.ObjectId(orgId),
        donorName: names[i % names.length],
        phone: `982234567${i}`,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][i],
        stage: 'completed',
        donationType: 'WHOLE_BLOOD',
        donationDate: new Date(now.getFullYear(), now.getMonth() - 1, 10 + i * 3),
        createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10 + i * 3)
    });
    console.log(`✅ Donation ${i + 1} - Last month`);
}

console.log('\n🎉 Created 8 donations!');
console.log('\n💡 Refresh dashboard to see the chart!');

await mongoose.connection.close();
