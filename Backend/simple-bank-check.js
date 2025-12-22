import mongoose from 'mongoose';
import User from './modules/User.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const banks = await User.find({
    organizationType: 'BANK',
    isVerified: true
});

console.log(`Found: ${banks.length} blood banks`);

if (banks.length > 0) {
    banks.forEach(b => console.log(`- ${b.organizationName || b.Name}`));
} else {
    // Check unverified
    const unverified = await User.find({ organizationType: 'BANK', isVerified: false });
    console.log(`Unverified BANK: ${unverified.length}`);

    // Check all orgs
    const all = await User.find({ role: 'organization' }).select('organizationType isVerified organizationName');
    console.log(`\nAll orgs (${all.length}):`);
    all.forEach(o => console.log(`  ${o.organizationName}: ${o.organizationType}, verified=${o.isVerified}`));
}

await mongoose.connection.close();
