import mongoose from 'mongoose';
import User from './modules/User.js';

await mongoose.connect('mongodb://localhost:27017/Lifeforce');

console.log('🔍 DETAILED CHECK OF LIFEFORCE DATABASE\n');

// All users
const allUsers = await User.find({});
console.log(`Total users: ${allUsers.length}\n`);

allUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.Name || 'No Name'}`);
    console.log(`   Email: ${u.Email}`);
    console.log(`   Role: ${u.role}`);
    console.log(`   Type: ${u.organizationType}`);
    console.log(`   Verified: ${u.isVerified}`);
    console.log('');
});

// Specifically check for BANK type
const banks = await User.find({ organizationType: 'BANK' });
console.log(`\nFiltering organizationType = "BANK": ${banks.length} found`);

const verifiedBanks = await User.find({ organizationType: 'BANK', isVerified: true });
console.log(`Filtering verified BANK: ${verifiedBanks.length} found`);

await mongoose.connection.close();
