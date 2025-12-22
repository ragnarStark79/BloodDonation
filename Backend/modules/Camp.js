import mongoose from "mongoose";

const campSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String }, // e.g., "09:00"
    endTime: { type: String }, // e.g., "17:00"
    description: { type: String },
    location: {
      coordinates: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
      },
      address: { type: String },
    },
    capacity: { type: Number, default: 0 },
    contactPerson: { type: String },
    contactPhone: { type: String },
    requirements: [{ type: String }], // e.g., ["Fasting required", "Bring ID"]
    bloodGroupsNeeded: [{ type: String }], // e.g., ["A+", "O-"]
    registeredDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attendedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Track actual attendance
    status: {
      type: String,
      enum: ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "PLANNED"
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Index for geospatial queries
campSchema.index({ "location.coordinates.coordinates": "2dsphere" });

export default mongoose.model("Camp", campSchema);

