import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/Lifeforce');

const db = mongoose.connection.db;
const usersCollection = db.collection('users');

// Get all unique organizationType values
const types = await usersCollection.distinct('organizationType');
console.log('Unique organizationType values in database:');
console.log(types);

// Show sample users with their types
const samples = await usersCollection.find({}).limit(5).toArray();
console.log('\nSample users:');
samples.forEach(u => {
    console.log(`- ${u.Name}: organizationType="${u.organizationType}", role="${u.role}", verified=${u.isVerified}`);
});

await mongoose.connection.close();
