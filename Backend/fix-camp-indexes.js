import mongoose from 'mongoose';
import Camp from './modules/Camp.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';

async function fixCampIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Dropping old camp indexes...');
        await Camp.collection.dropIndexes();
        console.log('✅ Old indexes dropped');

        console.log('🔨 Creating new geospatial index...');
        await Camp.collection.createIndex({ "location.coordinates.coordinates": "2dsphere" });
        console.log('✅ New 2dsphere index created on location.coordinates.coordinates');

        console.log('📊 Current indexes:');
        const indexes = await Camp.collection.indexes();
        console.log(JSON.stringify(indexes, null, 2));

        console.log('\n✅ Camp indexes fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing camp indexes:', error);
        process.exit(1);
    }
}

fixCampIndexes();
