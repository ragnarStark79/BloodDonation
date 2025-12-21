import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const diagnoseIssue = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));

        // Find the blood bank user (logged in as "rakttdan")
        console.log('🔍 Looking for blood bank user...\n');
        const bloodBank = await User.findOne({
            Name: { $regex: /raktt/i }
        }).lean();

        if (!bloodBank) {
            console.log('❌ Could not find user with name matching "raktt"');
            console.log('\n📋 All users:');
            const allUsers = await User.find({}).select('Name Email Role organizationType').lean();
            allUsers.forEach(u => {
                console.log(`   - ${u.Name} (${u.Email}) - ${u.Role} - ${u.organizationType || 'N/A'}`);
            });
            await mongoose.connection.close();
            return;
        }

        console.log(`✅ Found blood bank user:`);
        console.log(`   Name: ${bloodBank.Name}`);
        console.log(`   Email: ${bloodBank.Email}`);
        console.log(`   Role: ${bloodBank.Role}`);
        console.log(`   Org Type: ${bloodBank.organizationType || 'NOT SET'}`);
        console.log(`   User ID: ${bloodBank._id}`);
        console.log('');

        // Check blood units for this user
        console.log(`📦 Checking blood units for this organization...\n`);
        const myUnits = await BloodUnit.find({ organizationId: bloodBank._id });
        console.log(`   Total units: ${myUnits.length}`);

        if (myUnits.length === 0) {
            console.log('\n   ❌ NO BLOOD UNITS FOUND FOR THIS USER!\n');
            console.log('   🔍 Checking all blood units in database:\n');

            const allUnits = await BloodUnit.find({}).limit(10);
            for (const unit of allUnits) {
                const owner = await User.findById(unit.organizationId).select('Name').lean();
                console.log(`   - ${unit.bloodGroup} (${unit.status})`);
                console.log(`     Owner ID: ${unit.organizationId}`);
                console.log(`     Owner Name: ${owner ? owner.Name : 'NOT FOUND'}`);
                console.log('');
            }
        } else {
            const byGroupStatus = {};
            myUnits.forEach(u => {
                const key = `${u.bloodGroup || 'UNKNOWN'} - ${u.status || 'NO_STATUS'}`;
                byGroupStatus[key] = (byGroupStatus[key] || 0) + 1;
            });

            console.log('   Breakdown:');
            Object.entries(byGroupStatus).forEach(([key, count]) => {
                console.log(`     ${key}: ${count}`);
            });

            // Count AVAILABLE units by blood group
            const availableUnits = myUnits.filter(u => u.status === 'AVAILABLE');
            console.log(`\n   ✅ AVAILABLE units: ${availableUnits.length}`);

            const availByGroup = {};
            availableUnits.forEach(u => {
                availByGroup[u.bloodGroup] = (availByGroup[u.bloodGroup] || 0) + 1;
            });

            Object.entries(availByGroup).forEach(([group, count]) => {
                console.log(`     - ${group}: ${count} units`);
            });
        }

        // Check the A+ request
        console.log(`\n\n📋 Checking A+ request...\n`);
        const aplusRequest = await Request.findOne({
            bloodGroup: 'A+',
            status: 'OPEN'
        }).populate('createdBy').lean();

        if (aplusRequest) {
            console.log(`   ✅ Found A+ request:`);
            console.log(`     Units Needed: ${aplusRequest.unitsNeeded}`);
            console.log(`     Status: ${aplusRequest.status}`);
            console.log(`     Created By: ${aplusRequest.createdBy?.Name || 'Unknown'}`);
            console.log(`     Creator ID: ${aplusRequest.createdBy?._id}`);
            console.log(`     Blood Bank ID: ${bloodBank._id}`);
            console.log(`     Same user?: ${aplusRequest.createdBy?._id?.toString() === bloodBank._id.toString() ? 'YES (should be filtered out!)' : 'NO (should appear)'}`);
        } else {
            console.log('   ❌ No A+ OPEN request found');
        }

        // Simulate the aggregation query
        console.log(`\n\n🔬 Simulating backend aggregation query...\n`);
        const inventoryCounts = await BloodUnit.aggregate([
            { $match: { organizationId: bloodBank._id, status: "AVAILABLE" } },
            { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
        ]);

        console.log('   Aggregation result:');
        if (inventoryCounts.length === 0) {
            console.log('     ❌ NO RESULTS! (This is the problem!)');
        } else {
            inventoryCounts.forEach(item => {
                console.log(`     - ${item._id}: ${item.count} units`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Diagnosis complete');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

diagnoseIssue();
