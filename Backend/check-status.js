import mongoose from 'mongoose';
import Donation from './modules/Donation.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

async function checkStatus() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        // Check all donations by status
        const byStatus = await Donation.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        console.log('📊 Donations by Status:');
        byStatus.forEach(s => {
            console.log(`   ${s._id}: ${s.count}`);
        });

        // Check donations in ready-storage stage
        const readyStorage = await Donation.find({
            stage: 'ready-storage'
        }).select('donorName status').lean();

        console.log(`\n📋 Donations in ready-storage stage: ${readyStorage.length}`);
        if (readyStorage.length > 0) {
            readyStorage.forEach(d => {
                console.log(`   - ${d.donorName}: status = "${d.status}"`);
            });
        }

        // Check what API will return
        const apiResult = await Donation.countDocuments({
            status: { $in: ['active', 'completed'] }
        });

        console.log(`\n🔍 API will return: ${apiResult} donations`);
        console.log(`💡 READY FOR STORAGE column will show: ${apiResult} donors`);

        if (apiResult === 0) {
            console.log('\n✅ SUCCESS! READY FOR STORAGE will be EMPTY!');
        } else {
            console.log('\n⚠️  READY FOR STORAGE will still show donations');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkStatus();
