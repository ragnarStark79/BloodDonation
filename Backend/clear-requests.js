import mongoose from 'mongoose';
import { env } from './config/env.js';

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Clear all blood requests
const clearAllRequests = async () => {
    try {
        await connectDB();

        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));

        const result = await Request.deleteMany({});

        console.log(`🗑️  Deleted ${result.deletedCount} blood requests`);
        console.log('✅ Database cleaned successfully!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing requests:', error);
        process.exit(1);
    }
};

clearAllRequests();
