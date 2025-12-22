import mongoose from 'mongoose';
import User from './modules/User.js';
import BloodUnit from './modules/BloodUnit.js';
import Request from './modules/Request.js';
import Donation from './modules/Donation.js';

await mongoose.connect('mongodb://localhost:27017/Lifeforce');

console.log('📊 LIFEFORCE DATABASE VERIFICATION\n');

// Users
const users = await User.find({}).select('Name Email role organizationType').lean();
console.log(`👥 Users: ${users.length}`);
users.forEach(u => {
    console.log(`   - ${u.Name} (${u.Email}) - ${u.role} ${u.organizationType || ''}`);
});

// Blood Units
const bloodUnits = await BloodUnit.countDocuments();
console.log(`\n🩸 Blood Units: ${bloodUnits}`);

// Requests
const requests = await Request.countDocuments();
console.log(`📋 Blood Requests: ${requests}`);

// Donations
const donations = await Donation.countDocuments();
console.log(`💉 Donations: ${donations}`);

console.log('\n✅ This is your active project database!');

await mongoose.connection.close();
