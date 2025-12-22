import mongoose from 'mongoose';
import { env } from './Backend/config/env.js'; // Adjust path if needed
import User from './Backend/modules/User.js';
import Hospital from './Backend/modules/Hospital.js';
import dotenv from 'dotenv';
dotenv.config({ path: './Backend/.env' });

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/BloodDonation");

        const userIndexes = await User.collection.getIndexes();

        const hospitalIndexes = await Hospital.collection.getIndexes();

        mongoose.disconnect();
    } catch (err) {
        console.error("Index Check Error:", err);
    }
};

checkIndexes();
