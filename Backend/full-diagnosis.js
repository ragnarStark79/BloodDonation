import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const fullDiagnosis = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));
        const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false }));

        console.log('='.repeat(60));
        console.log('FULL DIAGNOSIS - WHY INCOMING REQUESTS IS EMPTY');
        console.log('='.repeat(60) + '\n');

        // 1. Find all users
        const allUsers = await User.find({}).select('Name Email Role organizationType _id').lean();
        console.log('👥 ALL USERS IN DATABASE:\n');
        allUsers.forEach((u, idx) => {
            console.log(`${idx + 1}. ${u.Name}`);
            console.log(`   Email: ${u.Email}`);
            console.log(`   Role: ${u.Role}`);
            console.log(`   Org Type: ${u.organizationType || 'N/A'}`);
            console.log(`   ID: ${u._id}\n`);
        });

        // 2. Find A+ OPEN requests
        console.log('\n' + '='.repeat(60));
        console.log('📋 A+ OPEN REQUESTS:');
        console.log('='.repeat(60) + '\n');

        const aplusOpen = await Request.find({ bloodGroup: 'A+', status: 'OPEN' }).lean();
        console.log(`Found: ${aplusOpen.length} A+ OPEN request(s)\n`);

        if (aplusOpen.length === 0) {
            console.log('❌ NO A+ OPEN REQUESTS FOUND!\n');
            console.log('Checking all requests...\n');
            const allReqs = await Request.find({}).lean();
            allReqs.forEach(r => {
                console.log(`- ${r.bloodGroup} (${r.status}) - Created by: ${r.createdBy || r.organizationId}`);
            });
        } else {
            aplusOpen.forEach((req, idx) => {
                console.log(`Request ${idx + 1}:`);
                console.log(`   Blood Group: ${req.bloodGroup}`);
                console.log(`   Units: ${req.unitsNeeded}`);
                console.log(`   Status: ${req.status}`);
                console.log(`   Created By ID: ${req.createdBy || req.organizationId}`);

                const creator = allUsers.find(u =>
                    u._id.toString() === (req.createdBy?.toString() || req.organizationId?.toString())
                );
                console.log(`   Creator Name: ${creator ? creator.Name : 'NOT FOUND'}`);
                console.log(`   Creator Role: ${creator ? creator.Role : 'N/A'}`);
                console.log('');
            });
        }

        // 3. Find blood bank and their inventory
        console.log('\n' + '='.repeat(60));
        console.log('🏦 BLOOD BANKS AND THEIR INVENTORY:');
        console.log('='.repeat(60) + '\n');

        const bloodBanks = allUsers.filter(u =>
            u.organizationType === 'BANK' || u.organizationType === 'BOTH' ||
            u.Role === 'bloodbank'
        );

        console.log(`Found: ${bloodBanks.length} blood bank(s)\n`);

        for (const bank of bloodBanks) {
            console.log(`🏦 ${bank.Name} (ID: ${bank._id})`);

            // Get inventory
            const inventory = await BloodUnit.find({
                organizationId: bank._id,
                status: 'AVAILABLE'
            }).lean();

            console.log(`   📦 AVAILABLE inventory: ${inventory.length} units`);

            const byGroup = {};
            inventory.forEach(u => {
                byGroup[u.bloodGroup] = (byGroup[u.bloodGroup] || 0) + 1;
            });

            if (Object.keys(byGroup).length > 0) {
                console.log('   By blood group:');
                Object.entries(byGroup).forEach(([group, count]) => {
                    console.log(`      - ${group}: ${count} units`);
                });
            } else {
                console.log('   ❌ NO AVAILABLE UNITS!');
            }

            // Check what they should see
            console.log('\n   🔍 SHOULD THIS BANK SEE A+ REQUESTS?');
            console.log(`   - Has A+ in inventory? ${byGroup['A+'] ? '✅ YES (' + byGroup['A+'] + ' units)' : '❌ NO'}`);

            if (aplusOpen.length > 0) {
                const req = aplusOpen[0];
                const creatorId = (req.createdBy || req.organizationId)?.toString();
                const isOwnRequest = creatorId === bank._id.toString();
                console.log(`   - Is own request? ${isOwnRequest ? '❌ YES (will be filtered out)' : '✅ NO'}`);
                console.log(`   - Request creator ID: ${creatorId}`);
                console.log(`   - Blood bank ID: ${bank._id}`);
            }

            console.log('\n');
        }

        await mongoose.connection.close();
        console.log('='.repeat(60));
        console.log('DIAGNOSIS COMPLETE');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

fullDiagnosis();
