import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error(err));

// Note: Using dynamic imports or defining schemas inline to avoid module issues
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
        console.log('Finding completed donations...');
        const donations = await Donation.find({
            $or: [
                { stage: 'ready-storage' },
                { status: 'completed', 'labTests.allTestsPassed': true }
            ],
            appointmentId: { $ne: null }
        });

        console.log(`Found ${donations.length} candidate donations.`);

        for (const donation of donations) {
            if (donation.appointmentId) {
                console.log(`Checking appointment ${donation.appointmentId}...`);
                const appt = await Appointment.findById(donation.appointmentId);

                if (appt && appt.status !== 'COLLECTED') {
                    console.log(`Updating appointment ${appt._id} to COLLECTED`);
                    appt.status = 'COLLECTED';
                    appt.completedAt = new Date();
                    await appt.save();
                    console.log('✅ Updated.');

                    // Also check for request fulfillment
                    // Note: Appointment schema in this script is simplified, so we might miss requestId unless we add it
                    // Let's re-fetch with full schema or just use what we have if we add requestId to schema
                } else {
                    console.log(`Appointment already COLLECTED or not found.`);
                }
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixData();
