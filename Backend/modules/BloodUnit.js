import mongoose from "mongoose";

const bloodUnitSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bloodGroup: { type: String, required: true },
    component: { type: String, default: "WB" },
    collectionDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ["AVAILABLE", "RESERVED", "ISSUED", "EXPIRED"], default: "AVAILABLE" },
    barcode: { type: String },

    // Source tracking
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },

    // Reservation tracking
    reservedFor: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reservedAt: { type: Date },

    // Issue tracking
    issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    issuedAt: { type: Date },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bloodUnitSchema.index({ organizationId: 1, status: 1 });
bloodUnitSchema.index({ expiryDate: 1 });

export default mongoose.model("BloodUnit", bloodUnitSchema);

