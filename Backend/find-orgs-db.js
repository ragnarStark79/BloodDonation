import mongoose from 'mongoose';

const dbs = ['Lifeforce', 'liforce', 'liforce_db', 'blooddonation', 'Rowblock', 'test'];

for (const dbName of dbs) {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

    const db = mongoose.connection.db;
    const users = db.collection('users');

    // Check for organization users
    const orgs = await users.find({ role: 'organization' }).limit(3).toArray();

    if (orgs.length > 0) {
        console.log(`\n✅ DATABASE: ${dbName}`);
        console.log(`   Organizations found: ${orgs.length}`);
        orgs.forEach(o => {
            console.log(`   - ${o.organizationName || o.Name}: ${o.organizationType}, verified=${o.isVerified}`);
        });
    }

    await mongoose.connection.close();
}
