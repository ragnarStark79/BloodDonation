import express from "express";
import Request from "../modules/Request.js";
import User from "../modules/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { REQUEST_STATUS, URGENCY, ROLES } from "../config/constants.js";

const router = express.Router();

// ==================== INLINE AUTH MIDDLEWARE ====================

const authenticate = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "No token" });
        }
        const decoded = jwt.verify(token, env.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

const requireRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: `Access denied. ${role} role required.` });
    }
    next();
};

// ==================== DONOR ENDPOINTS ====================

/**
 * GET /api/requests/nearby
 * Get nearby blood requests for donors
 */
router.get("/nearby", authenticate, requireRole(ROLES.DONOR), async (req, res) => {
    try {
        const { lat, lng, km = 10, urgency, bloodGroup, page = 1, limit = 10 } = req.query;

        const donor = await User.findById(req.user.userId);
        if (!donor) {
            return res.status(404).json({ message: "Donor not found" });
        }

        const query = {
            status: { $in: [REQUEST_STATUS.OPEN, REQUEST_STATUS.ASSIGNED] }
        };

        // Only filter by blood group if explicitly requested
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        if (urgency && urgency !== "ALL") {
            query.urgency = urgency;
        }

        let requests;
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const kmNum = parseFloat(km);

        if (latNum && lngNum) {
            requests = await Request.aggregate([
                {
                    $geoNear: {
                        near: { type: "Point", coordinates: [lngNum, latNum] },
                        distanceField: "distance",
                        maxDistance: kmNum * 1000,
                        spherical: true,
                        query: query
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "organizationId",
                        foreignField: "_id",
                        as: "organization"
                    }
                },
                {
                    $unwind: { path: "$organization", preserveNullAndEmptyArrays: true }
                },
                {
                    $addFields: {
                        hospitalName: "$organization.organizationName",
                        distance: { $divide: ["$distance", 1000] },
                        hasExpressedInterest: { $in: [donor._id, "$interestedDonors"] },
                        interestedDonorsCount: { $size: { $ifNull: ["$interestedDonors", []] } }
                    }
                },
                {
                    $project: { organization: 0 }
                },
                {
                    $sort: { distance: 1, urgency: -1, createdAt: -1 }
                },
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: parseInt(limit)
                }
            ]);
        } else {
            requests = await Request.find(query)
                .populate("organizationId", "organizationName")
                .sort({ urgency: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .lean();


            // Filter out orphaned requests (where organization was deleted)
            requests = requests.filter(req => req.organizationId != null);

            requests = requests.map(req => ({
                ...req,
                hospitalName: req.organizationId?.organizationName,
                hasExpressedInterest: req.interestedDonors?.includes(donor._id),
                interestedDonorsCount: req.interestedDonors?.length || 0
            }));
        }

        const nextEligible = donor.nextEligibleDate;
        const isEligible = !nextEligible || new Date(nextEligible) <= new Date();

        res.json({
            requests,
            eligible: isEligible,
            nextEligibleDate: nextEligible
        });
    } catch (error) {
        console.error("Error fetching nearby requests:", error);
        res.status(500).json({ message: "Failed to fetch requests", error: error.message });
    }
});

/**
 * POST /api/requests/:id/interest
 * Express interest in a request (donor)
 */
router.post("/:id/interest", authenticate, requireRole(ROLES.DONOR), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== REQUEST_STATUS.OPEN && request.status !== REQUEST_STATUS.ASSIGNED) {
            return res.status(400).json({ message: "This request is no longer active" });
        }

        if (request.interestedDonors.includes(req.user.userId)) {
            return res.status(400).json({ message: "You have already expressed interest" });
        }

        request.interestedDonors.push(req.user.userId);
        await request.save();

        res.json({
            message: "Interest recorded successfully",
            request: {
                _id: request._id,
                interestedDonorsCount: request.interestedDonors.length
            }
        });
    } catch (error) {
        console.error("Error expressing interest:", error);
        res.status(500).json({ message: "Failed to express interest" });
    }
});

/**
 * DELETE /api/requests/:id/interest
 * Withdraw interest (donor)
 */
router.delete("/:id/interest", authenticate, requireRole(ROLES.DONOR), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.interestedDonors = request.interestedDonors.filter(
            id => id.toString() !== req.user.userId
        );
        await request.save();

        res.json({ message: "Interest withdrawn successfully" });
    } catch (error) {
        console.error("Error withdrawing interest:", error);
        res.status(500).json({ message: "Failed to withdraw interest" });
    }
});

/**
 * GET /api/requests/assigned
 * Get requests assigned to current donor (for booking appointments)
 */
router.get("/assigned", authenticate, requireRole(ROLES.DONOR), async (req, res) => {
    try {
        const requests = await Request.find({
            "assignedTo.type": "DONOR",
            "assignedTo.donorId": req.user.userId,
            status: { $in: [REQUEST_STATUS.ASSIGNED, REQUEST_STATUS.FULFILLED] }
        })
            .populate("organizationId", "organizationName location address city phone")
            .sort({ createdAt: -1 })
            .lean();

        // Add hospital name for each request
        const enrichedRequests = requests.map(req => ({
            ...req,
            hospitalName: req.organizationId?.organizationName
        }));

        res.json({ requests: enrichedRequests });
    } catch (error) {
        console.error("Error fetching assigned requests:", error);
        res.status(500).json({ message: "Failed to fetch assigned requests" });
    }
});

// ==================== ORGANIZATION ENDPOINTS ====================

/**
 * POST /api/requests/org
 * Create a new blood request (Hospital)
 */
router.post("/org", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        console.log("📝 Creating request for user:", req.user.userId);
        console.log("📝 Request body:", req.body);

        const {
            bloodGroup,
            component,
            unitsNeeded,
            urgency,
            contactPerson,
            contactPhone,
            caseDetails,
            patientAge,
            patientGender,
            requiredBy
        } = req.body;

        if (!bloodGroup || !unitsNeeded) {
            return res.status(400).json({ message: "Blood group and units needed are required" });
        }

        const org = await User.findById(req.user.userId);
        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        console.log("✅ Organization found:", org.organizationName);

        const request = new Request({
            organizationId: req.user.userId,
            bloodGroup: bloodGroup,
            component: component || "WHOLE_BLOOD",
            unitsNeeded: parseInt(unitsNeeded),
            urgency: urgency || "MEDIUM",
            location: {
                type: "Point",
                coordinates: org.location?.coordinates || [77.2, 28.6],
                address: org.address || "",
                city: org.city || "",
                state: org.state || ""
            },
            contactPerson: contactPerson || "N/A",
            contactPhone: contactPhone || "N/A",
            caseDetails: caseDetails || "N/A",
            patientAge: patientAge ? parseInt(patientAge) : undefined,
            patientGender: patientGender || undefined,
            requiredBy: requiredBy ? new Date(requiredBy) : undefined,
            status: REQUEST_STATUS.OPEN
        });

        await request.save();

        console.log("✅ Request created successfully:", request._id);

        res.status(201).json({
            message: "Blood request created successfully",
            request
        });
    } catch (error) {
        console.error("❌ Error creating request:", error);
        res.status(500).json({
            message: "Failed to create request",
            error: error.message
        });
    }
});

/**
 * GET /api/requests/org/mine
 * Get organization's own requests
 */
router.get("/org/mine", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const { page = 1, limit = 10, status, urgency } = req.query;

        const query = { organizationId: req.user.userId };
        if (status) query.status = status;
        if (urgency) query.urgency = urgency;

        const requests = await Request.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Request.countDocuments(query);

        res.json({
            requests,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
});

/**
 * GET /api/requests/org/:id/matches
 * Get matching donors and blood banks
 */
router.get("/org/:id/matches", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id).populate("interestedDonors", "Name PhoneNumber Email bloodGroup City State location lastDonationDate eligible");

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Get blood banks with matching inventory (simplified for now)
        const bloodBanks = await User.find({
            role: ROLES.ORGANIZATION,
            organizationType: { $in: ["BLOOD_BANK", "BOTH"] }
        }).limit(10).lean();

        res.json({
            donors: request.interestedDonors || [],
            bloodBanks: bloodBanks
        });
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({ message: "Failed to fetch matches" });
    }
});

/**
 * PUT /api/requests/org/:id/assign
 * Assign donor or blood bank to request
 */
router.put("/org/:id/assign", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const { donorId, bloodBankId, appointmentDate } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        let appointment = null;

        if (donorId) {
            request.assignedTo = { type: "DONOR", donorId };
            request.status = REQUEST_STATUS.ASSIGNED;

            // Auto-create appointment for donor
            const Appointment = (await import("../modules/Appointment.js")).default;

            // Use provided date or default to 24 hours from now
            const apptDateTime = appointmentDate ? new Date(appointmentDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);

            appointment = await Appointment.create({
                donorId: donorId,
                organizationId: req.user.userId,
                requestId: req.params.id,
                dateTime: apptDateTime,
                status: "UPCOMING",
                notes: `Appointment for ${request.bloodGroup} blood donation - ${request.unitsNeeded} unit(s)`
            });

            console.log(`✅ Created appointment ${appointment._id} for donor ${donorId}`);
        } else if (bloodBankId) {
            request.assignedTo = { type: "BLOOD_BANK", organizationId: bloodBankId };
            request.status = REQUEST_STATUS.ASSIGNED;
        }

        await request.save();

        res.json({
            message: "Request assigned successfully",
            request,
            appointment: appointment || undefined
        });
    } catch (error) {
        console.error("Error assigning request:", error);
        res.status(500).json({ message: "Failed to assign request", error: error.message });
    }
});

/**
 * PUT /api/requests/org/:id/fulfill
 * Mark request as fulfilled and update donor eligibility
 */
router.put("/org/:id/fulfill", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Update request status
        request.status = REQUEST_STATUS.FULFILLED;
        request.fulfilledAt = new Date();

        // If donor was assigned, update their eligibility
        if (request.assignedTo?.type === "DONOR" && request.assignedTo?.donorId) {
            const donor = await User.findById(request.assignedTo.donorId);

            if (donor) {
                const donationDate = new Date();
                donor.lastDonationDate = donationDate;

                // Calculate next eligible date based on gender
                // Males: 56 days, Females/Other: 84 days
                const daysUntilEligible = (donor.gender === 'MALE') ? 56 : 84;
                const nextEligibleDate = new Date(donationDate);
                nextEligibleDate.setDate(nextEligibleDate.getDate() + daysUntilEligible);

                donor.nextEligibleDate = nextEligibleDate;

                await donor.save();

                console.log(`✅ Updated donor ${donor.name} eligibility: next eligible ${nextEligibleDate.toDateString()}`);
            }
        }

        await request.save();

        res.json({
            message: "Request marked as fulfilled",
            request,
            donorEligibilityUpdated: !!request.assignedTo?.donorId
        });
    } catch (error) {
        console.error("Error fulfilling request:", error);
        res.status(500).json({ message: "Failed to fulfill request" });
    }
});

/**
 * PUT /api/requests/org/:id/cancel
 * Cancel a request
 */
router.put("/org/:id/cancel", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.status = REQUEST_STATUS.CANCELLED;
        request.notes = reason || "";
        await request.save();

        res.json({ message: "Request cancelled successfully", request });
    } catch (error) {
        console.error("Error cancelling request:", error);
        res.status(500).json({ message: "Failed to cancel request" });
    }
});

// ==================== BLOOD BANK ENDPOINTS ====================

/**
 * GET /api/requests/org/incoming
 * Get incoming requests that blood bank can fulfill
 */
router.get("/org/incoming", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const { page = 1, limit = 10, bloodGroup, urgency } = req.query;

        const bloodBank = await User.findById(req.user.userId);
        if (!bloodBank) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Build query for open requests
        const query = {
            status: REQUEST_STATUS.OPEN,
            organizationId: { $ne: req.user.userId } // Not own requests
        };

        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }
        if (urgency) {
            query.urgency = urgency;
        }

        // Get nearby requests (simplified - in production, check actual inventory)
        const requests = await Request.find(query)
            .populate("organizationId", "organizationName location address city phone")
            .sort({ urgency: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Request.countDocuments(query);

        // Add hospital name and distance info
        const enrichedRequests = requests.map(req => ({
            ...req,
            hospitalName: req.organizationId?.organizationName
        }));

        res.json({
            requests: enrichedRequests,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching incoming requests:", error);
        res.status(500).json({ message: "Failed to fetch incoming requests" });
    }
});

/**
 * POST /api/requests/org/:id/reserve
 * Reserve inventory units for a request (blood bank)
 */
router.post("/org/:id/reserve", authenticate, requireRole(ROLES.ORGANIZATION), async (req, res) => {
    try {
        const { units } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // TODO: Implement actual BloodUnit reservation logic
        // For now, just mark request as having a blood bank response
        request.status = REQUEST_STATUS.ASSIGNED;
        request.assignedTo = {
            type: "BLOOD_BANK",
            organizationId: req.user.userId
        };

        await request.save();

        res.json({
            message: "Units reserved successfully",
            request
        });
    } catch (error) {
        console.error("Error reserving units:", error);
        res.status(500).json({ message: "Failed to reserve units" });
    }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/requests/admin/all
 * Get all requests (admin)
 */
router.get("/admin/all", authenticate, requireRole(ROLES.ADMIN), async (req, res) => {
    try {
        const { page = 1, limit = 20, status, urgency, city, organizationId } = req.query;

        const query = {};
        if (status) query.status = status;
        if (urgency) query.urgency = urgency;
        if (city) query["location.city"] = city;
        if (organizationId) query.organizationId = organizationId;

        const requests = await Request.find(query)
            .populate("organizationId", "organizationName")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Request.countDocuments(query);

        res.json({
            requests,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Error fetching all requests:", error);
        res.status(500).json({ message: "Failed to fetch requests" });
    }
});

/**
 * GET /api/requests/admin/summary
 * Get request statistics
 */
router.get("/admin/summary", authenticate, requireRole(ROLES.ADMIN), async (req, res) => {
    try {
        const summary = await Request.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const urgentCount = await Request.countDocuments({
            status: REQUEST_STATUS.OPEN,
            urgency: URGENCY[2] // "CRITICAL"
        });

        res.json({
            summary,
            urgentCount
        });
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).json({ message: "Failed to fetch summary" });
    }
});

/**
 * POST /api/requests/admin/broadcast
 * Broadcast notification to eligible donors for a request
 */
router.post("/admin/broadcast", authenticate, requireRole(ROLES.ADMIN), async (req, res) => {
    try {
        const { requestId, radius = 20, message } = req.body;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Find eligible donors
        const query = {
            role: ROLES.DONOR,
            bloodGroup: request.bloodGroup,
            $or: [
                { nextEligibleDate: { $exists: false } },
                { nextEligibleDate: { $lte: new Date() } }
            ]
        };

        const eligibleDonors = await User.find(query).select('_id name bloodGroup').lean();

        // TODO: Create Notification records for each donor
        // TODO: Send push notifications/emails

        console.log(`📢 Broadcast to ${eligibleDonors.length} eligible ${request.bloodGroup} donors`);

        res.json({
            message: "Broadcast sent successfully",
            donorsNotified: eligibleDonors.length,
            request: {
                _id: request._id,
                bloodGroup: request.bloodGroup,
                urgency: request.urgency
            }
        });
    } catch (error) {
        console.error("Error broadcasting:", error);
        res.status(500).json({ message: "Failed to broadcast notification" });
    }
});

/**
 * GET /api/requests/:id
 * Get single request details
 */
router.get("/:id", authenticate, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate("organizationId", "organizationName location phone email")
            .populate("interestedDonors", "name phone bloodGroup")
            .lean();

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        request.hospitalName = request.organizationId?.organizationName;
        request.interestedDonorsCount = request.interestedDonors?.length || 0;

        if (req.user.role === ROLES.DONOR) {
            request.hasExpressedInterest = request.interestedDonors?.some(
                d => d._id.toString() === req.user.userId
            );
        }

        res.json(request);
    } catch (error) {
        console.error("Error fetching request:", error);
        res.status(500).json({ message: "Failed to fetch request" });
    }
});

export default router;
