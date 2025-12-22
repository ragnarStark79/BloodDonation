import mongoose from 'mongoose';
import { env } from './config/env.js';

// Connect using the SAME config as the server
console.log('🔍 Connecting using server config...');
console.log(`Connection string: ${env.mongoUri}\n`);

await mongoose.connect(env.mongoUri);

const dbName = mongoose.connection.db.databaseName;
console.log(`✅ Connected to database: ${dbName}\n`);

// Import models
const User = (await import('./modules/User.js')).default;

// Find all organizations
const orgs = await User.find({ role: 'organization' }).select('organizationName Name Email organizationType isVerified');

console.log(`Organizations in "${dbName}": ${orgs.length}\n`);

if (orgs.length > 0) {
    orgs.forEach(o => {
        console.log(`- ${o.organizationName || o.Name}`);
        console.log(`  Email: ${o.Email}`);
        console.log(`  Type: ${o.organizationType}`);
        console.log(`  Verified: ${o.isVerified}`);
        console.log('');
    });
} else {
    console.log('⚠️  No organizations found in this database!');

    // Check all users
    const allUsers = await User.countDocuments();
    console.log(`\nTotal users in database: ${allUsers}`);

    if (allUsers > 0) {
        const sample = await User.findOne().select('Name Email role');
        console.log(`Sample user: ${sample.Name} (${sample.Email}) - role: ${sample.role}`);
    }
}

await mongoose.connection.close();
