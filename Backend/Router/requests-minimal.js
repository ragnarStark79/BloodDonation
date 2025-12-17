import express from "express";
import Request from "../modules/Request.js";
import User from "../modules/User.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { REQUEST_STATUS } from "../config/constants.js";

const router = express.Router();

// Simple auth - just verify token exists
const auth = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ message: "No token" });
        const decoded = jwt.verify(token, env.jwtSecret);
        req.user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ message: "Invalid token", error: e.message });
    }
};

// POST /api/requests/org - Create request
router.post("/org", auth, async (req, res) => {
    console.log("🔵 Request received to create blood request");
    console.log("🔵 User:", req.user);
    console.log("🔵 Body:", req.body);

    try {
        const { bloodGroup, unitsNeeded, component, urgency, contactPerson, contactPhone, caseDetails } = req.body;

        if (!bloodGroup || !unitsNeeded) {
            return res.status(400).json({ message: "Blood group and units are required" });
        }

        const org = await User.findById(req.user.userId);
        if (!org) {
            return res.status(404).json({ message: "Organization not found" });
        }

        console.log("✅ Org found:", org.organizationName);

        const newRequest = new Request({
            organizationId: req.user.userId,
            bloodGroup,
            unitsNeeded: parseInt(unitsNeeded),
            component: component || "WHOLE_BLOOD",
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
            status: REQUEST_STATUS.OPEN
        });

        await newRequest.save();
        console.log("✅ Request created:", newRequest._id);

        res.status(201).json({ message: "Success", request: newRequest });
    } catch (error) {
        console.error("❌ ERROR:", error);
        console.error("❌ Stack:", error.stack);
        res.status(500).json({ message: "Failed", error: error.message, stack: error.stack });
    }
});

// GET /api/requests/org/mine - Get my requests
router.get("/org/mine", auth, async (req, res) => {
    try {
        const requests = await Request.find({ organizationId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ requests, total: requests.length });
    } catch (error) {
        console.error("❌ Error fetching:", error);
        res.status(500).json({ message: "Failed", error: error.message });
    }
});

// GET /api/requests/:id - Get single request
router.get("/:id", auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate("organizationId", "organizationName");

        if (!request) {
            return res.status(404).json({ message: "Not found" });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: "Failed", error: error.message });
    }
});

export default router;
