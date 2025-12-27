import express from "express";
import Appointment from "../modules/Appointment.js";
import User from "../modules/User.js";
import Request from "../modules/Request.js";
import { donorAuth } from "../Middleware/donorAuth.js";
import { orgAuth } from "../Middleware/orgAuth.js";
import { adminAuth } from "../Middleware/adminAuth.js";

const router = express.Router();

// ==================== DONOR ENDPOINTS ====================

/**
 * GET /api/appointments/donor
 * Get donor's appointments (all or filtered by status)
 */
router.get("/donor", donorAuth, async (req, res) => {
    try {
        const { status } = req.query;
        const query = { donorId: req.user.userId };

        if (status && status !== "ALL") {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate("organizationId", "organizationName Name location city state phone")
            .populate("requestId", "bloodGroup unitsNeeded urgency")
            .sort({ dateTime: -1 })
            .lean();

        res.json(appointments);
    } catch (error) {

        res.status(500).json({ message: "Failed to fetch appointments" });
    }
});

/**
 * POST /api/appointments/donor
 * Book a new appointment (donor self-booking)
 */
router.post("/donor", donorAuth, async (req, res) => {
    try {
        const { organizationId, dateTime, notes } = req.body;

        if (!organizationId || !dateTime) {
            return res.status(400).json({ message: "Organization and date/time are required" });
        }

        // Verify organization exists and is a valid type
        const org = await User.findById(organizationId);
        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        // Accept both HOSPITAL and BANK types
        if (!['HOSPITAL', 'BANK'].includes(org.organizationType)) {
            return res.status(400).json({ message: "Invalid organization type - must be a hospital or blood bank" });
        }

        // Create appointment
        const appointment = new Appointment({
            donorId: req.user.userId,
            organizationId,
            dateTime: new Date(dateTime),
            status: "UPCOMING",
            notes,
            createdBy: req.user.userId,
            createdByRole: "DONOR"
        });

        await appointment.save();

        // Populate for response
        await appointment.populate("organizationId", "organizationName Name location city");

        res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to book appointment" });
    }
});

/**
 * PUT /api/appointments/donor/:id/cancel
 * Cancel an appointment (donor side)
 */
router.put("/donor/:id/cancel", donorAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Verify ownership
        if (appointment.donorId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (appointment.status !== "UPCOMING") {
            return res.status(400).json({ message: "Only upcoming appointments can be cancelled" });
        }

        appointment.status = "CANCELLED";
        appointment.cancellationReason = reason || "Cancelled by donor";
        appointment.cancelledBy = req.user.userId;
        appointment.cancelledAt = new Date();

        await appointment.save();

        res.json({
            message: "Appointment cancelled successfully",
            appointment
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to cancel appointment" });
    }
});

/**
 * GET /api/appointments/donor/history
 * Get donor's donation history (completed appointments)
 */
router.get("/donor/history", donorAuth, async (req, res) => {
    try {
        const appointments = await Appointment.find({
            donorId: req.user.userId,
            status: "COMPLETED",
            donationSuccessful: true
        })
            .populate("organizationId", "organizationName Name city")
            .sort({ dateTime: -1 })
            .lean();

        // Calculate statistics
        const totalDonations = appointments.length;
        const totalUnits = appointments.reduce((sum, apt) => sum + (apt.unitsCollected || 0), 0);
        const lastDonation = appointments[0]?.dateTime || null;

        res.json({
            history: appointments,
            stats: {
                totalDonations,
                totalUnits,
                lastDonation
            }
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to fetch donation history" });
    }
});

// ==================== ORGANIZATION ENDPOINTS ====================

/**
 * GET /api/appointments/org
 * Get organization's appointments
 */
router.get("/org", orgAuth, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = { organizationId: req.user.userId };

        if (status && status !== "ALL") {
            query.status = status;
        }

        const appointments = await Appointment.find(query)
            .populate("donorId", "Name Email PhoneNumber bloodGroup City State location lastDonationDate")
            .populate("requestId", "bloodGroup unitsNeeded urgency")
            .sort({ dateTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();



        const total = await Appointment.countDocuments(query);

        res.json({
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to fetch appointments" });
    }
});

/**
 * DELETE /api/appointments/org/cleanup-duplicates
 * Clean up duplicate appointments (for debugging)
 */
router.delete("/org/cleanup-duplicates", orgAuth, async (req, res) => {
    try {
        const { dryRun = true } = req.query; // Default to dry run for safety

        // Find all appointments for this organization
        const allAppointments = await Appointment.find({ organizationId: req.user.userId })
            .populate("donorId", "Name")
            .sort({ createdAt: 1 }); // Oldest first



        // Group by donorId + requestId to find duplicates
        const groups = {};
        allAppointments.forEach(apt => {
            const key = `${apt.donorId?._id || 'unknown'}_${apt.requestId || 'unknown'}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(apt);
        });

        // Find duplicates (groups with more than 1 appointment)
        const duplicateGroups = Object.entries(groups).filter(([_, apts]) => apts.length > 1);

        const toDelete = [];
        duplicateGroups.forEach(([key, appointments]) => {
            // Keep the first (oldest) appointment, mark rest for deletion
            const [keep, ...duplicates] = appointments;

            toDelete.push(...duplicates.map(d => d._id));
        });

        if (dryRun === 'false') {
            // Actually delete
            const result = await Appointment.deleteMany({ _id: { $in: toDelete } });


            res.json({
                message: `Deleted ${result.deletedCount} duplicate appointments`,
                deletedCount: result.deletedCount,
                duplicateGroups: duplicateGroups.length
            });
        } else {
            // Dry run - just report what would be deleted
            res.json({
                message: `DRY RUN: Found ${toDelete.length} duplicate appointments that would be deleted`,
                wouldDelete: toDelete.length,
                duplicateGroups: duplicateGroups.map(([key, apts]) => ({
                    donorName: apts[0].donorId?.Name,
                    count: apts.length,
                    appointments: apts.map(a => ({
                        id: a._id,
                        status: a.status,
                        date: a.dateTime,
                        createdAt: a.createdAt
                    }))
                })),
                note: "Add ?dryRun=false to actually delete duplicates"
            });
        }
    } catch (error) {

        res.status(500).json({ message: "Failed to clean up duplicates" });
    }
});

/**
 * GET /api/appointments/org/:id
 * Get appointment details
 */
router.get("/org/:id", orgAuth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate("donorId", "Name Email phone bloodGroup location")
            .populate("requestId")
            .populate("organizationId", "organizationName Name")
            .lean();

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        // Verify organization owns this appointment
        if (appointment.organizationId._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        res.json(appointment);
    } catch (error) {

        res.status(500).json({ message: "Failed to fetch appointment" });
    }
});

/**
 * PUT /api/appointments/org/:id/complete
 * Mark appointment as completed and record donation details
 */
router.put("/org/:id/complete", orgAuth, async (req, res) => {
    try {
        const { donationSuccessful, unitsCollected, notes } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.organizationId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (appointment.status === "COMPLETED") {
            return res.status(400).json({ message: "Appointment already completed" });
        }

        appointment.status = "COMPLETED";
        appointment.donationSuccessful = donationSuccessful !== false;
        appointment.unitsCollected = unitsCollected || 0;
        appointment.notes = notes || appointment.notes;
        appointment.completedBy = req.user.userId;
        appointment.completedAt = new Date();

        await appointment.save();

        res.json({
            message: "Appointment completed successfully",
            appointment
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to complete appointment" });
    }
});

/**
 * PUT /api/appointments/org/:id/reschedule
 * Reschedule an appointment
 */
router.put("/org/:id/reschedule", orgAuth, async (req, res) => {
    try {
        const { newDateTime, reason } = req.body;

        if (!newDateTime) {
            return res.status(400).json({ message: "New date/time is required" });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.organizationId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (appointment.status !== "UPCOMING") {
            return res.status(400).json({ message: "Only upcoming appointments can be rescheduled" });
        }

        // Add to reschedule history
        if (!appointment.rescheduleHistory) {
            appointment.rescheduleHistory = [];
        }

        appointment.rescheduleHistory.push({
            oldDateTime: appointment.dateTime,
            newDateTime: new Date(newDateTime),
            rescheduledBy: req.user.userId,
            rescheduledAt: new Date(),
            reason: reason || "Rescheduled by organization"
        });

        appointment.dateTime = new Date(newDateTime);
        appointment.rescheduleCount = (appointment.rescheduleCount || 0) + 1;

        await appointment.save();

        res.json({
            message: "Appointment rescheduled successfully",
            appointment
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to reschedule appointment" });
    }
});

/**
 * PUT /api/appointments/org/:id/cancel
 * Cancel appointment (organization side)
 */
router.put("/org/:id/cancel", orgAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        if (appointment.organizationId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (appointment.status !== "UPCOMING") {
            return res.status(400).json({ message: "Only upcoming appointments can be cancelled" });
        }

        appointment.status = "CANCELLED";
        appointment.cancellationReason = reason || "Cancelled by organization";
        appointment.cancelledBy = req.user.userId;
        appointment.cancelledAt = new Date();

        await appointment.save();

        res.json({
            message: "Appointment cancelled successfully",
            appointment
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to cancel appointment" });
    }
});

// ==================== ADMIN ENDPOINTS ====================

/**
 * GET /api/appointments/admin/all
 * Get all appointments with filters (admin)
 */
router.get("/admin/all", adminAuth, async (req, res) => {
    try {
        const { status, organizationId, donorId, page = 1, limit = 50 } = req.query;
        const query = {};

        if (status && status !== "ALL") query.status = status;
        if (organizationId) query.organizationId = organizationId;
        if (donorId) query.donorId = donorId;

        const appointments = await Appointment.find(query)
            .populate("donorId", "Name Email bloodGroup")
            .populate("organizationId", "organizationName Name city")
            .populate("requestId", "bloodGroup unitsNeeded")
            .sort({ dateTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Appointment.countDocuments(query);

        res.json({
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to fetch appointments" });
    }
});

/**
 * GET /api/appointments/admin/stats
 * Get appointment statistics (admin)
 */
router.get("/admin/stats", adminAuth, async (req, res) => {
    try {
        const totalAppointments = await Appointment.countDocuments();
        const upcomingAppointments = await Appointment.countDocuments({ status: "UPCOMING" });
        const completedAppointments = await Appointment.countDocuments({ status: "COMPLETED" });
        const cancelledAppointments = await Appointment.countDocuments({ status: "CANCELLED" });

        const successfulDonations = await Appointment.countDocuments({
            status: "COMPLETED",
            donationSuccessful: true
        });

        const totalUnitsCollected = await Appointment.aggregate([
            { $match: { status: "COMPLETED", donationSuccessful: true } },
            { $group: { _id: null, total: { $sum: "$unitsCollected" } } }
        ]);

        const completionRate = totalAppointments > 0
            ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
            : 0;

        const successRate = completedAppointments > 0
            ? ((successfulDonations / completedAppointments) * 100).toFixed(1)
            : 0;

        res.json({
            total: totalAppointments,
            upcoming: upcomingAppointments,
            completed: completedAppointments,
            cancelled: cancelledAppointments,
            successfulDonations,
            totalUnitsCollected: totalUnitsCollected[0]?.total || 0,
            completionRate: parseFloat(completionRate),
            successRate: parseFloat(successRate)
        });
    } catch (error) {

        res.status(500).json({ message: "Failed to fetch statistics" });
    }
});

export default router;
