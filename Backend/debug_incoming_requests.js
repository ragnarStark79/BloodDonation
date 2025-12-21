import mongoose from 'mongoose';
import dotenv from 'dotenv';
import BloodUnit from './modules/BloodUnit.js';
import Request from './modules/Request.js';
import User from './modules/User.js';
import { REQUEST_STATUS } from './config/constants.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function debugIncomingRequests() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Find all blood banks
        console.log('=== BLOOD BANKS ===');
        const bloodBanks = await User.find({
            Role: 'ORGANIZATION',
            organizationType: { $in: ['BANK', 'BOTH'] }
        }).select('_id Name organizationName organizationType City').lean();

        console.log(`Found ${bloodBanks.length} blood banks:`);
        bloodBanks.forEach(bb => {
            console.log(`  - ${bb.organizationName || bb.Name} (${bb.organizationType}) - ID: ${bb._id}`);
        });

        if (bloodBanks.length === 0) {
            console.log('❌ No blood banks found! Create a blood bank user first.\n');
            return;
        }

        const testBloodBank = bloodBanks[0];
        console.log(`\n📍 Testing with: ${testBloodBank.organizationName || testBloodBank.Name}\n`);

        // 2. Check blood bank's inventory
        console.log('=== BLOOD BANK INVENTORY ===');
        const inventory = await BloodUnit.find({
            organizationId: testBloodBank._id,
            status: 'AVAILABLE'
        }).select('bloodGroup component status').lean();

        console.log(`Total AVAILABLE units: ${inventory.length}`);

        const inventoryCounts = {};
        inventory.forEach(unit => {
            inventoryCounts[unit.bloodGroup] = (inventoryCounts[unit.bloodGroup] || 0) + 1;
        });

        console.log('Inventory by blood group:');
        Object.entries(inventoryCounts).forEach(([group, count]) => {
            console.log(`  ${group}: ${count} units`);
        });

        const availableGroups = Object.keys(inventoryCounts);
        console.log(`\nAvailable blood groups: ${availableGroups.join(', ')}`);

        if (availableGroups.length === 0) {
            console.log('❌ No AVAILABLE inventory! Add blood units first.\n');
            return;
        }

        // 3. Check OPEN requests
        console.log('\n=== ALL OPEN REQUESTS ===');
        const allOpenRequests = await Request.find({
            status: REQUEST_STATUS.OPEN
        }).populate('createdBy', 'Name organizationName organizationType').lean();

        console.log(`Total OPEN requests: ${allOpenRequests.length}`);
        allOpenRequests.forEach((req, idx) => {
            console.log(`\n  Request ${idx + 1}:`);
            console.log(`    Blood Group: ${req.bloodGroup}`);
            console.log(`    Units Needed: ${req.unitsNeeded}`);
            console.log(`    Urgency: ${req.urgency}`);
            console.log(`    Created By: ${req.createdBy?.organizationName || req.createdBy?.Name} (${req.createdBy?._id})`);
            console.log(`    Status: ${req.status}`);
        });

        // 4. Check matching requests
        console.log('\n=== MATCHING INCOMING REQUESTS ===');
        const matchingRequests = await Request.find({
            bloodGroup: { $in: availableGroups },
            status: REQUEST_STATUS.OPEN,
            createdBy: { $ne: testBloodBank._id }
        }).populate('createdBy', 'Name organizationName').lean();

        console.log(`Matching requests for blood bank: ${matchingRequests.length}`);

        if (matchingRequests.length === 0) {
            console.log('\n❌ NO MATCHING REQUESTS FOUND!');
            console.log('\nPossible reasons:');
            console.log('  1. All OPEN requests are created by this blood bank itself');
            console.log('  2. No OPEN requests match available blood groups');
            console.log('  3. No OPEN requests exist in the database');

            // Check if blood bank created requests
            const ownRequests = await Request.find({
                createdBy: testBloodBank._id,
                status: REQUEST_STATUS.OPEN
            }).lean();

            if (ownRequests.length > 0) {
                console.log(`\n⚠️  This blood bank has ${ownRequests.length} OPEN requests (excluded from incoming)`);
            }
        } else {
            matchingRequests.forEach((req, idx) => {
                const availableUnits = inventoryCounts[req.bloodGroup] || 0;
                const canFulfill = availableUnits >= req.unitsNeeded;

                console.log(`\n  Match ${idx + 1}:`);
                console.log(`    Blood Group: ${req.bloodGroup}`);
                console.log(`    Units Needed: ${req.unitsNeeded}`);
                console.log(`    Available: ${availableUnits} units`);
                console.log(`    Can Fulfill: ${canFulfill ? '✅ YES' : '❌ NO'}`);
                console.log(`    Hospital: ${req.createdBy?.organizationName || req.createdBy?.Name}`);
                console.log(`    Urgency: ${req.urgency}`);
            });
        }

        // 5. Summary
        console.log('\n=== SUMMARY ===');
        console.log(`Blood Banks: ${bloodBanks.length}`);
        console.log(`Available Inventory: ${inventory.length} units in ${availableGroups.length} blood groups`);
        console.log(`Total OPEN Requests: ${allOpenRequests.length}`);
        console.log(`Matching Incoming Requests: ${matchingRequests.length}`);

        if (matchingRequests.length === 0) {
            console.log('\n💡 TO FIX:');
            console.log('   1. Create a Hospital user (organizationType: "HOSPITAL")');
            console.log('   2. Login as Hospital and create blood requests');
            console.log('   3. Ensure requests match blood groups in blood bank inventory');
            console.log('   4. Ensure request status is "OPEN"');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

debugIncomingRequests();
