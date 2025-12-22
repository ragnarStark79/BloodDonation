import mongoose from "mongoose";
import Appointment from "./Appointment.js";
import Request from "./Request.js";

const donationSchema = new mongoose.Schema(
    {
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false, // Optional - some donors may not have accounts
        },
        donorName: {
            type: String,
            required: true,
            trim: true,
        },
        bloodGroup: {
            type: String,
            required: true,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        },
        stage: {
            type: String,
            required: true,
            enum: [
                "new-donors",
                "screening",
                "in-progress",
                "completed",
                "ready-storage",
                "rejected",
            ],
            default: "new-donors",
        },
        donationDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        phone: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        // Screening stage data
        screeningNotes: {
            type: String,
            default: "",
        },
        screeningStatus: {
            type: String,
            enum: ["pending", "approved", "rejected", "deferred"],
            default: "pending",
        },
        // Donation in progress data
        startedAt: {
            type: Date,
        },
        // Completed stage data
        completedAt: {
            type: Date,
        },
        bloodBagId: {
            type: String,
            unique: true,
            sparse: true, // Allows null values
        },
        unitsCollected: {
            type: Number,
            default: 1,
        },
        // Ready for storage data
        expiryDate: {
            type: Date,
        },
        storageLocation: {
            type: String,
        },
        // Overall status
        status: {
            type: String,
            enum: ["active", "rejected", "aborted", "completed", "used", "stored"],
            default: "active",
        },
        // Admin tracking
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // For faster organization-specific queries
        },
        // Appointment link
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Appointment",
            required: false,
        },
        // Camp links
        campId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Camp",
            required: false,
        },
        campParticipantId: {
            type: String, // format: "donorId_campId"
            required: false,
        },
        // Detailed screening data
        screening: {
            hemoglobin: {
                type: Number, // g/dL
            },
            bloodPressure: {
                systolic: Number,
                diastolic: Number,
            },
            weight: {
                type: Number, // kg
            },
            temperature: {
                type: Number, // °F
            },
            medicalHistory: {
                type: String,
            },
            screenedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            screenedAt: {
                type: Date,
            },
        },
        // Blood collection data
        collection: {
            bloodBagIdGenerated: {
                type: String,
            },
            volumeCollected: {
                type: Number, // ml
                default: 450,
            },
            componentType: {
                type: String,
                enum: ["Whole Blood", "Plasma", "Platelets", "RBC"],
                default: "Whole Blood",
            },
            collectionStartTime: {
                type: Date,
            },
            collectionEndTime: {
                type: Date,
            },
            collectedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            donationBed: {
                type: String,
            },
        },
        // Lab testing data
        labTests: {
            bloodTypeConfirmed: {
                type: String,
            },
            hivTest: {
                type: String,
                enum: ["Pending", "Negative", "Positive"],
                default: "Pending",
            },
            hepatitisBTest: {
                type: String,
                enum: ["Pending", "Negative", "Positive"],
                default: "Pending",
            },
            hepatitisCTest: {
                type: String,
                enum: ["Pending", "Negative", "Positive"],
                default: "Pending",
            },
            malariaTest: {
                type: String,
                enum: ["Pending", "Negative", "Positive"],
                default: "Pending",
            },
            syphilisTest: {
                type: String,
                enum: ["Pending", "Negative", "Positive"],
                default: "Pending",
            },
            testedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            testedAt: {
                type: Date,
            },
            allTestsPassed: {
                type: Boolean,
                default: false,
            },
        },
        // Inventory link
        inventoryItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory",
        },
        // Audit trail
        history: [
            {
                stage: {
                    type: String,
                },
                action: {
                    type: String,
                },
                performedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                performedAt: {
                    type: Date,
                    default: Date.now,
                },
                notes: {
                    type: String,
                },
            },
        ],
        // Completion tracking
        completionDate: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
donationSchema.index({ stage: 1, status: 1 });
donationSchema.index({ donationDate: -1 });
donationSchema.index({ bloodGroup: 1 });
donationSchema.index({ organizationId: 1, status: 1 }); // Organization-specific queries

// Virtual for donation age
donationSchema.virtual("daysOld").get(function () {
    return Math.floor((Date.now() - this.donationDate) / (1000 * 60 * 60 * 24));
});

// Method to move to next stage
donationSchema.methods.moveToStage = async function (newStage, performedBy, notes = "") {
    const oldStage = this.stage;
    this.stage = newStage;

    // Update timestamps based on stage
    if (newStage === "in-progress" && !this.startedAt) {
        this.startedAt = new Date();
    } else if (newStage === "completed" && !this.completedAt) {
        this.completedAt = new Date();
        // Lab testing stage - do NOT auto-fulfill yet
        // Will auto-fulfill only if tests pass and move to ready-storage
    } else if (newStage === "ready-storage" && !this.expiryDate) {
        // Set expiry to 35 days from collection (standard for whole blood)
        this.expiryDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
        this.status = "completed";
        this.completionDate = new Date();

        // Auto-fulfill appointment and request
        await this.autoFulfillRequest();

        // ✨ AUTO-HIDE FROM PIPELINE ✨
        const User = (await import("./User.js")).default;
        const org = await User.findById(this.organizationId).select("organizationType").lean();

        if (org && org.organizationType === "BANK") {
            // BLOOD BANK: Mark as stored (will be added to inventory manually)
            this.status = "stored";
            console.log(`✅ [BLOOD BANK] Donation ${this._id} marked as 'stored' - hidden from pipeline`);
        } else {
            // HOSPITAL: Mark as used (blood used on patient)
            this.status = "used";
            console.log(`✅ [HOSPITAL] Donation ${this._id} marked as 'used' - hidden from pipeline`);
        }
    } else if (newStage === "rejected") {
        // Mark donation as rejected (failed lab tests)
        this.status = "rejected";
        this.completedAt = new Date();
    }

    // Add to history
    this.history.push({
        stage: newStage,
        action: `Moved from ${oldStage} to ${newStage}`,
        performedBy,
        performedAt: new Date(),
        notes,
    });

    return this.save();
};

// Method to auto-fulfill appointment and request
donationSchema.methods.autoFulfillRequest = async function () {
    // Update linked appointment status to COLLECTED
    if (this.appointmentId) {
        console.log(`[Donation] Updating appointment ${this.appointmentId} to COLLECTED`);
        try {
            const updatedAppointment = await Appointment.findByIdAndUpdate(
                this.appointmentId,
                {
                    status: "COLLECTED",
                    completedAt: new Date()
                },
                { new: true } // Return updated document
            ).populate('requestId');

            if (updatedAppointment) {
                console.log(`✅ Appointment ${this.appointmentId} updated to COLLECTED`);

                // Auto-fulfill linked blood request if exists
                if (updatedAppointment.requestId) {
                    console.log(`[Donation] Auto-fulfilling request ${updatedAppointment.requestId}`);
                    try {
                        const request = await Request.findByIdAndUpdate(
                            updatedAppointment.requestId,
                            {
                                status: "FULFILLED",
                                fulfilledAt: new Date()
                            },
                            { new: true }
                        );
                        console.log(`✅ Request ${updatedAppointment.requestId} marked as FULFILLED`);

                        // Update donor eligibility
                        if (request?.assignedTo?.type === "DONOR" && request.assignedTo.donorId) {
                            console.log(`[Donation] Updating donor ${request.assignedTo.donorId} eligibility`);
                            try {
                                const User = mongoose.model('User');
                                const donor = await User.findById(request.assignedTo.donorId);

                                if (donor) {
                                    const donationDate = new Date();
                                    donor.lastDonationDate = donationDate;

                                    // Calculate next eligible date: 90 days
                                    const nextEligibleDate = new Date(donationDate);
                                    nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);
                                    donor.nextEligibleDate = nextEligibleDate;
                                    donor.eligible = false; // Mark as ineligible

                                    await donor.save();
                                    console.log(`✅ Donor ${donor.Name} eligibility updated. Next eligible: ${nextEligibleDate.toDateString()}`);
                                }
                            } catch (donorError) {
                                console.error("Error updating donor eligibility:", donorError);
                            }
                        }
                    } catch (reqError) {
                        console.error("Error fulfilling request:", reqError);
                    }
                }
            } else {
                console.log(`❌ Appointment ${this.appointmentId} NOT FOUND`);
            }
        } catch (error) {
            console.error("Error updating appointment status:", error);
        }
    } else {
        console.log('[Donation] No appointmentId linked to this donation');
    }
};

// Method to add history entry
donationSchema.methods.addHistoryEntry = function (action, performedBy, notes = "") {
    this.history.push({
        stage: this.stage,
        action,
        performedBy,
        performedAt: new Date(),
        notes,
    });
    return this.save();
};

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
