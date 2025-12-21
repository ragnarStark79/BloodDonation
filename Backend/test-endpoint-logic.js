import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const testEndpoint = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));

        // Find blood bank user (look for "raktt" in name)
        const bloodBank = await User.findOne({ Name: /raktt/i }).lean();

        if (!bloodBank) {
            console.log('❌ Blood bank user not found');
            await mongoose.connection.close();
            return;
        }

        console.log(`Testing for blood bank: ${bloodBank.Name}`);
        console.log(`ID: ${bloodBank._id}\n`);

        // Simulate the exact backend logic
        const orgId = bloodBank._id;

        // Step 1: Get inventory counts
        const inventoryCounts = await Blood Unit.aggregate([
            { $match: { organizationId: orgId, status: "AVAILABLE" } },
            { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
        ]);

        console.log('Step 1 - Inventory aggregation:');
        console.log(inventoryCounts);
        console.log('');

        const groupCountMap = {};
        const availableGroups = [];
        inventoryCounts.forEach(item => {
            groupCountMap[item._id] = item.count;
            availableGroups.push(item._id);
        });

        console.log('Available groups:', availableGroups);
        console.log('Group count map:', groupCountMap);
        console.log('');

        if (availableGroups.length === 0) {
            console.log('❌ NO AVAILABLE BLOOD GROUPS - Will return empty array');
            await mongoose.connection.close();
            return;
        }

        // Step 2: Find matching requests
        const requests = await Request.find({
            bloodGroup: { $in: availableGroups },
            status: 'OPEN',
            createdBy: { $ne: orgId }
        }).lean();

        console.log(`Step 2 - Matching requests: ${requests.length}`);
        console.log('');

        if (requests.length === 0) {
            console.log('❌ NO MATCHING REQUESTS FOUND');
            console.log('\nChecking why...\n');

            // Check all OPEN requests
            const allOpen = await Request.find({ status: 'OPEN' }).lean();
            console.log(`Total OPEN requests: ${allOpen.length}`);

            allOpen.forEach(r => {
                const creatorId = r.createdBy?.toString() || 'NOT SET';
                const matchesGroup = availableGroups.includes(r.bloodGroup);
                const isOwn = creatorId === orgId.toString();

                console.log(`\n- ${r.bloodGroup} request:`);
                console.log(`  Creator ID: ${creatorId}`);
                console.log(`  Bank ID: ${orgId}`);
                console.log(`  Matches blood group? ${matchesGroup ? '✅' : '❌'}`);
                console.log(`  Is own request? ${isOwn ? '❌ YES' : '✅ NO'}`);
                console.log(`  Should appear? ${matchesGroup && !isOwn ? '✅ YES' : '❌ NO'}`);
            });
        } else {
            console.log('✅ REQUESTS FOUND:');
            requests.forEach(r => {
                console.log(`- ${r.bloodGroup}: ${r.unitsNeeded} units`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Test complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
};

testEndpoint();
