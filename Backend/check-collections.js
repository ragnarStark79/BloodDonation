import mongoose from 'mongoose';

// Connect
await mongoose.connect('mongodb://localhost:27017/liforce');
console.log('🔌 Connected\n');

// Check all possible collections
const collections = await mongoose.connection.db.listCollections().toArray();
console.log('📂 All collections in database:');
collections.forEach(c => console.log(`  - ${c.name}`));

// Check bloodunits collection specifically
const bloodunitsCount = await mongoose.connection.collection('bloodunits').countDocuments();
console.log(`\n🩸 bloodunits collection: ${bloodunitsCount} documents`);

// Check if there's a BloodUnit with capital letters
const BloodUnitCount = await mongoose.connection.db.collection('BloodUnit').countDocuments().catch(() => 0);
console.log(`🩸 BloodUnit collection (capital): ${BloodUnitCount} documents`);

// List all possible blood-related collections
const bloodCollections = collections.filter(c => c.name.toLowerCase().includes('blood'));
console.log(`\n🔍 Blood-related collections:`);
for (const col of bloodCollections) {
    const count = await mongoose.connection.collection(col.name).countDocuments();
    console.log(`  - ${col.name}: ${count} documents`);
}

await mongoose.connection.close();
