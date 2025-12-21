import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const resetRequest = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));

        // Find A+ requests
        const aplusRequests = await Request.find({ bloodGroup: 'A+' });
        console.log(`📋 Found ${aplusRequests.length} A+ request(s)\n`);

        if (aplusRequests.length === 0) {
            console.log('❌ No A+ requests found. You need to create a new one.\n');
            await mongoose.connection.close();
            return;
        }

        for (const req of aplusRequests) {
            console.log(`Request:`);
            console.log(`   Blood Group: ${req.bloodGroup}`);
            console.log(`   Units: ${req.unitsNeeded}`);
            console.log(`   Current Status: ${req.status}`);
            console.log(`   ID: ${req._id}`);

            if (req.status === 'FULFILLED') {
                console.log(`   ⚠️  This request is FULFILLED\n`);
                console.log(`   🔄 Changing status to OPEN...\n`);

                await Request.updateOne(
                    { _id: req._id },
                    {
                        $set: { status: 'OPEN' },
                        $unset: { fulfilledAt: 1, assignedTo: 1 }
                    }
                );

                console.log(`   ✅ Status changed: FULFILLED → OPEN\n`);
                console.log(`   📍 This request should now appear in blood bank incoming requests!\n`);
            } else {
                console.log(`   ✅ Already ${req.status} - should be visible\n`);
            }
        }

        await mongoose.connection.close();
        console.log('✅ Done - Refresh your browser page!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

resetRequest();
