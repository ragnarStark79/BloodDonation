import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    campId: { type: mongoose.Schema.Types.ObjectId, ref: "Camp" }, // Link to donation camp
    dateTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["UPCOMING", "COMPLETED", "CANCELLED", "COLLECTED", "IN_PROGRESS", "REJECTED"],
      default: "UPCOMING"
    },
    notes: { type: String },
    unitsCollected: { type: Number },
    donationSuccessful: { type: Boolean },

    // Creation tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdByRole: { type: String, enum: ["DONOR", "ORGANIZATION", "SYSTEM"] },

    // Reschedule tracking
    rescheduleCount: { type: Number, default: 0 },
    rescheduleHistory: [{
      oldDateTime: Date,
      newDateTime: Date,
      rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rescheduledAt: Date,
      reason: String
    }],

    // Cancellation tracking
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAt: { type: Date },

    // Completion tracking
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    completedAt: { type: Date }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Appointment", appointmentSchema);

