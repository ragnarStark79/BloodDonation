import mongoose from 'mongoose';

// Connect to MongoDB without specifying database
await mongoose.connect('mongodb://localhost:27017/');

// List all databases
const admin = mongoose.connection.db.admin();
const dbs = await admin.listDatabases();

console.log('Available databases:');
dbs.databases.forEach((db, i) => {
    console.log(`${i + 1}. ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
});

await mongoose.connection.close();
