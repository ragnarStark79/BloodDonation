const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/liforce');

const BloodUnit = mongoose.model('BloodUnit', new mongoose.Schema({}, { strict: false, collection: 'bloodunits' }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

async function checkBloodUnits() {
    try {
        console.log('🔍 Checking all blood units in database...\n');

        const allUnits = await BloodUnit.find({}).limit(50).lean();
        console.log(`📦 Total units found: ${allUnits.length}\n`);

        if (allUnits.length > 0) {
            console.log('📋 Sample units (first 5):');
            allUnits.slice(0, 5).forEach((unit, i) => {
                console.log(`\n  ${i + 1}. Blood Group: ${unit.bloodGroup}`);
                console.log(`     Organization ID: ${unit.organizationId}`);
                console.log(`     Status: ${unit.status}`);
                console.log(`     Barcode: ${unit.barcode || 'N/A'}`);
            });

            // Group by organizationId
            const byOrg = {};
            allUnits.forEach(unit => {
                const orgId = unit.organizationId?.toString() || 'null';
                byOrg[orgId] = (byOrg[orgId] || 0) + 1;
            });

            console.log('\n📊 Units by Organization ID:');
            for (const [orgId, count] of Object.entries(byOrg)) {
                console.log(`  ${orgId}: ${count} units`);
            }

            // Group by status
            const byStatus = {};
            allUnits.forEach(unit => {
                byStatus[unit.status] = (byStatus[unit.status] || 0) + 1;
            });

            console.log('\n📋 Units by Status:');
            for (const [status, count] of Object.entries(byStatus)) {
                console.log(`  ${status}: ${count} units`);
            }

            // Check organizations
            console.log('\n🏥 Checking organizations in database...');
            const orgs = await User.find({ role: 'ORGANIZATION' }).limit(10).lean();
            console.log(`📋 Found ${orgs.length} organizations:\n`);
            orgs.forEach((org, i) => {
                console.log(`  ${i + 1}. Name: ${org.organizationName || org.Name}`);
                console.log(`     ID: ${org._id}`);
                console.log(`     Type: ${org.organizationType}`);
                console.log('');
            });
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkBloodUnits();
