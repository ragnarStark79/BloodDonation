import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BloodUnit from './modules/BloodUnit.js';
import Request from './modules/Request.js';
import User from './modules/User.js';

dotenv.config();

async function quickCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce');

        // Count blood banks
        const bloodBankCount = await User.countDocuments({
            Role: 'ORGANIZATION',
            organizationType: { $in: ['BANK', 'BOTH'] }
        });

        // Count hospitals
        const hospitalCount = await User.countDocuments({
            Role: 'ORGANIZATION',
            organizationType: { $in: ['HOSPITAL', 'BOTH'] }
        });

        // Count available inventory
        const inventoryCount = await BloodUnit.countDocuments({ status: 'AVAILABLE' });

        // Count OPEN requests
        const openRequestsCount = await Request.countDocuments({ status: 'OPEN' });

        console.log('\n=== QUICK CHECK ===');
        console.log(`Blood Banks: ${bloodBankCount}`);
        console.log(`Hospitals: ${hospitalCount}`);
        console.log(`Available Inventory: ${inventoryCount} units`);
        console.log(`OPEN Requests: ${openRequestsCount}`);

        if (bloodBankCount === 0) {
            console.log('\n❌ NO BLOOD BANKS FOUND!');
            console.log('   Create a blood bank user with organizationType: "BANK" or "BOTH"');
        }

        if (inventoryCount === 0) {
            console.log('\n❌ NO INVENTORY FOUND!');
            console.log('   Add blood units to the blood bank inventory');
        }

        if (openRequestsCount === 0) {
            console.log('\n❌ NO OPEN REQUESTS FOUND!');
            console.log('   Create blood requests from a hospital');
        }

        if (hospitalCount === 0) {
            console.log('\n⚠️  NO HOSPITALS FOUND!');
            console.log('   Create a hospital user with organizationType: "HOSPITAL" or "BOTH"');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

quickCheck();
