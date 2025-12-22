import mongoose from 'mongoose';
import User from './modules/User.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

// Check the user you've been using
const keepup = await User.findOne({ Email: 'keepup@gmail.com' }).select('organizationName organizationType isVerified role');

console.log('Your blood bank account:');
console.log(keepup);

if (keepup) {
    console.log(`\nType: ${keepup.organizationType}`);
    console.log(`Verified: ${keepup.isVerified}`);
    console.log(`Role: ${keepup.role}`);

    if (keepup.organizationType !== 'BANK') {
        console.log(`\n⚠️  PROBLEM: organizationType is "${keepup.organizationType}", should be "BANK"`);
    }

    if (!keepup.isVerified) {
        console.log('\n⚠️  PROBLEM: Account is not verified');
    }
}

await mongoose.connection.close();
