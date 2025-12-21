import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const checkRequest = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));

        // Find all requests
        const requests = await Request.find({}).populate('createdBy').populate('organizationId').lean();
        console.log(`📋 Total requests in database: ${requests.length}\n`);

        if (requests.length === 0) {
            console.log('❌ NO REQUESTS FOUND!\n');
            console.log('The request creation might have failed.');
            await mongoose.connection.close();
            return;
        }

        requests.forEach((req, idx) => {
            console.log(`${idx + 1}. Request Details:`);
            console.log(`   Blood Group: ${req.bloodGroup}`);
            console.log(`   Units Needed: ${req.unitsNeeded}`);
            console.log(`   Status: ${req.status}`);
            console.log(`   Urgency: ${req.urgency || 'N/A'}`);
            console.log(`   Created By ID: ${req.createdBy?._id || req.organizationId?._id || 'NOT SET'}`);
            console.log(`   Created By Name: ${req.createdBy?.Name || req.organizationId?.Name || 'NOT SET'}`);
            console.log(`   Created By Role: ${req.createdBy?.Role || req.organizationId?.Role || 'NOT SET'}`);
            console.log(`   Created By Org Type: ${req.createdBy?.organizationType || req.organizationId?.organizationType || 'NOT SET'}`);
            console.log('');
        });

        // Find blood bank users
        const bloodBanks = await User.find({
            $or: [
                { Role: 'ORGANIZATION', organizationType: { $in: ['BANK', 'BOTH'] } },
                { Role: 'bloodbank' }
            ]
        }).lean();

        console.log(`\n🏦 Blood Bank users: ${bloodBanks.length}\n`);

        for (const bank of bloodBanks) {
            console.log(`📍 ${bank.Name}`);
            console.log(`   ID: ${bank._id}`);
            console.log(`   Email: ${bank.Email}`);
            console.log(`   Role: ${bank.Role}`);
            console.log(`   Org Type: ${bank.organizationType || 'N/A'}`);

            // Check inventory
            const units = await BloodUnit.find({ organizationId: bank._id, status: 'AVAILABLE' });
            console.log(`   📦 Available Units: ${units.length}`);

            const byGroup = {};
            units.forEach(u => {
                byGroup[u.bloodGroup] = (byGroup[u.bloodGroup] || 0) + 1;
            });
            Object.entries(byGroup).forEach(([group, count]) => {
                console.log(`      - ${group}: ${count}`);
            });

            // Check which requests this bank should see
            console.log(`\n   📋 Should see these requests:`);
            const openRequests = requests.filter(r => r.status === 'OPEN');
            openRequests.forEach(req => {
                const creatorId = req.createdBy?._id?.toString() || req.organizationId?._id?.toString();
                const isOwnRequest = creatorId === bank._id.toString();
                const hasBloodGroup = Object.keys(byGroup).includes(req.bloodGroup);
                const shouldSee = !isOwnRequest && hasBloodGroup;

                console.log(`      ${req.bloodGroup} (${req.unitsNeeded} units):`);
                console.log(`         - Own request? ${isOwnRequest ? '❌ YES (filtered out)' : '✅ NO'}`);
                console.log(`         - Has ${req.bloodGroup}? ${hasBloodGroup ? '✅ YES' : '❌ NO'}`);
                console.log(`         - Should see? ${shouldSee ? '✅ YES' : '❌ NO'}`);
            });

            console.log('\n');
        }

        await mongoose.connection.close();
        console.log('✅ Check complete');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkRequest();
