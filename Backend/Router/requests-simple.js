import express from "express";
import Request from "../modules/Request.js";
import User from "../modules/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { REQUEST_STATUS } from "../config/constants.js";

const router = express.Router();

/**
 * Inline auth middleware for this simplified router
 */
const simpleOrgAuth = (req, res, next) => {
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

/**
 * POST /api/requests/org
 * Create a new blood request (Hospital)
 */
router.post("/org", simpleOrgAuth, async (req, res) => {
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

        // Basic validation
        if (!bloodGroup || !unitsNeeded) {
            return res.status(400).json({ message: "Blood group and units needed are required" });
        }

        // Get organization
        const org = await User.findById(req.user.userId);
        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        console.log("✅ Organization found:", org.organizationName);

        // Build request with minimal required fields
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
        console.error("❌ Error stack:", error.stack);
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
router.get("/org/mine", simpleOrgAuth, async (req, res) => {
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

export default router;
