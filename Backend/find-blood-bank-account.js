import mongoose from 'mongoose';

const dbs = ['liforce', 'Lifeforce', 'liforce_db', 'blooddonation', 'blood-donation', 'Rowblock', 'test'];

console.log('🔍 Searching for THE blood bank account...\n');

for (const dbName of dbs) {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Search for ANY organization account
    const orgUsers = await users.find({
        $or: [
            { role: 'organization' },
            { organizationType: { $exists: true } }
        ]
    }).toArray();

    if (orgUsers.length > 0) {
        console.log(`✅ FOUND IN: ${dbName}`);
        orgUsers.forEach(u => {
            console.log(`   ID: ${u._id}`);
            console.log(`   Name: ${u.organizationName || u.Name}`);
            console.log(`   Email: ${u.Email}`);
            console.log(`   Role: ${u.role}`);
            console.log(`   Type: ${u.organizationType}`);
            console.log(`   Verified: ${u.isVerified}`);
            console.log('');
        });
    }

    await mongoose.connection.close();
}

console.log('✅ Search complete!');
