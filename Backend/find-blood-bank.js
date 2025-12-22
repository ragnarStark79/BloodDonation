import mongoose from 'mongoose';
import User from './modules/User.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

// Find ALL users to see what exists
const allUsers = await User.find({}).select('Name Email role organizationType isVerified').limit(10);

console.log(`Total users in database: ${await User.countDocuments()}\n`);

console.log('First 10 users:');
allUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.Name} (${u.Email})`);
    console.log(`   Role: ${u.role}, Type: ${u.organizationType}, Verified: ${u.isVerified}`);
});

// Find your blood bank specifically (you've been using this in the session)
const bloodBank = await User.findById('6946ff84e5bb59549eb37464');
if (bloodBank) {
    console.log('\n📍 Your blood bank (ID: 6946ff84e5bb59549eb37464):');
    console.log(`   Name: ${bloodBank.organizationName || bloodBank.Name}`);
    console.log(`   Email: ${bloodBank.Email}`);
    console.log(`   Type: ${bloodBank.organizationType}`);
    console.log(`   Verified: ${bloodBank.isVerified}`);
    console.log(`   Role: ${bloodBank.role}`);
}

await mongoose.connection.close();
