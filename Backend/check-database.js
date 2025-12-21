import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const checkAll = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));

        // Get ALL users
        const allUsers = await User.find({}).select('Name Email Role organizationType').lean();
        console.log(`👥 Total users in database: ${allUsers.length}\n`);

        // Group by role
        const byRole = {};
        allUsers.forEach(u => {
            const role = u.Role || 'NO_ROLE';
            byRole[role] = (byRole[role] || 0) + 1;
        });

        console.log('📊 Users by Role:');
        Object.entries(byRole).forEach(([role, count]) => {
            console.log(`   ${role}: ${count}`);
        });
        console.log('');

        // Show organizations
        const orgs = allUsers.filter(u => u.Role === 'ORGANIZATION' || u.Role === 'hospital' || u.Role === 'bloodbank');
        console.log(`🏢 Organizations (${orgs.length}):\n`);
        orgs.forEach(org => {
            console.log(`   📍 ${org.Name}`);
            console.log(`      Email: ${org.Email}`);
            console.log(`      Role: ${org.Role}`);
            console.log(`      Org Type: ${org.organizationType || 'NOT SET'}`);
            console.log(`      ID: ${org._id}`);
            console.log('');
        });

        // Check ALL blood units
        const allUnits = await BloodUnit.find({});
        console.log(`\n📦 Total blood units in database: ${allUnits.length}\n`);

        if (allUnits.length > 0) {
            // Group by organization
            const byOrg = {};
            allUnits.forEach(u => {
                const orgId = u.organizationId?.toString() || 'NO_ORG';
                byOrg[orgId] = (byOrg[orgId] || 0) + 1;
            });

            for (const [orgId, count] of Object.entries(byOrg)) {
                const org = allUsers.find(u => u._id.toString() === orgId);
                console.log(`   🏦 ${org ? org.Name : orgId}: ${count} units`);

                const orgUnits = allUnits.filter(u => u.organizationId?.toString() === orgId);
                const byGroupStatus = {};
                orgUnits.forEach(u => {
                    const key = `${u.bloodGroup || 'UNKNOWN'} (${u.status || 'NO_STATUS'})`;
                    byGroupStatus[key] = (byGroupStatus[key] || 0) + 1;
                });

                Object.entries(byGroupStatus).forEach(([key, cnt]) => {
                    console.log(`      - ${key}: ${cnt}`);
                });
                console.log('');
            }
        }

        // Check requests
        const allRequests = await Request.find({});
        console.log(`\n📋 Total requests in database: ${allRequests.length}\n`);

        if (allRequests.length > 0) {
            allRequests.forEach((req, idx) => {
                const creator = allUsers.find(u => u._id.toString() === req.createdBy?.toString() || u._id.toString() === req.organizationId?.toString());
                console.log(`   ${idx + 1}. ${req.bloodGroup} - ${req.unitsNeeded} unit(s)`);
                console.log(`      Status: ${req.status}`);
                console.log(`      Component: ${req.component || 'N/A'}`);
                console.log(`      Created by: ${creator ? creator.Name : 'Unknown'}`);
                console.log('');
            });
        }

        await mongoose.connection.close();
        console.log('✅ Complete');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkAll();
