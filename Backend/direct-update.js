import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function directUpdate() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Direct MongoDB update - bypass Mongoose validation
        const db = mongoose.connection.db;
        const donationsCollection = db.collection('donations');

        // Find donations with status "completed"
        const result = await donationsCollection.updateMany(
            { status: 'completed' },
            { $set: { status: 'used' } }
        );

        console.log(`📊 Updated ${result.modifiedCount} donations`);
        console.log(`✅ Changed status from "completed" to "used"`);
        console.log(`\n💡 Refresh browser - READY FOR STORAGE should be empty!`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

directUpdate();
