import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const targetId = '6946ff84e5bb59549eb37464';
const dbs = ['Lifeforce', 'liforce', 'liforce_db', 'blooddonation', 'Rowblock', 'test'];

console.log(`🔍 Searching for user ID: ${targetId}\n`);

for (const dbName of dbs) {
    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

    const db = mongoose.connection.db;
    const users = db.collection('users');

    const user = await users.findOne({ _id: new ObjectId(targetId) });

    if (user) {
        console.log(`✅ FOUND IN DATABASE: ${dbName}\n`);
        console.log(`Name: ${user.organizationName || user.Name}`);
        console.log(`Email: ${user.Email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Type: ${user.organizationType}`);
        console.log(`Verified: ${user.isVerified}`);

        await mongoose.connection.close();
        process.exit(0);
    }

    await mongoose.connection.close();
}

console.log('❌ User not found in any database!');
