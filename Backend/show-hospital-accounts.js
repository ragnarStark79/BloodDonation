import mongoose from 'mongoose';

const dbs = ['liforce', 'Lifeforce', 'liforce_db', 'blooddonation', 'blood-donation', 'Rowblock', 'test'];

console.log('🔍 Finding blood bank accounts with wrong type...\n');

for (const dbName of dbs) {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Find HOSPITAL type organizations
    const hospitals = await users.find({ organizationType: 'HOSPITAL' }).toArray();

    if (hospitals.length > 0) {
        console.log(`✅ DATABASE: ${dbName}`);
        console.log(`Found ${hospitals.length} HOSPITAL type accounts:\n`);

        hospitals.forEach(h => {
            console.log(`ID: ${h._id}`);
            console.log(`Name: ${h.organizationName || h.Name}`);
            console.log(`Email: ${h.Email}`);
            console.log(`Current Type: ${h.organizationType}`);
            console.log(`Verified: ${h.isVerified}`);
            console.log('');
        });

        console.log('\n📝 Which accounts should be BANK type?');
        console.log('   (If this is your blood bank, we need to change it!)');
    }

    await mongoose.connection.close();
}
