import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

const cleanupRequests = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const Request = mongoose.model('Request', new mongoose.Schema({}, { strict: false }));

        // Show all requests with details
        const allRequests = await Request.find({}).lean();
        console.log(`📊 Found ${allRequests.length} total requests in database:\n`);

        if (allRequests.length === 0) {
            console.log('✨ Database is already clean!');
            await mongoose.connection.close();
            rl.close();
            return;
        }

        // Group by status and show summary
        const summary = {};
        allRequests.forEach(req => {
            const status = req.status || 'UNKNOWN';
            summary[status] = (summary[status] || 0) + 1;
        });

        console.log('📋 Summary by status:');
        Object.entries(summary).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        console.log('');

        // Show details of first few requests
        console.log('🔍 Sample requests:');
        allRequests.slice(0, 5).forEach((req, idx) => {
            const createdDate = new Date(req.createdAt || req.createdAt);
            const daysAgo = Math.floor((Date.now() - createdDate) / (1000 * 60 * 60 * 24));
            console.log(`   ${idx + 1}. ${req.bloodGroup || 'N/A'} - ${req.status || 'N/A'} - Created ${daysAgo} days ago`);
        });
        console.log('');

        // Ask what to delete
        console.log('⚠️  DELETION OPTIONS:');
        console.log('   1. Delete ALL requests (including your created ones)');
        console.log('   2. Delete only OLD requests (>30 days)');
        console.log('   3. Delete only FULFILLED/CANCELLED requests');
        console.log('   4. Delete only specific status (you choose)');
        console.log('   5. Cancel (don\'t delete anything)');
        console.log('');

        const choice = await askQuestion('Enter your choice (1-5): ');

        let filter = {};
        let description = '';

        switch (choice.trim()) {
            case '1':
                filter = {};
                description = 'ALL requests';
                break;
            case '2':
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                filter = { createdAt: { $lt: thirtyDaysAgo } };
                description = 'requests older than 30 days';
                break;
            case '3':
                filter = { status: { $in: ['FULFILLED', 'CANCELLED'] } };
                description = 'FULFILLED and CANCELLED requests';
                break;
            case '4':
                const statusChoice = await askQuestion('Enter status to delete (OPEN/ASSIGNED/FULFILLED/CANCELLED): ');
                filter = { status: statusChoice.trim().toUpperCase() };
                description = `${statusChoice.trim().toUpperCase()} requests`;
                break;
            case '5':
                console.log('✅ Cancelled. No requests were deleted.');
                await mongoose.connection.close();
                rl.close();
                return;
            default:
                console.log('❌ Invalid choice. Cancelled.');
                await mongoose.connection.close();
                rl.close();
                return;
        }

        // Count matching requests
        const matchCount = await Request.countDocuments(filter);
        console.log(`\n📊 Found ${matchCount} ${description}\n`);

        if (matchCount === 0) {
            console.log('✨ Nothing to delete!');
            await mongoose.connection.close();
            rl.close();
            return;
        }

        // Final confirmation
        const confirm = await askQuestion(`⚠️  Are you SURE you want to delete ${matchCount} ${description}? (yes/no): `);

        if (confirm.trim().toLowerCase() === 'yes') {
            const result = await Request.deleteMany(filter);
            console.log(`\n✅ Successfully deleted ${result.deletedCount} requests`);
            console.log('✨ Cleanup complete!');
        } else {
            console.log('✅ Cancelled. No requests were deleted.');
        }

        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        rl.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
};

cleanupRequests();
