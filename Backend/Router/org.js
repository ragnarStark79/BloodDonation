import express from "express";
import mongoose from "mongoose";
import { auth } from "../Middleware/auth.js";
import { ROLES, REQUEST_STATUS, ORG_TYPES } from "../config/constants.js";
import { requireOrgType, canManageInventory, canCreateRequests, canViewIncoming } from "../Middleware/orgAuth.js";
import BloodUnit from "../modules/BloodUnit.js";
import Request from "../modules/Request.js";
import User from "../modules/User.js";
import Appointment from "../modules/Appointment.js";
import Camp from "../modules/Camp.js";
import Donation from "../modules/Donation.js";

const router = express.Router();

// ============ DASHBOARD HOME ============
// Comprehensive dashboard with role-based stats
router.get("/dashboard", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;
    const org = await User.findById(orgId).select("Name organizationType organizationName Email City").lean();

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const orgType = org.organizationType;
    const response = {
      organization: org,
      stats: {},
      myRequests: null,
      incomingRequests: null,
      todayAppointments: null,
      inventoryAlerts: null
    };

    // Stats for all orgs
    const [openRequests, upcomingAppts] = await Promise.all([
      Request.countDocuments({ createdBy: orgId, status: REQUEST_STATUS.OPEN }),
      Appointment.countDocuments({
        organizationId: orgId,
        status: "UPCOMING",
        dateTime: { $gte: new Date() }
      })
    ]);

    response.stats.openRequests = openRequests;
    response.stats.upcomingAppts = upcomingAppts;

    // Inventory stats (for blood banks only)
    if (orgType === ORG_TYPES.BLOOD_BANK) {
      const [availableUnits, expiringSoon] = await Promise.all([
        BloodUnit.countDocuments({ organizationId: orgId, status: "AVAILABLE" }),
        BloodUnit.countDocuments({
          organizationId: orgId,
          status: "AVAILABLE",
          expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), $gte: new Date() }
        })
      ]);

      response.stats.availableUnits = availableUnits;
      response.stats.expiringSoon = expiringSoon;

      // Inventory by blood group
      const inventoryByGroup = await BloodUnit.aggregate([
        { $match: { organizationId: orgId, status: "AVAILABLE" } },
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      response.stats.inventoryByGroup = inventoryByGroup;

      // Inventory alerts (expiring soon items)
      const expiringItems = await BloodUnit.find({
        organizationId: orgId,
        status: "AVAILABLE",
        expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), $gte: new Date() }
      })
        .sort({ expiryDate: 1 })
        .limit(5)
        .select("bloodGroup component expiryDate barcode")
        .lean();

      response.inventoryAlerts = expiringItems;
    }

    // My Requests (for hospitals)
    if (orgType === ORG_TYPES.HOSPITAL) {
      const myRequests = await Request.find({
        createdBy: orgId,
        status: { $in: [REQUEST_STATUS.OPEN, REQUEST_STATUS.ASSIGNED] }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      response.myRequests = myRequests;
    }

    // Incoming Requests (for blood banks)
    if (orgType === ORG_TYPES.BLOOD_BANK) {
      // Get blood groups available in inventory
      const availableGroups = await BloodUnit.distinct("bloodGroup", {
        organizationId: orgId,
        status: "AVAILABLE"
      });

      const incomingRequests = await Request.find({
        status: REQUEST_STATUS.OPEN,
        bloodGroup: { $in: availableGroups },
        createdBy: { $ne: orgId } // Not my own requests
      })
        .sort({ urgency: -1, createdAt: -1 })
        .limit(5)
        .populate("createdBy", "Name organizationName City")
        .lean();

      response.incomingRequests = incomingRequests;
    }

    // Today's Appointments (all orgs)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      organizationId: orgId,
      dateTime: { $gte: today, $lt: tomorrow },
      status: "UPCOMING"
    })
      .populate("donorId", "Name bloodGroup Email")
      .sort({ dateTime: 1 })
      .lean();

    response.todayAppointments = todayAppointments;

    res.json(response);
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============ DONATION STATS ============
// Real-time donation pipeline statistics
router.get("/donation-stats", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;

    // Get current date boundaries
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // IMPORTANT: In aggregation, we MUST cast orgId to ObjectId
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    // Count by stage
    const byStage = await Donation.aggregate([
      { $match: { organizationId: orgObjectId } },
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);
    console.log('📊 Donation stats by stage:', byStage);

    // Convert to object
    const stageStats = {
      "new-donors": 0,
      "screening": 0,
      "in-progress": 0,
      "completed": 0,
      "ready-storage": 0
    };
    byStage.forEach(item => {
      if (stageStats.hasOwnProperty(item._id)) {
        stageStats[item._id] = item.count;
      }
    });

    // Total in pipeline
    const totalInPipeline = Object.values(stageStats).reduce((a, b) => a + b, 0);

    // Time-based counts
    const [today, thisWeek, thisMonth] = await Promise.all([
      Donation.countDocuments({
        organizationId: orgId,
        createdAt: { $gte: todayStart }
      }),
      Donation.countDocuments({
        organizationId: orgId,
        createdAt: { $gte: weekStart }
      }),
      Donation.countDocuments({
        organizationId: orgId,
        createdAt: { $gte: monthStart }
      })
    ]);

    // Success rate calculation
    const completedDonations = await Donation.find({
      organizationId: orgId,
      stage: { $in: ["completed", "ready-storage"] }
    }).select("labTests").lean();

    const passedTests = completedDonations.filter(d => d.labTests?.allTestsPassed === true).length;
    const successRate = completedDonations.length > 0
      ? Math.round((passedTests / completedDonations.length) * 100 * 10) / 10
      : 0;

    // Completed today
    const completedToday = await Donation.countDocuments({
      organizationId: orgId,
      stage: { $in: ["completed", "ready-storage"] },
      updatedAt: { $gte: todayStart }
    });

    const failedTests = completedDonations.filter(d => d.labTests?.allTestsPassed === false).length;

    const response = {
      totalInPipeline,
      byStage: stageStats,
      today,
      thisWeek,
      thisMonth,
      successRate,
      completedToday,
      failedTests
    };
    console.log('✅ Sending donation pipeline stats:', response);
    res.json(response);
  } catch (error) {
    console.error("Donation stats error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============ CHART DATA ENDPOINTS ============
// Monthly donation trends for line chart
router.get("/monthly-donation-trends", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;

    // Get last 12 months of data
    const monthsData = [];
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Import Request model dynamically to ensure it's available
    const Request = mongoose.model('Request');

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [donationCount, requestCount] = await Promise.all([
        Donation.countDocuments({
          organizationId: orgId,
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }),
        Request.countDocuments({
          'assignedTo.organizationId': orgId,  // Blood bank who fulfilled it
          status: "FULFILLED",
          updatedAt: { $gte: monthStart, $lte: monthEnd }
        })
      ]);

      // Debug logging for December and November
      if (i === 0 || i === 1) {
        console.log(`Month ${monthNames[monthStart.getMonth()]}:`, {
          orgId,
          monthStart: monthStart.toISOString(),
          monthEnd: monthEnd.toISOString(),
          donationCount,
          requestCount
        });
      }

      monthsData.push({
        month: monthNames[monthStart.getMonth()],
        donations: donationCount,
        requests: requestCount
      });
    }

    console.log('📈 Monthly Trends Data:', monthsData);
    res.json(monthsData);
  } catch (error) {
    console.error("Monthly trends error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Blood group distribution for pie chart
router.get("/blood-group-distribution", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;
    console.log('🩸 Blood distribution API called for org:', orgId);

    // Get inventory counts by blood group
    const distribution = await BloodUnit.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId), status: "AVAILABLE" } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Blood distribution raw data:', distribution);

    // Define color palette matching chart design
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

    // Format for pie chart
    const chartData = distribution.map(item => ({
      name: item._id,
      value: item.count,
      color: colorMap[item._id] || '#ef4444'
    }));

    console.log('✅ Sending chart data:', chartData);
    res.json(chartData);
  } catch (error) {
    console.error("❌ Blood distribution error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ============ BLOOD BANK FEATURES ============
// Reserve matching blood units for an incoming request
router.post("/requests/:id/reserve", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id).lean();
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Find AVAILABLE units in this org matching blood group, soonest expiry first
    const units = await BloodUnit.find({
      organizationId: req.user.userId,
      status: "AVAILABLE",
      bloodGroup: request.bloodGroup,
    })
      .sort({ expiryDate: 1 })
      .limit(request.units)
      .select("_id")
      .lean();

    if (!units.length) {
      return res.status(200).json({ reserved: 0, message: "No available units to reserve" });
    }

    await BloodUnit.updateMany(
      { _id: { $in: units.map((u) => u._id) } },
      { $set: { status: "RESERVED" } }
    );

    res.json({ reserved: units.length, message: "Units reserved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark that this org cannot help for an incoming request (no DB state change)
router.post("/requests/:id/cannot-help", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id).lean();
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ message: "Noted. No units reserved for this request." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ INVENTORY MANAGEMENT ============
// Inventory list (Blood Banks only)
router.get("/inventory", auth([ROLES.ORGANIZATION]), canManageInventory, async (req, res) => {
  try {
    const items = await BloodUnit.find({ organizationId: req.user.userId })
      .sort({ expiryDate: 1 })
      .lean();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add inventory (Blood Banks only)
router.post("/inventory", auth([ROLES.ORGANIZATION]), canManageInventory, async (req, res) => {
  try {
    const { group, component, collectionDate, expiryDate, barcode } = req.body;
    if (!group || !collectionDate || !expiryDate) {
      return res.status(400).json({ message: "group, collectionDate, expiryDate are required" });
    }

    console.log('💉 Adding blood unit for org:', req.user.userId);

    const unit = await BloodUnit.create({
      organizationId: req.user.userId,
      bloodGroup: group,
      component,
      collectionDate,
      expiryDate,
      barcode,
    });

    console.log('✅ Blood unit created:', { id: unit._id, bloodGroup: unit.bloodGroup, status: unit.status, orgId: unit.organizationId });

    res.status(201).json(unit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Expiring inventory within 7 days (Blood Banks only)
router.get("/inventory/expiring", auth([ROLES.ORGANIZATION]), canManageInventory, async (req, res) => {
  try {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(now.getDate() + 7);
    const items = await BloodUnit.find({
      organizationId: req.user.userId,
      status: "AVAILABLE",
      expiryDate: { $lte: cutoff, $gte: now },
    })
      .sort({ expiryDate: 1 })
      .lean();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ BATCH OPERATIONS ============
// Bulk reserve blood units
router.put("/inventory/batch/reserve", auth([ROLES.ORGANIZATION]), canManageInventory, async (req, res) => {
  try {
    const { unitIds, requestId } = req.body;

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return res.status(400).json({ message: "unitIds array is required" });
    }

    // Update only AVAILABLE units owned by this organization
    const result = await BloodUnit.updateMany(
      {
        _id: { $in: unitIds },
        organizationId: req.user.userId,
        status: "AVAILABLE"
      },
      {
        $set: {
          status: "RESERVED",
          reservedAt: new Date(),
          reservedBy: req.user.userId
        }
      }
    );

    // If requestId is provided, update the request status
    if (requestId) {
      await Request.findByIdAndUpdate(requestId, {
        $set: {
          status: REQUEST_STATUS.ASSIGNED,
          reservedUnits: unitIds,
          reservedBy: req.user.userId,
          reservedAt: new Date(),
          'assignedTo.type': 'BLOOD_BANK',
          'assignedTo.organizationId': req.user.userId
        }
      });
      console.log(`✅ Request ${requestId} marked as ASSIGNED with ${result.modifiedCount} units reserved`);
    }

    res.json({
      message: `${result.modifiedCount} unit(s) reserved`,
      count: result.modifiedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk issue blood units
router.put("/inventory/batch/issue", auth([ROLES.ORGANIZATION]), canManageInventory, async (req, res) => {
  try {
    const { unitIds } = req.body;

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return res.status(400).json({ message: "unitIds array is required" });
    }

    // Update AVAILABLE or RESERVED units to ISSUED
    const result = await BloodUnit.updateMany(
      {
        _id: { $in: unitIds },
        organizationId: req.user.userId,
        status: { $in: ["AVAILABLE", "RESERVED"] }
      },
      { $set: { status: "ISSUED" } }
    );

    res.json({
      message: `${result.modifiedCount} unit(s) issued`,
      count: result.modifiedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Bulk mark as expired
router.put("/inventory/batch/expire", auth([ROLES.ORGANIZATION]), canManageInventory, async (req, res) => {
  try {
    const { unitIds } = req.body;

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return res.status(400).json({ message: "unitIds array is required" });
    }

    // Mark units as EXPIRED
    const result = await BloodUnit.updateMany(
      {
        _id: { $in: unitIds },
        organizationId: req.user.userId,
        status: { $in: ["AVAILABLE", "RESERVED"] }
      },
      { $set: { status: "EXPIRED" } }
    );

    res.json({
      message: `${result.modifiedCount} unit(s) marked as expired`,
      count: result.modifiedCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ REQUEST MANAGEMENT ============
// Incoming requests matching inventory (Blood Banks only) - ENHANCED
router.get("/requests/incoming", auth([ROLES.ORGANIZATION]), canViewIncoming, async (req, res) => {
  try {
    const orgId = req.user.userId;
    console.log('🔍 [Incoming Requests] Blood Bank ID:', orgId);

    // Get blood bank's location for distance calculation
    const bloodBank = await User.findById(orgId).select("locationGeo Name organizationName").lean();

    if (!bloodBank) {
      return res.status(404).json({ message: "Organization not found" });
    }
    console.log('🏦 [Incoming Requests] Blood Bank:', bloodBank.organizationName || bloodBank.Name);

    // IMPORTANT: Convert orgId to ObjectId for aggregate query
    const orgObjectId = new mongoose.Types.ObjectId(orgId);

    // Get available blood groups with counts per group
    const inventoryCounts = await BloodUnit.aggregate([
      {
        $match: {
          organizationId: orgObjectId,  // Use ObjectId instead of string
          status: "AVAILABLE"
        }
      },
      {
        $group: {
          _id: "$bloodGroup",
          count: { $sum: 1 }
        }
      }
    ]);

    // Create map: bloodGroup -> available count
    const groupCountMap = {};
    const availableGroups = [];
    inventoryCounts.forEach(item => {
      groupCountMap[item._id] = item.count;
      availableGroups.push(item._id);
    });

    console.log('📦 [Incoming Requests] Available Groups:', availableGroups);
    console.log('📊 [Incoming Requests] Inventory Counts:', groupCountMap);

    // If no inventory, return empty array
    if (availableGroups.length === 0) {
      console.log('❌ [Incoming Requests] No inventory found, returning empty array');
      return res.json([]);
    }

    // Get requests matching available blood groups
    const requests = await Request.find({
      bloodGroup: { $in: availableGroups },
      status: REQUEST_STATUS.OPEN,
      createdBy: { $ne: orgId } // Don't show own requests
    })
      .populate("createdBy", "Name organizationName City Email Phone locationGeo")
      .sort({ urgency: -1, createdAt: -1 })
      .limit(50)
      .lean();

    console.log('📋 [Incoming Requests] Found requests:', requests.length);

    // Enrich requests with stock availability and distance
    const enrichedRequests = requests.map(request => {
      const availableUnits = groupCountMap[request.bloodGroup] || 0;
      const canFulfill = availableUnits >= request.unitsNeeded;

      // Calculate distance if both have location
      let distance = null;
      if (bloodBank.locationGeo && request.location && request.location.coordinates) {
        // Simple distance calculation using Haversine formula
        const [lng1, lat1] = bloodBank.locationGeo.coordinates || [0, 0];
        const [lng2, lat2] = request.location.coordinates || [0, 0];

        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c; // Distance in km
      }

      return {
        ...request,
        canFulfill,
        availableUnits,
        distance,
        // Add hospital name for easier display
        hospitalName: request.createdBy?.organizationName || request.createdBy?.Name,
        contactPhone: request.createdBy?.Phone || request.contactPhone
      };
    });

    res.json(enrichedRequests);
  } catch (err) {
    console.error("Incoming requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create request (Hospitals only)
router.post("/requests", auth([ROLES.ORGANIZATION]), canCreateRequests, async (req, res) => {
  try {
    const { group, units, urgency, lat, lng, caseId, notes, component } = req.body;
    if (!group || !units || !lat || !lng) {
      return res
        .status(400)
        .json({ message: "group, units, lat, lng are required to create a request" });
    }
    const doc = await Request.create({
      createdBy: req.user.userId,
      bloodGroup: group,
      units,
      urgency,
      component,
      locationGeo: { type: "Point", coordinates: [Number(lng), Number(lat)] },
      caseId,
      notes,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Organization's own requests (Hospitals only)
router.get("/requests", auth([ROLES.ORGANIZATION]), canCreateRequests, async (req, res) => {
  try {
    const list = await Request.find({ createdBy: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update request status
router.put("/requests/:id/status", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const allowed = [REQUEST_STATUS.FULFILLED, REQUEST_STATUS.CANCELLED, REQUEST_STATUS.ASSIGNED];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }
    const updated = await Request.findOneAndUpdate(
      { _id: id, createdBy: req.user.userId },
      { status, fulfilledAt: status === REQUEST_STATUS.FULFILLED ? new Date() : undefined },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Request not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark request fulfilled with optional blood units tracking
router.put("/requests/:id/fulfill", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const { unitsReceived, bloodUnitIds = [], notes } = req.body;

    const request = await Request.findOne({ _id: id, createdBy: req.user.userId });
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = REQUEST_STATUS.FULFILLED;
    request.fulfilledAt = new Date();
    if (notes) request.notes = notes;
    await request.save();

    // If specific blood units are provided, mark them as ISSUED
    if (Array.isArray(bloodUnitIds) && bloodUnitIds.length > 0) {
      await BloodUnit.updateMany(
        { _id: { $in: bloodUnitIds }, organizationId: req.user.userId },
        { $set: { status: "ISSUED" } }
      );
    }

    res.json({
      message: "Request fulfilled",
      request,
      unitsReceived: unitsReceived || request.units,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get matches (nearby donors and orgs) - simple geo query for donors
router.get("/requests/:id/matches", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id).lean();
    if (!request) return res.status(404).json({ message: "Request not found" });
    const { coordinates } = request.locationGeo || {};
    if (!coordinates) return res.status(400).json({ message: "Request has no location" });

    const donors = await User.find({
      Role: { $in: ["donor", ROLES.DONOR] },
      bloodGroup: request.bloodGroup,
      locationGeo: {
        $near: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: 10000,
        },
      },
    })
      .limit(50)
      .select("Name Email bloodGroup locationGeo lastDonationDate")
      .lean();

    res.json({ donors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Assign donor to request
router.post("/requests/:id/assign-donor", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { donorId } = req.body;
    if (!donorId) return res.status(400).json({ message: "donorId is required" });
    const { id } = req.params;
    const request = await Request.findOneAndUpdate(
      { _id: id, createdBy: req.user.userId },
      { assignedTo: donorId, status: REQUEST_STATUS.ASSIGNED },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Camps - Create (Blood Banks only)
router.post("/camps", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    // Check if organization is a blood bank
    const org = await User.findById(req.user.userId).select("organizationType").lean();
    if (!org || org.organizationType !== "BANK") {
      return res.status(403).json({
        message: "Only blood banks can organize donation camps. Hospitals don't have inventory management."
      });
    }

    const {
      title,
      date,
      startTime,
      endTime,
      description,
      lat,
      lng,
      address,
      capacity,
      contactPerson,
      contactPhone,
      requirements,
      bloodGroupsNeeded
    } = req.body;

    if (!title || !date || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "title, date, lat, lng are required" });
    }

    const camp = await Camp.create({
      organizationId: req.user.userId,
      title,
      date,
      startTime,
      endTime,
      description,
      location: {
        coordinates: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        address,
      },
      capacity,
      contactPerson,
      contactPhone,
      requirements: requirements || [],
      bloodGroupsNeeded: bloodGroupsNeeded || [],
    });

    res.status(201).json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Stats (simplified)
router.get("/stats", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;
    const [availableUnits, expiringSoon, openRequests, upcomingAppts] = await Promise.all([
      BloodUnit.countDocuments({ organizationId: orgId, status: "AVAILABLE" }),
      BloodUnit.countDocuments({
        organizationId: orgId,
        expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      }),
      Request.countDocuments({ createdBy: orgId, status: REQUEST_STATUS.OPEN }),
      Appointment.countDocuments({ organizationId: orgId, status: "UPCOMING" }),
    ]);
    res.json({ availableUnits, expiringSoon, openRequests, upcomingAppts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Camps
router.get("/camps", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const list = await Camp.find({ organizationId: req.user.userId }).sort({ date: 1 }).lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Camp Participants for Pipeline
router.get("/camps/participants", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { date } = req.query; // Optional filter by date

    let query = { organizationId: req.user.userId };
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    } else {
      // Default to showing participants from ONGOING camps
      query.status = "ONGOING";
    }

    const camps = await Camp.find(query)
      .populate("registeredDonors", "Name Email PhoneNumber bloodGroup Gender DateOfBirth")
      .lean();

    // Flatten participants for pipeline view
    const participants = camps.flatMap(camp =>
      (camp.registeredDonors || [])
        .filter(donor => donor && donor._id) // Filter out null or broken references
        .map(donor => ({
          ...donor,
          _id: donor._id.toString(), // Ensure ID is string for frontend
          campId: camp._id.toString(),
          campTitle: camp.title,
          isAttended: (camp.attendedDonors || []).some(id => id && id.toString() === donor._id.toString())
        }))
    );

    res.json(participants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Single Camp
router.get("/camps/:id", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const camp = await Camp.findOne({
      _id: id,
      organizationId: req.user.userId
    })
      .populate("registeredDonors", "Name Email PhoneNumber bloodGroup")
      .populate("attendedDonors", "Name Email PhoneNumber bloodGroup")
      .lean();

    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    res.json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Camp
router.put("/camps/:id", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      date,
      startTime,
      endTime,
      description,
      lat,
      lng,
      address,
      capacity,
      contactPerson,
      contactPhone,
      requirements,
      bloodGroupsNeeded,
      status
    } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (date) updateData.date = date;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (requirements) updateData.requirements = requirements;
    if (bloodGroupsNeeded) updateData.bloodGroupsNeeded = bloodGroupsNeeded;
    if (status) updateData.status = status;

    if (lat !== undefined && lng !== undefined) {
      updateData.location = {
        coordinates: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        address: address || ""
      };
    } else if (address !== undefined) {
      updateData["location.address"] = address;
    }

    const camp = await Camp.findOneAndUpdate(
      { _id: id, organizationId: req.user.userId },
      updateData,
      { new: true }
    ).lean();

    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    res.json(camp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Camp
router.delete("/camps/:id", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const camp = await Camp.findOneAndDelete({
      _id: id,
      organizationId: req.user.userId
    });

    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    res.json({ message: "Camp deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Camp Statistics
router.get("/camps/stats/overview", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;
    const now = new Date();

    const [totalCamps, upcomingCamps, completedCamps, totalRegistrations] = await Promise.all([
      Camp.countDocuments({ organizationId: orgId }),
      Camp.countDocuments({
        organizationId: orgId,
        status: "PLANNED",
        date: { $gte: now }
      }),
      Camp.countDocuments({
        organizationId: orgId,
        status: "COMPLETED"
      }),
      Camp.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
        { $project: { count: { $size: "$registeredDonors" } } },
        { $group: { _id: null, total: { $sum: "$count" } } }
      ])
    ]);

    res.json({
      totalCamps,
      upcomingCamps,
      completedCamps,
      totalRegistrations: totalRegistrations[0]?.total || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark/Toggle Attendance
router.put("/camps/:id/attendance/:donorId", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id, donorId } = req.params;
    const { attended } = req.body;

    const camp = await Camp.findOne({
      _id: id,
      organizationId: req.user.userId
    });

    if (!camp) {
      return res.status(404).json({ message: "Camp not found" });
    }

    const donorIndex = camp.attendedDonors.indexOf(donorId);

    if (attended && donorIndex === -1) {
      camp.attendedDonors.push(donorId);
    } else if (!attended && donorIndex !== -1) {
      camp.attendedDonors.splice(donorIndex, 1);
    }

    await camp.save();
    res.json({ message: "Attendance updated", attendedDonors: camp.attendedDonors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Detailed Camp Stats
router.get("/camps/:id/analytics", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const camp = await Camp.findOne({
      _id: req.params.id,
      organizationId: req.user.userId
    }).populate("registeredDonors", "Name Email bloodGroup");

    if (!camp) return res.status(404).json({ message: "Camp not found" });

    // Fetch all donations linked to this camp
    const donations = await Donation.find({ campId: camp._id, status: { $in: ["active", "completed"] } });

    const bloodGroupStats = donations.reduce((acc, donation) => {
      acc[donation.bloodGroup] = (acc[donation.bloodGroup] || 0) + (donation.unitsCollected || 1);
      return acc;
    }, {});

    const stats = {
      title: camp.title,
      date: camp.date,
      totalRegistered: camp.registeredDonors.length,
      totalAttended: camp.attendedDonors.length,
      totalUnitsCollected: donations.reduce((sum, d) => sum + (d.unitsCollected || 1), 0),
      bloodGroupStats,
      attendanceRate: camp.registeredDonors.length > 0
        ? ((camp.attendedDonors.length / camp.registeredDonors.length) * 100).toFixed(1)
        : 0
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Export Camp Report (CSV)
router.get("/camps/:id/export", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const camp = await Camp.findOne({
      _id: req.params.id,
      organizationId: req.user.userId
    }).populate("registeredDonors", "Name Email PhoneNumber bloodGroup Gender DateOfBirth");

    if (!camp) return res.status(404).json({ message: "Camp not found" });

    // Get donations for this camp to show collection results
    const donations = await Donation.find({ campId: camp._id });

    let csv = "Donor Name,Email,Phone,Blood Group,Gender,Status,Units Collected,Notes\n";

    camp.registeredDonors.forEach(donor => {
      const isAttended = camp.attendedDonors.includes(donor._id.toString());
      const donation = donations.find(d => d.donorId?.toString() === donor._id.toString());

      csv += `"${donor.Name}","${donor.Email}","${donor.PhoneNumber || ''}","${donor.bloodGroup}","${donor.Gender || ''}","${isAttended ? 'Attended' : 'Registered'}","${donation?.unitsCollected || 0}","${donation?.notes || ''}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=camp_report_${req.params.id}.csv`);
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get Appointments
router.get("/appointments", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const list = await Appointment.find({ organizationId: req.user.userId })
      .populate("donorId", "Name Email bloodGroup PhoneNumber Phone location")
      .sort({ dateTime: 1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Complete appointment (Donor donated)
router.put("/appointments/:id/complete", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;
    const { donationSuccessful, unitsCollected, notes, bloodGroup, barcode, expiryDate } = req.body;

    const appointment = await Appointment.findOne({
      _id: id,
      organizationId: req.user.userId,
    }).populate("donorId");

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (appointment.status === "COMPLETED") {
      return res.status(400).json({ message: "Appointment already completed" });
    }

    appointment.status = "COMPLETED";
    appointment.donationSuccessful = donationSuccessful;
    appointment.unitsCollected = unitsCollected || 0;
    appointment.notes = notes;
    await appointment.save();

    if (donationSuccessful) {
      // 1. Update Donor lastDonationDate
      await User.findByIdAndUpdate(appointment.donorId._id, {
        lastDonationDate: new Date(),
      });

      // 2. Add to Inventory (if unit details provided)
      if (unitsCollected > 0 && bloodGroup && barcode && expiryDate) {
        // Create a blood unit for each collected unit (usually 1 per appointment)
        // For simplicity, we assume 1 unit per appointment for now unless loop needed
        await BloodUnit.create({
          organizationId: req.user.userId,
          bloodGroup: bloodGroup,
          component: "Whole Blood", // Default or pass from body
          collectionDate: new Date(),
          expiryDate: expiryDate,
          barcode: barcode,
          status: "AVAILABLE"
        });
      }
    }

    res.json({ message: "Appointment completed", appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start Donation from Appointment
router.post("/appointments/:id/start-donation", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      _id: id,
      organizationId: req.user.userId,
    }).populate("donorId", "Name Email bloodGroup Phone");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status !== "UPCOMING") {
      return res.status(400).json({ message: "Can only start donation for upcoming appointments" });
    }

    // Check if donation already exists for this appointment
    const { default: Donation } = await import("../modules/Donation.js");
    const existingDonation = await Donation.findOne({ appointmentId: id });

    if (existingDonation) {
      return res.status(400).json({
        message: "Donation already started for this appointment",
        donationId: existingDonation._id
      });
    }

    // Create donation with donor data from appointment
    const donation = await Donation.create({
      donorId: appointment.donorId._id,
      donorName: appointment.donorId.Name,
      bloodGroup: appointment.donorId.bloodGroup,
      phone: appointment.donorId.Phone || "",
      email: appointment.donorId.Email || "",
      appointmentId: id,
      stage: "new-donors",
      createdBy: req.user.userId,
      organizationId: req.user.userId,
      notes: `Created from appointment on ${new Date(appointment.dateTime).toLocaleDateString()}`,
    });

    // Add initial history entry
    await donation.addHistoryEntry(
      "Donation created from appointment",
      req.user.userId,
      `Donor arrived for scheduled appointment`
    );

    res.status(201).json({
      message: "Donation started successfully",
      donation: {
        id: donation._id.toString(),
        name: donation.donorName,
        group: donation.bloodGroup,
        date: donation.donationDate,
        stage: donation.stage,
        appointmentId: donation.appointmentId,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ============ ANALYTICS ============
router.get("/analytics", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const orgId = req.user.userId;
    const org = await User.findById(orgId).select("organizationType").lean();
    const orgType = org?.organizationType;

    const analytics = {
      requestStats: null,
      inventoryStats: null,
      appointmentStats: null,
      trends: null
    };

    // Request statistics (for hospitals)
    if (orgType === ORG_TYPES.HOSPITAL) {
      const [totalRequests, fulfilledRequests, cancelledRequests] = await Promise.all([
        Request.countDocuments({ createdBy: orgId }),
        Request.countDocuments({ createdBy: orgId, status: REQUEST_STATUS.FULFILLED }),
        Request.countDocuments({ createdBy: orgId, status: REQUEST_STATUS.CANCELLED })
      ]);

      const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests * 100).toFixed(1) : 0;

      analytics.requestStats = {
        total: totalRequests,
        fulfilled: fulfilledRequests,
        cancelled: cancelledRequests,
        open: totalRequests - fulfilledRequests - cancelledRequests,
        fulfillmentRate
      };

      // Request by urgency
      const requestsByUrgency = await Request.aggregate([
        { $match: { createdBy: orgId } },
        { $group: { _id: "$urgency", count: { $sum: 1 } } }
      ]);
      analytics.requestStats.byUrgency = requestsByUrgency;
    }

    // Inventory statistics (for blood banks)
    if (orgType === ORG_TYPES.BLOOD_BANK) {
      const inventoryByStatus = await BloodUnit.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const inventoryByGroup = await BloodUnit.aggregate([
        { $match: { organizationId: orgId, status: "AVAILABLE" } },
        { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      analytics.inventoryStats = {
        byStatus: inventoryByStatus,
        byGroup: inventoryByGroup
      };
    }

    // Appointment statistics (all orgs)
    const [totalAppts, completedAppts, upcomingAppts] = await Promise.all([
      Appointment.countDocuments({ organizationId: orgId }),
      Appointment.countDocuments({ organizationId: orgId, status: "COMPLETED" }),
      Appointment.countDocuments({ organizationId: orgId, status: "UPCOMING" })
    ]);

    analytics.appointmentStats = {
      total: totalAppts,
      completed: completedAppts,
      upcoming: upcomingAppts
    };

    res.json(analytics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

