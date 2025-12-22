
import mongoose from "mongoose";
import { ACCOUNT_STATUS, ROLES, VERIFICATION_STATUS } from "../config/constants.js";

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Legacy fields (kept for compatibility with existing UI)
    Name: { type: String, required: true },
    Email: { type: String, required: true },
    Password: { type: String, required: true },
    City: { type: String, required: true },
    PhoneNumber: { type: String, required: true },
    Role: {
      type: String,
      enum: [
        "admin",
        "donor",
        "donar", // Legacy support
        "hospital",
        "bloodbank",
        ROLES.ADMIN,
        ROLES.DONOR,
        ROLES.ORGANIZATION,
      ],
      required: true,
    },

    // New fields for LiForce spec
    locationGeo: locationSchema,
    bloodGroup: { type: String },
    lastDonationDate: { type: Date },
    eligible: { type: Boolean, default: true },

    // Additional donor fields
    Gender: { type: String, enum: ["Male", "Female", "Other", null] },
    DateOfBirth: { type: Date },
    State: { type: String },
    Country: { type: String, default: "India" },

    // Organization fields
    organizationType: { type: String, enum: ["HOSPITAL", "BANK"], default: "HOSPITAL" },
    licenseNo: { type: String },
    organizationName: { type: String },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    rejectionReason: { type: String },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    profileUpdatePending: { type: Boolean, default: false },
    lastLoginAt: { type: Date },

    // Inventory summary cache (for blood banks)
    inventorySummary: {
      totalUnits: { type: Number, default: 0 },
      expiringSoon: { type: Number, default: 0 },
      lastUpdated: { type: Date }
    },
    preferences: {
      notifications: {
        email: {
          nearbyRequests: { type: Boolean, default: true },
          reminders: { type: Boolean, default: true },
          history: { type: Boolean, default: true },
        },
        sms: {
          emergency: { type: Boolean, default: true },
          reminders: { type: Boolean, default: true },
        },
        inApp: { type: Boolean, default: true },
      },
      visibility: {
        type: String,
        enum: ["PUBLIC", "PRIVATE"],
        default: "PUBLIC",
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ Email: 1 }, { unique: true });
userSchema.index({ locationGeo: "2dsphere" });
userSchema.index({ verificationStatus: 1, Role: 1 });

export default mongoose.model("User", userSchema);