import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/blooddonation'; // Hardcoded from .env

// Schemas
const appointmentSchema = new mongoose.Schema({
    status: String,
    completedAt: Date
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const donationSchema = new mongoose.Schema({
    stage: String,
    status: String,
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    labTests: {
        allTestsPassed: Boolean
    }
});
const Donation = mongoose.model('Donation', donationSchema);

const requestSchema = new mongoose.Schema({
    status: String,
    fulfilledAt: Date
});
const Request = mongoose.model('Request', requestSchema);

async function fixData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Find completed donations connected to appointments
        const donations = await Donation.find({
            $or: [
                { stage: 'ready-storage' },
                { status: 'completed', 'labTests.allTestsPassed': true }
            ],
            appointmentId: { $ne: null }
        });

        console.log(`Found ${donations.length} completed donations.`);

        let fixedCount = 0;
        for (const donation of donations) {
            if (donation.appointmentId) {
                const appt = await Appointment.findById(donation.appointmentId).populate('requestId');
                if (appt) {
                    let updated = false;
                    if (appt.status !== 'COLLECTED') {
                        appt.status = 'COLLECTED';
                        appt.completedAt = new Date();
                        await appt.save();
                        console.log(`✅ Fixed Appointment: ${appt._id}`);
                        updated = true;
                        fixedCount++;
                    }

                    // Check request fulfillment
                    if (appt.requestId) {
                        const req = await Request.findById(appt.requestId);
                        if (req && req.status !== 'FULFILLED') {
                            req.status = 'FULFILLED';
                            req.fulfilledAt = new Date();
                            await req.save();
                            console.log(`✅ Fixed Request: ${req._id}`);
                        }
                    }
                }
            }
        }

        console.log(`Fixed ${fixedCount} appointments.`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixData();
