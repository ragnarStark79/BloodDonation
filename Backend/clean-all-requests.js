import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

// Connect and clear requests
const clearRequests = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get the Request model
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));

        // Count before deletion
        const countBefore = await Request.countDocuments({});
        console.log(`📊 Found ${countBefore} requests in database`);

        // Delete all requests
        console.log('🗑️  Deleting all requests...');
        const result = await Request.deleteMany({});

        console.log(`✅ Successfully deleted ${result.deletedCount} requests`);
        console.log('✨ Database is now clean!');

        await mongoose.connection.close();
        console.log('🔌 Connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

clearRequests();
