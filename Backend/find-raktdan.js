import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/test');

const db = mongoose.connection.db;
const users = db.collection('users');

// Search for raktdan
const raktdan = await users.findOne({
    $or: [
        { organizationName: /raktdan/i },
        { Name: /raktdan/i }
    ]
});

if (raktdan) {
    console.log('✅ FOUND YOUR BLOOD BANK: raktdan\n');
    console.log(`ID: ${raktdan._id}`);
    console.log(`Name: ${raktdan.organizationName || raktdan.Name}`);
    console.log(`Email: ${raktdan.Email}`);
    console.log(`Role: ${raktdan.role}`);
    console.log(`Current Type: ${raktdan.organizationType}`);
    console.log(`Verified: ${raktdan.isVerified}`);
    console.log(`City: ${raktdan.City || 'N/A'}`);

    if (raktdan.organizationType === 'HOSPITAL') {
        console.log('\n⚠️  PROBLEM: Type is HOSPITAL, should be BANK');
        console.log('📝 This needs to be changed to BANK for dropdown to work!');
    } else if (raktdan.organizationType === 'BANK') {
        console.log('\n✅ Type is correct: BANK');
    }
} else {
    console.log('❌ "raktdan" not found in test database');
    console.log('\nSearching all accounts...');

    const all = await users.find({ role: 'organization' }).toArray();
    console.log(`\nAll organization accounts in test db (${all.length}):`);
    all.forEach(a => {
        console.log(`- ${a.organizationName || a.Name} (${a.Email})`);
    });
}

await mongoose.connection.close();
