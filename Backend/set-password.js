import mongoose from 'mongoose';

async function setPassword() {
    await mongoose.connect('mongodb://localhost:27017/test');

    // Get password from existing user
    const existingUser = await mongoose.connection.db.collection('users').findOne({ Email: 'blood@gmail.com' });

    if (existingUser && existingUser.Password) {
        // Copy password to dhir
        const result = await mongoose.connection.db.collection('users').updateOne(
            { Name: 'dhir' },
            { $set: { Password: existingUser.Password } }
        );
        console.log('Updated dhir password:', result);
    } else {
        console.log('Could not find blood@gmail.com user');
    }

    await mongoose.disconnect();
}

setPassword();
