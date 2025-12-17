import mongoose from "mongoose";
import { REQUEST_STATUS, URGENCY } from "../config/constants.js";

const requestSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    bloodGroup: { type: String, required: true, index: true },
    component: {
      type: String,
      enum: ["WHOLE_BLOOD", "RED_CELLS", "PLASMA", "PLATELETS", "CRYOPRECIPITATE"],
      default: "WHOLE_BLOOD"
    },
    unitsNeeded: { type: Number, required: true, min: 1 },
    urgency: { type: String, enum: URGENCY, default: "MEDIUM", index: true },

    // Location data
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [77.2, 28.6] // Default to Delhi coordinates if not provided
      },
      address: String,
      city: String,
      state: String
    },

    // Status tracking
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.OPEN,
      index: true
    },

    // Assignment
    assignedTo: {
      type: { type: String, enum: ["DONOR", "BLOOD_BANK"] },
      donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },

    // Interested donors
    interestedDonors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],

    // Contact information
    contactPerson: String, // Temporarily optional for debugging
    contactPhone: String, // Temporarily optional for debugging

    // Case details
    caseDetails: String, // Temporarily optional for debugging
    patientAge: Number,
    patientGender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },

    // Timeline
    requiredBy: Date,
    fulfilledAt: Date,

    // Legacy fields (for backwards compatibility)
    caseId: String,
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Geospatial index for location-based queries
requestSchema.index({ "location": "2dsphere" });

// Compound indexes for common queries
requestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
requestSchema.index({ bloodGroup: 1, status: 1, urgency: 1 });
requestSchema.index({ organizationId: 1, status: 1 });
requestSchema.index({ "location.city": 1, status: 1 });

// Virtual for hospital name
requestSchema.virtual("hospitalName", {
  ref: "User",
  localField: "organizationId",
  foreignField: "_id",
  justOne: true
});

// Virtual for interested donors count
requestSchema.virtual("interestedDonorsCount").get(function () {
  return this.interestedDonors ? this.interestedDonors.length : 0;
});

// Pre-save middleware to set createdBy from organizationId if not set
requestSchema.pre("save", async function () {
  if (!this.createdBy && this.organizationId) {
    this.createdBy = this.organizationId;
  }
});

export default mongoose.model("Request", requestSchema);
