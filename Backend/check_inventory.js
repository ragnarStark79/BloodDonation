import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BloodUnit from './modules/BloodUnit.js';
import User from './modules/User.js';

dotenv.config();

async function checkInventory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce');

        const bloodBankId = '6946ff84e5bb59549eb37464';
        console.log('\n=== CHECKING INVENTORY ===');
        console.log('Blood Bank ID:', bloodBankId);

        // Check if blood bank exists
        const bloodBank = await User.findById(bloodBankId).lean();
        console.log('\nBlood Bank:', bloodBank?.organizationName || bloodBank?.Name);
        console.log('Organization Type:', bloodBank?.organizationType);

        // Check all inventory for this org (any status)
        const allInventory = await BloodUnit.find({
            organizationId: bloodBankId
        }).lean();

        console.log('\n--- ALL INVENTORY ---');
        console.log('Total units:', allInventory.length);
        allInventory.forEach((unit, idx) => {
            console.log(`  ${idx + 1}. ${unit.bloodGroup} - ${unit.status} - ${unit.component || 'WB'}`);
        });

        // Check AVAILABLE inventory
        const availableInventory = await BloodUnit.find({
            organizationId: bloodBankId,
            status: 'AVAILABLE'
        }).lean();

        console.log('\n--- AVAILABLE INVENTORY ---');
        console.log('Available units:', availableInventory.length);
        availableInventory.forEach((unit, idx) => {
            console.log(`  ${idx + 1}. ${unit.bloodGroup} - ${unit.component || 'WB'} - Barcode: ${unit.barcode || 'N/A'}`);
        });

        // Try aggregate query (same as endpoint)
        const inventoryCounts = await BloodUnit.aggregate([
            {
                $match: {
                    organizationId: bloodBankId,
                    status: "AVAILABLE"
                }
            },
            {
                $group: {
                    _id: "$bloodGroup",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n--- AGGREGATE QUERY RESULT ---');
        console.log('Groups found:', inventoryCounts.length);
        inventoryCounts.forEach(item => {
            console.log(`  ${item._id}: ${item.count} units`);
        });

        // Check if organizationId is stored as ObjectId or string
        const sampleUnit = await BloodUnit.findOne({}).lean();
        if (sampleUnit) {
            console.log('\n--- SAMPLE UNIT ---');
            console.log('organizationId type:', typeof sampleUnit.organizationId);
            console.log('organizationId value:', sampleUnit.organizationId);
            console.log('Is ObjectId?:', sampleUnit.organizationId instanceof mongoose.Types.ObjectId);
        }

        // Try with ObjectId conversion
        const inventoryWithObjectId = await BloodUnit.find({
            organizationId: new mongoose.Types.ObjectId(bloodBankId),
            status: 'AVAILABLE'
        }).lean();

        console.log('\n--- WITH OBJECTID CONVERSION ---');
        console.log('Available units:', inventoryWithObjectId.length);

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        await mongoose.connection.close();
    }
}

checkInventory();
