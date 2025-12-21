import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const debug = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Get models
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Find blood banks
        const bloodBanks = await User.find({
            Role: 'ORGANIZATION',
            organizationType: { $in: ['BANK', 'BOTH'] }
        }).select('Name Email organizationType').lean();

        console.log(`📊 Found ${bloodBanks.length} blood bank(s):\n`);

        for (const bank of bloodBanks) {
            console.log(`🏦 ${bank.Name} (${bank.organizationType})`);
            console.log(`   Email: ${bank.Email}`);
            console.log(`   ID: ${bank._id}\n`);

            // Check inventory
            const units = await BloodUnit.find({ organizationId: bank._id });
            console.log(`   📦 Total inventory: ${units.length} units`);

            if (units.length > 0) {
                // Group by blood group and status
                const byGroup = {};
                units.forEach(unit => {
                    const key = `${unit.bloodGroup}-${unit.status}`;
                    byGroup[key] = (byGroup[key] || 0) + 1;
                });

                console.log('   Breakdown:');
                Object.entries(byGroup).forEach(([key, count]) => {
                    console.log(`     - ${key}: ${count}`);
                });

                // Show available units
                const available = units.filter(u => u.status === 'AVAILABLE');
                console.log(`\n   ✅ AVAILABLE units: ${available.length}`);
                const availByGroup = {};
                available.forEach(u => {
                    availByGroup[u.bloodGroup] = (availByGroup[u.bloodGroup] || 0) + 1;
                });
                Object.entries(availByGroup).forEach(([group, count]) => {
                    console.log(`     - ${group}: ${count} units`);
                });
            }
            console.log('');
        }

        // Check requests
        const requests = await Request.find({ status: 'OPEN' });
        console.log(`\n📋 Found ${requests.length} OPEN request(s):\n`);

        for (const req of requests) {
            console.log(`   Blood Group: ${req.bloodGroup}`);
            console.log(`   Units Needed: ${req.unitsNeeded}`);
            console.log(`   Status: ${req.status}`);
            console.log(`   Component: ${req.component || 'N/A'}`);
            console.log('');
        }

        // Test the aggregation query
        console.log('🔬 Testing aggregation query:\n');
        for (const bank of bloodBanks) {
            console.log(`   For ${bank.Name}:`);
            const inventoryCounts = await BloodUnit.aggregate([
                { $match: { organizationId: bank._id, status: "AVAILABLE" } },
                { $group: { _id: "$bloodGroup", count: { $sum: 1 } } }
            ]);

            console.log('   Aggregation result:');
            inventoryCounts.forEach(item => {
                console.log(`     - ${item._id}: ${item.count} units`);
            });

            const groupCountMap = {};
            inventoryCounts.forEach(item => {
                groupCountMap[item._id] = item.count;
            });

            console.log('\n   Group count map:');
            console.log('   ', groupCountMap);
            console.log('');
        }

        await mongoose.connection.close();
        console.log('✅ Debug complete');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

debug();
