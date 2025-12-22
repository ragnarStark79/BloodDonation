import express from "express";
import { auth } from "../Middleware/auth.js";
import { ROLES, REQUEST_STATUS } from "../config/constants.js";
import Request from "../modules/Request.js";
import User from "../modules/User.js";
import Appointment from "../modules/Appointment.js";
import Donation from "../modules/Donation.js";
import Camp from "../modules/Camp.js";
import ProfileUpdate from "../modules/ProfileUpdate.js";
import { isEligible, nextEligibleDate } from "../utils/eligibility.js";

const router = express.Router();

// GET nearby requests filtered by blood group, urgency, distance
router.get("/requests/nearby", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { lat, lng, km = 10, group, urgency } = req.query;
        console.log(`[DonorAPI] /requests/nearby params: lat=${lat} lng=${lng} km=${km} group=${group}`);

        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Eligibility check
        const eligible = isEligible(user.lastDonationDate) && user.eligible !== false;
        console.log(`[DonorAPI] User ${user.Email} eligible: ${eligible} (Last: ${user.lastDonationDate})`);

        if (!eligible) {
            return res.status(200).json({
                eligible: false,
                nextEligibleDate: nextEligibleDate(user.lastDonationDate),
                requests: [],
            });
        }

        const bloodGroup = group || user.bloodGroup || user.Bloodgroup; // Fallback to user group
        console.log(`[DonorAPI] Searching for bloodGroup: ${bloodGroup}`);

        // Build base query - only filter by blood group if explicitly requested
        // Show OPEN requests and ASSIGNED requests (so donors can see what they're assigned to)
        const query = {
            status: { $in: [REQUEST_STATUS.OPEN, REQUEST_STATUS.ASSIGNED] }
        };

        // Only filter by blood group if group parameter was explicitly provided
        if (group) {
            query.bloodGroup = group;
        }

        if (urgency) query.urgency = urgency;

        let requests;

        // If lat/lng provided, do geospatial search
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    $maxDistance: Number(km) * 1000,
                },
            };
            requests = await Request.find(query)
                .populate("organizationId", "organizationName Name")
                .limit(50)
                .lean();

            // Filter out orphaned requests and add interest tracking
            requests = requests
                .filter(req => req.organizationId != null)
                .map(req => ({
                    ...req,
                    hasExpressedInterest: req.interestedDonors?.some(d => d.toString() === user._id.toString()) || false,
                    isAssignedToMe: req.assignedTo?.donorId?.toString() === user._id.toString() || false
                }));

            console.log(`[DonorAPI] Found ${requests.length} requests with geolocation`);
        } else {
            // Otherwise just return by blood group (no distance filtering)
            console.log(`[DonorAPI] No location provided, returning all matching blood group requests`);
            requests = await Request.find(query)
                .populate("organizationId", "organizationName Name") // Populate to check if exists
                .sort({ urgency: -1, createdAt: -1 })
                .limit(50)
                .lean();

            // Filter out orphaned requests and add interest tracking
            requests = requests
                .filter(req => req.organizationId != null)
                .map(req => ({
                    ...req,
                    hasExpressedInterest: req.interestedDonors?.some(d => d.toString() === user._id.toString()) || false,
                    isAssignedToMe: req.assignedTo?.donorId?.toString() === user._id.toString() || false
                }));

            console.log(`[DonorAPI] Found ${requests.length} requests by blood group only`);
        }

        res.json({
            eligible: true,
            requests,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Donor marks interest
router.post("/requests/:id/interest", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const reqDoc = await Request.findById(id);
        if (!reqDoc) return res.status(404).json({ message: "Request not found" });

        if (reqDoc.status !== REQUEST_STATUS.OPEN) {
            return res.status(400).json({ message: "Request is not open" });
        }

        await Request.findByIdAndUpdate(id, {
            $addToSet: { interestedDonors: userId },
        });

        res.json({ message: "Interest marked" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Donor appointments list
router.get("/appointments", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const appts = await Appointment.find({ donorId: req.user.userId })
            .populate("organizationId", "Name Email")
            .lean();
        res.json(appts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Book appointment
router.post("/appointments", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { organizationId, dateTime, requestId } = req.body;
        console.log('[DONOR] Booking appointment:', { organizationId, dateTime, requestId, donorId: req.user.userId });

        if (!organizationId || !dateTime) {
            return res.status(400).json({ message: "organizationId and dateTime are required" });
        }

        // Validate organizationId exists
        const org = await User.findById(organizationId);
        if (!org) {
            console.error('[DONOR] Organization not found:', organizationId);
            return res.status(404).json({ message: "Organization not found" });
        }

        const appt = await Appointment.create({
            donorId: req.user.userId,
            organizationId,
            requestId,
            dateTime,
        });

        console.log('[DONOR] Appointment created successfully:', appt._id);
        res.status(201).json(appt);
    } catch (err) {
        console.error('[DONOR] Error creating appointment:', err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Donation history
router.get("/history", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        const query = {
            donorId: req.user.userId,
        };

        // Default to completed if no status passed, or allow specific status filtering
        // If status is 'ALL', we might show COMPLETED and CANCELLED. UPCOMING is usually separate.
        if (status && status !== 'ALL') {
            query.status = status;
        } else {
            // By default show past events (COMPLETED, CANCELLED, REJECTED if exists)
            // Appointment schema has "UPCOMING", "COMPLETED", "CANCELLED"
            // We exclude UPCOMING from history usually.
            query.status = { $ne: "UPCOMING" };
        }

        if (startDate || endDate) {
            query.dateTime = {};
            if (startDate) query.dateTime.$gte = new Date(startDate);
            if (endDate) query.dateTime.$lte = new Date(endDate);
        }

        const appts = await Appointment.find(query)
            .populate("organizationId", "Name")
            .sort({ dateTime: -1 })
            .lean();
        const total = appts.length;
        res.json({ total, appts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Profile get/update
router
    .route("/profile")
    .get(auth([ROLES.DONOR]), async (req, res) => {
        try {
            const user = await User.findById(req.user.userId).lean();
            if (!user) return res.status(404).json({ message: "User not found" });
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Server error" });
        }
    })
    .put(auth([ROLES.DONOR]), async (req, res) => {
        try {
            const { city, phone, bloodGroup, lat, lng, preferences, Name, Gender, DateOfBirth, State, Country } = req.body;
            const update = {};

            // Basic fields
            if (Name) update.Name = Name;
            if (city) update.City = city;
            if (phone) update.PhoneNumber = phone;
            if (bloodGroup) update.bloodGroup = bloodGroup;

            // Additional fields
            if (Gender) update.Gender = Gender;
            if (DateOfBirth) update.DateOfBirth = DateOfBirth;
            if (State) update.State = State;
            if (Country) update.Country = Country;

            // Location
            if (lat !== undefined && lng !== undefined) {
                update.locationGeo = { type: "Point", coordinates: [Number(lng), Number(lat)] };
            }

            // Preferences
            if (preferences) {
                // Use dot notation or merge carefully if doing partial updates, 
                // but for now replacing the object or ensuring frontend sends full object is easier.
                // Given Mongoose structure, we can just set it if frontend sends the whole structure.
                update.preferences = preferences;
            }

            const user = await User.findByIdAndUpdate(req.user.userId, update, { new: true }).lean();
            res.json(user);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Server error" });
        }
    });

// Request Profile Update
router.post("/profile-update", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { Name, City, PhoneNumber, bloodGroup, Gender, DateOfBirth, State, Country } = req.body;

        // Check if pending request exists
        const existing = await ProfileUpdate.findOne({
            userId: req.user.userId,
            status: "PENDING"
        });

        if (existing) {
            return res.status(400).json({ message: "You already have a pending update request." });
        }

        const user = await User.findById(req.user.userId);

        await ProfileUpdate.create({
            userId: req.user.userId,
            currentData: {
                Name: user.Name,
                City: user.City,
                PhoneNumber: user.PhoneNumber,
                bloodGroup: user.bloodGroup,
                Gender: user.Gender,
                DateOfBirth: user.DateOfBirth,
                State: user.State,
                Country: user.Country
            },
            updates: {
                Name,
                City,
                PhoneNumber,
                bloodGroup,
                Gender,
                DateOfBirth,
                State,
                Country
            }
        });

        // Flag user
        await User.findByIdAndUpdate(req.user.userId, { profileUpdatePending: true });

        res.status(201).json({ message: "Update request submitted for approval." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Donor Stats
router.get("/stats", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const userId = req.user.userId;
        const donations = await Appointment.find({
            donorId: userId,
            status: "COMPLETED" // Assuming COMPLETED means successful donation
        }).sort({ dateTime: -1 });

        const totalDonations = donations.length;
        const livesSaved = totalDonations * 3; // Estimate

        // Monthly breakdown for the last 12 months
        const now = new Date();
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = donations.filter(d => {
                const date = new Date(d.dateTime);
                return date >= month && date < nextMonth;
            }).length;
            monthlyData.push(count);
        }

        // Year-to-date
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearToDate = donations.filter(d => new Date(d.dateTime) >= yearStart).length;

        // Recent donations (top 3)
        await Appointment.populate(donations, { path: 'organizationId', select: 'Name' });
        const recent = donations.slice(0, 3).map(d => ({
            id: d._id,
            date: d.dateTime,
            location: d.organizationId?.Name || "Unknown Location",
            units: d.unitsCollected || 1
        }));

        res.json({
            totalDonations,
            livesSaved,
            monthlyData,
            yearToDate,
            recent
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/donor/me - Full profile with eligibility
router.get("/me", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).lean();
        if (!user) return res.status(404).json({ message: "User not found" });

        const eligible = isEligible(user.lastDonationDate) && user.eligible !== false;
        const nextEligible = nextEligibleDate(user.lastDonationDate);

        // Count donations
        const donationCount = await Appointment.countDocuments({
            donorId: user._id,
            status: "COMPLETED"
        });

        res.json({
            ...user,
            eligible,
            nextEligibleDate: nextEligible,
            donationCount
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// GET /api/donor/donations/recent - Recent donation history
router.get("/donations/recent", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const donations = await Appointment.find({
            donorId: req.user.userId,
            status: "COMPLETED"
        })
            .populate("organizationId", "Name Email City")
            .sort({ dateTime: -1 })
            .limit(5)
            .lean();

        const formatted = donations.map(d => ({
            _id: d._id,
            date: d.dateTime,
            organization: d.organizationId?.Name || "Unknown",
            city: d.organizationId?.City || "",
            units: d.unitsCollected || 1,
            successful: d.donationSuccessful !== false
        }));

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/donor/appointments/:id/cancel - Cancel appointment
router.put("/appointments/:id/cancel", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const appointment = await Appointment.findOne({ _id: id, donorId: req.user.userId });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status !== "UPCOMING") {
            return res.status(400).json({ message: "Can only cancel upcoming appointments" });
        }

        appointment.status = "CANCELLED";
        appointment.notes = reason ? `Cancelled: ${reason}` : "Cancelled by donor";
        await appointment.save();

        res.json({ message: "Appointment cancelled", appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/donor/appointments/:id/reschedule - Reschedule appointment
router.put("/appointments/:id/reschedule", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const { dateTime } = req.body;

        if (!dateTime) {
            return res.status(400).json({ message: "dateTime is required" });
        }

        const appointment = await Appointment.findOne({ _id: id, donorId: req.user.userId });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.status !== "UPCOMING") {
            return res.status(400).json({ message: "Can only reschedule upcoming appointments" });
        }

        const oldDate = appointment.dateTime;
        appointment.dateTime = new Date(dateTime);
        appointment.notes = appointment.notes
            ? `${appointment.notes} | Rescheduled from ${oldDate.toISOString()}`
            : `Rescheduled from ${oldDate.toISOString()}`;
        await appointment.save();

        res.json({ message: "Appointment rescheduled", appointment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// ============ CAMP FEATURES ============
// List eligible camps for donor (nearby or all)
router.get("/camps", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query; // radius in km
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let query = {
            status: { $in: ["PLANNED", "ONGOING"] },
            date: { $gte: startOfToday }
        };

        if (lat && lng) {
            query["location.coordinates.coordinates"] = {
                $near: {
                    $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
                    $maxDistance: radius * 1000 // Convert km to meters
                }
            };
        }

        const camps = await Camp.find(query)
            .populate("organizationId", "organizationName Name City")
            .sort({ date: 1 })
            .lean();

        // Check if current donor is registered for each camp
        const donorId = req.user.userId;
        const enrichedCamps = camps.map(camp => ({
            ...camp,
            isRegistered: camp.registeredDonors?.some(id => id.toString() === donorId),
            isFull: camp.registeredDonors?.length >= camp.capacity
        }));

        res.json(enrichedCamps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Register for a camp
router.post("/camps/:id/register", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const donorId = req.user.userId;

        const camp = await Camp.findById(id);
        if (!camp) return res.status(404).json({ message: "Camp not found" });

        if (camp.status !== "PLANNED") {
            return res.status(400).json({ message: "Can only register for planned camps" });
        }

        if (camp.registeredDonors.includes(donorId)) {
            return res.status(400).json({ message: "Already registered for this camp" });
        }

        if (camp.registeredDonors.length >= camp.capacity) {
            return res.status(400).json({ message: "Camp is already full" });
        }

        camp.registeredDonors.push(donorId);
        await camp.save();

        res.json({ message: "Successfully registered for camp", camp });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// Unregister/Cancel registration
router.delete("/camps/:id/unregister", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const { id } = req.params;
        const donorId = req.user.userId;

        const camp = await Camp.findById(id);
        if (!camp) return res.status(404).json({ message: "Camp not found" });

        camp.registeredDonors = camp.registeredDonors.filter(id => id.toString() !== donorId);
        await camp.save();

        res.json({ message: "Registration cancelled successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// My Registered Camps
router.get("/my-camps", auth([ROLES.DONOR]), async (req, res) => {
    try {
        const donorId = req.user.userId;
        const camps = await Camp.find({
            registeredDonors: donorId
        }).populate("organizationId", "organizationName Name City Phone").lean();

        res.json(camps);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
