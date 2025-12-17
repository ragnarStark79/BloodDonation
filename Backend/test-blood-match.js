// Quick diagnostic script to check donor and requests
import mongoose from 'mongoose';
import User from './modules/User.js';
import Request from './modules/Request.js';
import { connectdb } from './config/db.js';

await connectdb();

// Find the donor
const donor = await User.findOne({ role: 'DONOR' }).lean();
console.log('\n=== DONOR ===');
console.log('Name:', donor?.Name);
console.log('Email:', donor?.Email);
console.log('bloodGroup:', donor?.bloodGroup);
console.log('Bloodgroup:', donor?.Bloodgroup);

//Find all requests
const requests = await Request.find({}).lean();
console.log('\n=== ALL REQUESTS ===');
requests.forEach((req, i) => {
    console.log(`\nRequest ${i + 1}:`);
    console.log('  Blood Group:', req.bloodGroup);
    console.log('  Status:', req.status);
    console.log('  Units:', req.unitsNeeded);
});

// Try the exact query from donor.js
const bloodGroup = donor?.bloodGroup;
console.log('\n=== QUERY TEST ===');
console.log('Searching for bloodGroup:', bloodGroup);

const matchingRequests = await Request.find({
    status: 'OPEN',
    bloodGroup: bloodGroup
}).lean();

console.log('Found:', matchingRequests.length, 'matching requests');
matchingRequests.forEach((req, i) => {
    console.log(`  ${i + 1}. ${req.bloodGroup} - ${req.unitsNeeded} units`);
});

process.exit(0);
