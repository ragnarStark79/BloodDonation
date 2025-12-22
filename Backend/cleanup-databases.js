import mongoose from 'mongoose';

// Databases to remove (empty or unused)
const databasesToRemove = [
    'liforce',        // empty (0 users)
    'liforce_db',     // empty (0 users)  
    'blooddonation',  // empty (0 users)
    'blood-donation'  // empty (0 users)
];

console.log('⚠️  WARNING: This will DELETE the following databases:');
databasesToRemove.forEach(db => console.log(`   - ${db}`));
console.log('\n✅ Keeping: Lifeforce (your active database)\n');

for (const dbName of databasesToRemove) {
    try {
        await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

        console.log(`🗑️  Dropping database: ${dbName}`);
        await mongoose.connection.dropDatabase();
        console.log(`✅ ${dbName} deleted`);

        await mongoose.connection.close();
    } catch (error) {
        console.error(`❌ Failed to delete ${dbName}:`, error.message);
    }
}

console.log('\n✅ Cleanup complete!');
console.log('Your data in "Lifeforce" is safe.');
