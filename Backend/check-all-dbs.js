import mongoose from 'mongoose';
import User from './modules/User.js';

const databases = ['liforce', 'Lifeforce', 'liforce_db', 'blooddonation', 'blood-donation'];

for (const dbName of databases) {
    console.log(`\n🔍 Checking: ${dbName}`);

    await mongoose.connect(`mongodb://localhost:27017/${dbName}`);

    const userCount = await User.countDocuments();
    console.log(`   Users: ${userCount}`);

    if (userCount > 0) {
        const bloodBanks = await User.find({ organizationType: 'BANK' }).select('organizationName Name').limit(3);
        console.log(`   Blood banks:`);
        bloodBanks.forEach(b => console.log(`     - ${b.organizationName || b.Name}`));
    }

    await mongoose.connection.close();
}

console.log('\n✅ Check complete!');
