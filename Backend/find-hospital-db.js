import mongoose from 'mongoose';

const databases = ['liforce', 'Lifeforce', 'liforce_db', 'blooddonation', 'Rowblock', 'test'];

for (const dbName of databases) {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const count = await users.countDocuments({ organizationType: 'HOSPITAL' });

    if (count > 0) {
        console.log(`\n✅ DATABASE: ${dbName}`);
        console.log(`   HOSPITAL accounts: ${count}\n`);

        const accounts = await users.find({ organizationType: 'HOSPITAL' }).toArray();
        accounts.forEach(a => {
            console.log(`   Name: ${a.organizationName || a.Name}`);
            console.log(`   Email: ${a.Email}`);
            console.log(`   ID: ${a._id}`);
            console.log('');
        });
    }

    await mongoose.connection.close();
}
