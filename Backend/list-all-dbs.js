import mongoose from 'mongoose';

await mongoose.connect('mongodb://localhost:27017/');

const admin = mongoose.connection.db.admin();
const dbs = await admin.listDatabases();

console.log('ALL MongoDB databases:\n');
dbs.databases.forEach((db, i) => {
    const sizeMB = (db.sizeOnDisk / 1024 / 1024).toFixed(2);
    console.log(`${i + 1}. ${db.name.padEnd(20)} - ${sizeMB} MB`);
});

await mongoose.connection.close();

console.log('\n📍 Server is currently using: liforce');
console.log('✅ We need to find which database has your blood bank account!');
