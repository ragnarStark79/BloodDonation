import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liforce';

const checkUser = async () => {
    try {
        await mongoose.connect(MONGODB_URI);

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        // Find user with "raktt" in name
        const user = await User.findOne({ Name: /raktt/i }).lean();

        if (!user) {
            console.log('❌ User not found');
            await mongoose.connection.close();
            return;
        }

        console.log('👤 User Details:\n');
        console.log(`Name: ${user.Name}`);
        console.log(`Email: ${user.Email}`);
        console.log(`Role: ${user.Role}`);
        console.log(`Organization Type: ${user.organizationType || '❌ NOT SET!'}`);
        console.log('');

        if (!user.organizationType) {
            console.log('⚠️  PROBLEM FOUND!');
            console.log('organizationType is NOT SET!');
            console.log('');
            console.log(' Setting it to "BANK"...\n');

            await User.updateOne(
                { _id: user._id },
                { $set: { organizationType: 'BANK' } }
            );

            console.log('✅ organizationType set to "BANK"');
            console.log('');
            console.log('🔄 Please refresh your browser now!');
        } else if (user.organizationType !== 'BANK' && user.organizationType !== 'BOTH') {
            console.log(`⚠️  PROBLEM: organizationType is "${user.organizationType}"`);
            console.log('It should be "BANK" or "BOTH"');
            console.log('');
            console.log('Fixing it...\n');

            await User.updateOne(
                { _id: user._id },
                { $set: { organizationType: 'BANK' } }
            );

            console.log('✅ Fixed! Set to "BANK"');
            console.log('🔄 Please refresh your browser now!');
        } else {
            console.log('✅ organizationType is correct!');
            console.log('The issue is elsewhere.');
        }

        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

checkUser();
