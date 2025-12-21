import express from "express";
import { auth } from "../Middleware/auth.js";
import {
  ACCOUNT_STATUS,
  ROLES,
  VERIFICATION_STATUS,
  REQUEST_STATUS,
} from "../config/constants.js";
import User from "../modules/User.js";
import Request from "../modules/Request.js";
import BloodUnit from "../modules/BloodUnit.js";
import Appointment from "../modules/Appointment.js";
import ProfileUpdate from "../modules/ProfileUpdate.js";
import Notification from "../modules/Notification.js";
import AuditLog from "../modules/AuditLog.js";

const router = express.Router();

// helper to record audit logs
const logAction = async ({ adminId, action, targetId, targetType, details }) => {
  try {
    await AuditLog.create({ adminId, action, targetId, targetType, details });
  } catch (err) {
    console.error("[AuditLog] failed to record log", err?.message || err);
  }
};

// Users listing with filters and pagination
router.get("/users", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.Role = role.toLowerCase();
    if (status) query.accountStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Pending verification
router.get("/users/pending-verification", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const items = await User.find({ verificationStatus: VERIFICATION_STATUS.PENDING }).lean();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify user
router.put("/users/:id/verify", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (![VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: status,
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "User not found" });
    await logAction({
      adminId: req.user.userId,
      action: "USER_VERIFY",
      targetId: updated._id,
      targetType: "User",
      details: { status, reason },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Block user
router.put("/users/:id/block", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: ACCOUNT_STATUS.BLOCKED },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "User not found" });
    await logAction({
      adminId: req.user.userId,
      action: "USER_BLOCK",
      targetId: updated._id,
      targetType: "User",
      details: { accountStatus: updated.accountStatus },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Stats
router.get("/stats", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const [totalDonors, totalOrgs, totalRequests, fulfilledRequests, units, expiring] =
      await Promise.all([
        User.countDocuments({ Role: { $in: ["donor", ROLES.DONOR] } }),
        User.countDocuments({ Role: { $in: ["hospital", "bloodbank", ROLES.ORGANIZATION] } }),
        Request.countDocuments({}),
        Request.countDocuments({ status: REQUEST_STATUS.FULFILLED }),
        BloodUnit.countDocuments({}),
        BloodUnit.countDocuments({
          expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        }),
      ]);

    res.json({
      totalDonors,
      totalOrgs,
      totalRequests,
      fulfilledRequests,
      units,
      expiring,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Alerts (simple version)
router.get("/alerts", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const unfulfilled = await Request.find({
      status: { $in: [REQUEST_STATUS.OPEN, REQUEST_STATUS.ASSIGNED] },
      createdAt: { $lte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // older than 2h
    })
      .limit(20)
      .lean();
    const expiringUnits = await BloodUnit.find({
      expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
      .limit(20)
      .lean();
    res.json({ unfulfilled, expiringUnits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Audit logs with pagination/filter
router.get("/logs", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const query = {};
    if (action) query.action = action;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("adminId", "Name Email")
        .lean(),
      AuditLog.countDocuments(query),
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Broadcast notifications (in-app) to targeted audiences
router.post("/broadcast", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const {
      type = "GENERAL",
      targetRole, // e.g., DONOR | ORGANIZATION | ADMIN
      bloodGroup,
      city,
      message,
    } = req.body;

    if (!message) return res.status(400).json({ message: "message is required" });

    const userQuery = {};
    if (targetRole) userQuery.Role = targetRole.toLowerCase();
    if (bloodGroup) userQuery.bloodGroup = bloodGroup;
    if (city) userQuery.City = city;

    const recipients = await User.find(userQuery).select("_id").lean();
    if (!recipients.length) {
      return res.status(200).json({ sent: 0, message: "No recipients found for criteria" });
    }

    const payload = recipients.map((u) => ({
      userId: u._id,
      type,
      message,
    }));

    await Notification.insertMany(payload);

    await logAction({
      adminId: req.user.userId,
      action: "BROADCAST",
      targetType: "Notification",
      details: { targetRole, bloodGroup, city, count: recipients.length, type },
    });

    res.json({ sent: recipients.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Pending Profile Updates
router.get("/profile-updates", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const updates = await ProfileUpdate.find({ status: "PENDING" })
      .populate("userId", "Name Email")
      .sort({ createdAt: 1 })
      .lean();
    res.json(updates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Action on Profile Update
router.put("/profile-updates/:id/action", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { action, reason } = req.body; // action: APPROVED | REJECTED
    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const updateRequest = await ProfileUpdate.findById(req.params.id);
    if (!updateRequest) return res.status(404).json({ message: "Request not found" });

    if (updateRequest.status !== "PENDING") {
      return res.status(400).json({ message: "Request already processed" });
    }

    if (action === "APPROVED") {
      // Apply updates to User
      const { Name, City, PhoneNumber, bloodGroup, Gender, DateOfBirth, State, Country } = updateRequest.updates;
      const updateFields = {};
      if (Name) updateFields.Name = Name;
      if (City) updateFields.City = City;
      if (PhoneNumber) updateFields.PhoneNumber = PhoneNumber;
      if (bloodGroup) updateFields.bloodGroup = bloodGroup;
      if (Gender) updateFields.Gender = Gender;
      if (DateOfBirth) updateFields.DateOfBirth = DateOfBirth;
      if (State) updateFields.State = State;
      if (Country) updateFields.Country = Country;
      updateFields.profileUpdatePending = false;

      await User.findByIdAndUpdate(updateRequest.userId, updateFields);
    } else {
      // Just clear flag
      await User.findByIdAndUpdate(updateRequest.userId, { profileUpdatePending: false });
    }

    updateRequest.status = action;
    updateRequest.adminReason = reason;
    updateRequest.processedBy = req.user.userId;
    updateRequest.processedAt = new Date();
    await updateRequest.save();

    await logAction({
      adminId: req.user.userId,
      action: "PROFILE_UPDATE_ACTION",
      targetId: updateRequest.userId,
      targetType: "User",
      details: { requestId: updateRequest._id, action, reason },
    });

    res.json({ message: `Request ${action}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get stock summary by blood group
router.get("/stock", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const stockData = await BloodUnit.aggregate([
      {
        $group: {
          _id: "$bloodGroup",
          totalUnits: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] }
          },
          reserved: {
            $sum: { $cond: [{ $eq: ["$status", "RESERVED"] }, 1, 0] }
          },
        },
      },
    ]);

    const stock = {};
    const bloodGroups = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

    bloodGroups.forEach(group => {
      const found = stockData.find(s => s._id === group);
      stock[group] = {
        units: found ? found.available : 0,
        reserved: found ? found.reserved : 0,
      };
    });

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get monthly donations data
router.get("/monthly-donations", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0, 23, 59, 59);

      const count = await Appointment.countDocuments({
        status: "COMPLETED",
        createdAt: { $gte: startDate, $lte: endDate },
      });

      monthlyData.push(count);
    }

    res.json(monthlyData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get donation pipeline (Kanban columns)
router.get("/donation-pipeline", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    // Get appointments and categorize them
    const allAppointments = await Appointment.find({})
      .populate("donorId", "Name Email bloodGroup")
      .sort({ createdAt: -1 })
      .lean();

    const columns = {
      "new-donors": {
        id: "new-donors",
        title: "NEW DONORS",
        color: "from-red-50 to-red-100/50",
        items: [],
      },
      "screening": {
        id: "screening",
        title: "SCREENING",
        color: "from-blue-50 to-blue-100/50",
        items: [],
      },
      "in-progress": {
        id: "in-progress",
        title: "DONATION IN PROGRESS",
        color: "from-yellow-50 to-yellow-100/50",
        items: [],
      },
      "completed": {
        id: "completed",
        title: "COMPLETED DONATIONS",
        color: "from-green-50 to-green-100/50",
        items: [],
      },
      "ready-storage": {
        id: "ready-storage",
        title: "READY FOR STORAGE",
        color: "from-slate-50 to-slate-100/50",
        items: [],
      },
    };

    allAppointments.forEach((apt) => {
      const item = {
        id: apt._id.toString(),
        name: apt.donorId?.Name || "Unknown",
        group: apt.donorId?.bloodGroup || "O+",
        date: apt.dateTime ? new Date(apt.dateTime).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      };

      if (apt.status === "UPCOMING") {
        columns["new-donors"].items.push(item);
      } else if (apt.status === "COMPLETED" && apt.donationSuccessful) {
        columns["completed"].items.push(item);
      } else if (apt.status === "COMPLETED") {
        columns["ready-storage"].items.push(item);
      } else {
        columns["screening"].items.push(item);
      }
    });

    res.json(columns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get appointments
router.get("/appointments", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate("donorId", "Name Email PhoneNumber bloodGroup")
      .populate("organizationId", "Name")
      .sort({ dateTime: -1 })
      .lean();

    const formatted = appointments.map((apt) => ({
      _id: apt._id,
      donorName: apt.donorId?.Name,
      donorEmail: apt.donorId?.Email,
      phone: apt.donorId?.PhoneNumber,
      bloodGroup: apt.donorId?.bloodGroup,
      dateTime: apt.dateTime,
      status: apt.status,
      notes: apt.notes || "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create appointment
router.post("/appointments", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { name, group, date, time, phone, email, notes } = req.body;

    // Find or create donor user
    let donor = await User.findOne({ Email: email });
    if (!donor) {
      donor = await User.create({
        Name: name,
        Email: email,
        PhoneNumber: phone,
        bloodGroup: group,
        Role: ROLES.DONOR,
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        verificationStatus: VERIFICATION_STATUS.APPROVED,
      });
    }

    // Find an organization (use first available)
    const org = await User.findOne({ Role: { $in: [ROLES.ORGANIZATION, "hospital", "bloodbank"] } });
    if (!org) {
      return res.status(400).json({ message: "No organization found" });
    }

    const dateTime = new Date(`${date}T${time}`);
    const appointment = await Appointment.create({
      donorId: donor._id,
      organizationId: org._id,
      dateTime,
      status: "UPCOMING",
      notes,
    });

    await logAction({
      adminId: req.user.userId,
      action: "APPOINTMENT_CREATE",
      targetId: appointment._id,
      targetType: "Appointment",
      details: { donor: name, date, time },
    });

    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get requests
router.get("/requests", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const requests = await Request.find({})
      .populate("createdBy", "Name Email PhoneNumber")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requests.map((req) => ({
      _id: req._id,
      hospitalName: req.createdBy?.Name || "Unknown",
      contact: req.createdBy?.Email || req.createdBy?.PhoneNumber || "",
      bloodGroup: req.bloodGroup,
      units: req.units,
      urgency: req.urgency,
      status: req.status,
      createdAt: req.createdAt,
      notes: req.notes || "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update stock
router.put("/stock", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { group, change, reason } = req.body;

    if (!group || change === undefined) {
      return res.status(400).json({ message: "Group and change are required" });
    }

    // For positive changes, create new blood units
    if (change > 0) {
      const org = await User.findOne({ Role: { $in: [ROLES.ORGANIZATION, "hospital", "bloodbank"] } });
      if (!org) {
        return res.status(400).json({ message: "No organization found" });
      }

      const units = [];
      const now = new Date();
      const expiryDate = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000); // 42 days expiry

      for (let i = 0; i < change; i++) {
        units.push({
          organizationId: org._id,
          bloodGroup: group,
          collectionDate: now,
          expiryDate,
          status: "AVAILABLE",
        });
      }

      await BloodUnit.insertMany(units);

      await logAction({
        adminId: req.user.userId,
        action: "STOCK_ADD",
        targetType: "BloodUnit",
        details: { group, change, reason },
      });
    } else if (change < 0) {
      // For negative changes, mark units as expired or remove
      const count = Math.abs(change);
      await BloodUnit.updateMany(
        { bloodGroup: group, status: "AVAILABLE" },
        { $set: { status: "EXPIRED" } },
        { limit: count }
      );

      await logAction({
        adminId: req.user.userId,
        action: "STOCK_REMOVE",
        targetType: "BloodUnit",
        details: { group, change, reason },
      });
    }

    res.json({ message: "Stock updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/summary - Global dashboard stats
router.get("/summary", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const [
      totalDonors,
      verifiedDonors,
      pendingDonors,
      totalOrgs,
      totalRequests,
      fulfilledRequests,
      totalUnits,
      expiringUnits
    ] = await Promise.all([
      User.countDocuments({ Role: { $in: ["donor", ROLES.DONOR, "donar"] } }),
      User.countDocuments({
        Role: { $in: ["donor", ROLES.DONOR, "donar"] },
        verificationStatus: VERIFICATION_STATUS.APPROVED
      }),
      User.countDocuments({
        Role: { $in: ["donor", ROLES.DONOR, "donar"] },
        verificationStatus: VERIFICATION_STATUS.PENDING
      }),
      User.countDocuments({ Role: { $in: ["hospital", "bloodbank", ROLES.ORGANIZATION] } }),
      Request.countDocuments({}),
      Request.countDocuments({ status: REQUEST_STATUS.FULFILLED }),
      BloodUnit.countDocuments({ status: "AVAILABLE" }),
      BloodUnit.countDocuments({
        expiryDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        status: "AVAILABLE"
      }),
    ]);

    const successRate = totalRequests > 0
      ? ((fulfilledRequests / totalRequests) * 100).toFixed(1)
      : 0;

    res.json({
      totalDonors,
      verifiedDonors,
      pendingDonors,
      totalOrgs,
      totalRequests,
      fulfilledRequests,
      successRate: parseFloat(successRate),
      totalUnits,
      expiringUnits
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/pending-counts - Quick pending verification counts
router.get("/pending-counts", auth([ROLES.ADMIN]), async (_req, res) => {
  try {
    const [pendingDonors, pendingOrgs] = await Promise.all([
      User.countDocuments({
        Role: { $in: ["donor", ROLES.DONOR, "donar"] },
        verificationStatus: VERIFICATION_STATUS.PENDING
      }),
      User.countDocuments({
        Role: { $in: ["hospital", "bloodbank", ROLES.ORGANIZATION] },
        verificationStatus: VERIFICATION_STATUS.PENDING
      }),
    ]);

    res.json({ pendingDonors, pendingOrgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/donors - Donor list with filters
router.get("/donors", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {
      Role: { $in: ["donor", ROLES.DONOR, "donar"] }
    };

    if (status) query.verificationStatus = status;
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: "i" } },
        { Email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/donors/:id/approve - Approve donor
router.put("/donors/:id/approve", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: VERIFICATION_STATUS.APPROVED,
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Donor not found" });

    await logAction({
      adminId: req.user.userId,
      action: "DONOR_APPROVE",
      targetId: updated._id,
      targetType: "User",
      details: { name: updated.Name, email: updated.Email },
    });

    res.json({ message: "Donor approved", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/donors/:id/reject - Reject donor
router.put("/donors/:id/reject", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { reason } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: VERIFICATION_STATUS.REJECTED,
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Donor not found" });

    await logAction({
      adminId: req.user.userId,
      action: "DONOR_REJECT",
      targetId: updated._id,
      targetType: "User",
      details: { name: updated.Name, email: updated.Email, reason },
    });

    res.json({ message: "Donor rejected", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/orgs - Organization list with filters
router.get("/orgs", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {
      Role: { $in: ["hospital", "bloodbank", ROLES.ORGANIZATION] }
    };

    if (status) query.verificationStatus = status;
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: "i" } },
        { Email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/orgs/:id/approve - Approve organization
router.put("/orgs/:id/approve", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: VERIFICATION_STATUS.APPROVED,
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Organization not found" });

    await logAction({
      adminId: req.user.userId,
      action: "ORG_APPROVE",
      targetId: updated._id,
      targetType: "User",
      details: { name: updated.Name, email: updated.Email },
    });

    res.json({ message: "Organization approved", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/orgs/:id/reject - Reject organization
router.put("/orgs/:id/reject", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { reason } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: VERIFICATION_STATUS.REJECTED,
        verifiedBy: req.user.userId,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Organization not found" });

    await logAction({
      adminId: req.user.userId,
      action: "ORG_REJECT",
      targetId: updated._id,
      targetType: "User",
      details: { name: updated.Name, email: updated.Email, reason },
    });

    res.json({ message: "Organization rejected", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/users/:id/unblock - Unblock user
router.put("/users/:id/unblock", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: ACCOUNT_STATUS.ACTIVE },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    await logAction({
      adminId: req.user.userId,
      action: "USER_UNBLOCK",
      targetId: updated._id,
      targetType: "User",
      details: { accountStatus: updated.accountStatus },
    });

    res.json({ message: "User unblocked", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // CASCADE DELETE: Remove all related data for this user
    const deletedItems = {
      requests: 0,
      appointments: 0,
      bloodUnits: 0
    };

    // Delete all blood requests created by this organization
    if (user.Role === ROLES.ORGANIZATION || user.Role === "organization") {
      const requestsResult = await Request.deleteMany({ organizationId: req.params.id });
      deletedItems.requests = requestsResult.deletedCount || 0;

      // Delete all blood units from this organization's inventory
      const unitsResult = await BloodUnit.deleteMany({ organizationId: req.params.id });
      deletedItems.bloodUnits = unitsResult.deletedCount || 0;
    }

    // Delete all appointments related to this user (donor or organization)
    const appointmentsResult = await Appointment.deleteMany({
      $or: [
        { donorId: req.params.id },
        { organizationId: req.params.id }
      ]
    });
    deletedItems.appointments = appointmentsResult.deletedCount || 0;

    await logAction({
      adminId: req.user.userId,
      action: "USER_DELETE",
      targetId: user._id,
      targetType: "User",
      details: {
        deletedUser: { name: user.Name, email: user.Email, role: user.Role },
        cascadeDeleted: deletedItems
      },
    });

    res.json({
      message: "User deleted successfully",
      user,
      cascadeDeleted: deletedItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/reports/summary - Summary report with date filters
router.get("/reports/summary", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const query = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [
      newDonors,
      newRequests,
      completedDonations,
      totalUnitsCollected
    ] = await Promise.all([
      User.countDocuments({
        Role: { $in: ["donor", ROLES.DONOR, "donar"] },
        ...query
      }),
      Request.countDocuments(query),
      Appointment.countDocuments({ status: "COMPLETED", ...query }),
      Appointment.aggregate([
        { $match: { status: "COMPLETED", ...query } },
        { $group: { _id: null, total: { $sum: "$unitsCollected" } } }
      ])
    ]);

    res.json({
      period: { from, to },
      newDonors,
      newRequests,
      completedDonations,
      totalUnitsCollected: totalUnitsCollected[0]?.total || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/reports/requests - Requests analytics
router.get("/reports/requests", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { from, to, city, status } = req.query;
    const query = {};

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    if (status) query.status = status;

    // Aggregate by city (need to populate createdBy and get city)
    const requests = await Request.find(query)
      .populate("createdBy", "City")
      .lean();

    const byCity = {};
    const byStatus = {};
    const byUrgency = {};

    requests.forEach(r => {
      const reqCity = r.createdBy?.City || "Unknown";
      byCity[reqCity] = (byCity[reqCity] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byUrgency[r.urgency] = (byUrgency[r.urgency] || 0) + 1;
    });

    res.json({
      total: requests.length,
      byCity,
      byStatus,
      byUrgency
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/reports/inventory - Blood inventory report
router.get("/reports/inventory", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const inventory = await BloodUnit.aggregate([
      {
        $group: {
          _id: "$bloodGroup",
          available: { $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ["$status", "RESERVED"] }, 1, 0] } },
          used: { $sum: { $cond: [{ $eq: ["$status", "USED"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "EXPIRED"] }, 1, 0] } },
        }
      }
    ]);

    const formatted = {};
    ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].forEach(group => {
      const found = inventory.find(i => i._id === group);
      formatted[group] = found || { available: 0, reserved: 0, used: 0, expired: 0 };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/audit-logs - Audit logs (renamed from /logs)
router.get("/audit-logs", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { page = 1, limit = 20, action, actor, from, to } = req.query;
    const query = {};

    if (action) query.action = action;
    if (actor) query.adminId = actor;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("adminId", "Name Email")
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/notifications/sent - Sent broadcast notifications
router.get("/notifications/sent", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get broadcast actions from audit logs
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      AuditLog.find({ action: "BROADCAST" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("adminId", "Name Email")
        .lean(),
      AuditLog.countDocuments({ action: "BROADCAST" }),
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/alerts/:id/resolve - Resolve an alert
router.put("/alerts/:id/resolve", auth([ROLES.ADMIN]), async (req, res) => {
  try {
    const { id } = req.params;

    // For now, we'll mark requests as viewed/handled
    // In a full system, you'd have an Alert model
    // For this implementation, we'll log the resolution

    await logAction({
      adminId: req.user.userId,
      action: "ALERT_RESOLVE",
      targetId: id,
      targetType: "Alert",
      details: { resolvedAt: new Date() },
    });

    res.json({ message: "Alert resolved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

