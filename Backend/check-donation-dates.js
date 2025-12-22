import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('📅 Checking donation dates...\n');

const donations = await Donation.find({ organizationId: orgId }).sort({ createdAt: -1 });

console.log(`Found ${donations.length} donations`);

if (donations.length > 0) {
    console.log('\nDonation dates:');
    donations.forEach((d, i) => {
        console.log(`  ${i + 1}. Created: ${d.createdAt.toISOString().split('T')[0]} (${d.createdAt.toDateString()})`);
    });

    const now = new Date();
    console.log(`\nCurrent date: ${now.toDateString()}`);
    console.log(`Current month start: ${new Date(now.getFullYear(), now.getMonth(), 1).toDateString()}`);
    console.log(`Last month start: ${new Date(now.getFullYear(), now.getMonth() - 1, 1).toDateString()}`);
}

await mongoose.connection.close();
