import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const simpleCheck = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));

        // Count requests
        const count = await Request.countDocuments({});
        console.log(`📋 Total requests: ${count}\n`);

        if (count === 0) {
            console.log('❌ NO REQUESTS IN DATABASE!\n');
            console.log('   The hospital request creation failed or was not saved.\n');
            await mongoose.connection.close();
            return;
        }

        // Show all requests
        const requests = await Request.find({}).lean();
        console.log('Request details:\n');

        for (const req of requests) {
            console.log(`Blood Group: ${req.bloodGroup}`);
            console.log(`Units: ${req.unitsNeeded}`);
            console.log(`Status: ${req.status}`);
            console.log(`Created By ID: ${req.createdBy || req.organizationId}`);

            // Find creator
            const creator = await User.findById(req.createdBy || req.organizationId).select('Name Role organizationType').lean();
            if (creator) {
                console.log(`Creator: ${creator.Name} (${creator.Role}, ${creator.organizationType || 'N/A'})`);
            }
            console.log('');
        }

        // Count blood banks
        const banks = await User.countDocuments({
            organizationType: { $in: ['BANK', 'BOTH'] }
        });
        console.log(`\n🏦 Blood banks in system: ${banks}`);

        // Count AVAILABLE blood units
        const availUnits = await BloodUnit.countDocuments({ status: 'AVAILABLE' });
        console.log(`📦 AVAILABLE blood units: ${availUnits}`);

        await mongoose.connection.close();
        console.log('\n✅ Done');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

simpleCheck();
