import mongoose from 'mongoose';
import BloodUnit from './modules/BloodUnit.js';

await mongoose.connect('mongodb://localhost:27017/liforce');

const orgId = '6946ff84e5bb59549eb37464';

console.log('🔍 Simulating chart API call...\n');

// This is exactly what the backend does for blood-group-distribution
const distribution = await BloodUnit.aggregate([
    { $match: { organizationId: new mongoose.Types.ObjectId(orgId), status: "AVAILABLE" } },
    { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
]);

console.log('📊 Distribution query result:', distribution);

// Format for chart (what backend sends)
const colorMap = {
    'A+': '#ff6b9d',
    'A-': '#ff8fb3',
    'AB+': '#4ecdc4',
    'AB-': '#95e1d3',
    'B+': '#5dade2',
    'B-': '#85c1e9',
    'O+': '#f1948a',
    'O-': '#f5b7b1'
};

const chartData = distribution.map(item => ({
    name: item._id,
    value: item.count,
    color: colorMap[item._id] || '#ef4444'
}));

console.log('\n📈 Chart data (what frontend should receive):');
console.log(JSON.stringify(chartData, null, 2));

await mongoose.connection.close();
