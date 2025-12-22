import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/liforce');

const db = mongoose.connection.db;
const users = db.collection('users');

const hospitals = await users.find({ organizationType: 'HOSPITAL' }).toArray();

console.log(`Found ${hospitals.length} account(s) with type HOSPITAL:\n`);

hospitals.forEach((h, i) => {
    console.log(`--- Account ${i + 1} ---`);
    console.log(`Name: ${h.organizationName || h.Name || 'N/A'}`);
    console.log(`Email: ${h.Email || 'N/A'}`);
    console.log(`ID: ${h._id}`);
    console.log(`Type: ${h.organizationType}`);
    console.log(`Verified: ${h.isVerified}`);
    console.log('');
});

await mongoose.connection.close();
