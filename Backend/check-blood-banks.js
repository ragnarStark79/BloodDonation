import mongoose from 'mongoose';
import User from './modules/User.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

console.log('🔍 Checking blood banks in database...\n');

// Check all organizations
const allOrgs = await User.find({
    role: 'organization'
}).select('organizationName Name organizationType isVerified City').lean();

console.log(`Total organizations: ${allOrgs.length}\n`);

allOrgs.forEach((org, i) => {
    console.log(`${i + 1}. ${org.organizationName || org.Name}`);
    console.log(`   Type: ${org.organizationType}`);
    console.log(`   Verified: ${org.isVerified}`);
    console.log(`   City: ${org.City || 'N/A'}`);
    console.log('');
});

// Check specifically for blood banks
const bloodBanks = await User.find({
    organizationType: 'BANK',
    isVerified: true
}).lean();

console.log(`\n✅ Verified BANK type organizations: ${bloodBanks.length}`);

if (bloodBanks.length === 0) {
    console.log('\n⚠️  NO BLOOD BANKS FOUND!');
    console.log('Possible reasons:');
    console.log('1. organizationType is not "BANK" (might be "BLOOD_BANK" or something else)');
    console.log('2. isVerified is false');
    console.log('3. No blood banks exist in database');
}

await mongoose.connection.close();
