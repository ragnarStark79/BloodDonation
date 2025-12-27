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
        collectionData: {
            bloodBagIdGenerated: {
                type: String,
            },
            volumeCollected: {
                type: Number, // ml
                default: 450,
            },
            unitsCollected: {
                type: Number,
                default: 1,
                min: 1,
                max: 10,
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
        // Inventory link (can be single ID or array of IDs for multiple units)
        inventoryItemId: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "BloodUnit",
        }],
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

        const User = (await import("./User.js")).default;
        const org = await User.findById(this.organizationId).select("organizationType").lean();

        if (org && org.organizationType === "BANK") {
            // BLOOD BANK: Automatically add to inventory
            try {
                const BloodUnit = (await import("./BloodUnit.js")).default;

                // Get number of units collected (default to 1 if not specified)
                const unitsCollected = this.collectionData?.unitsCollected || 1;
                const baseBarcode = this.collectionData?.bloodBagIdGenerated || this.bloodBagId || `BAG-${Date.now()}`;

                console.log('🩸 Creating Blood Units:', {
                    unitsCollected,
                    collectionData: this.collectionData,
                    baseBarcode
                });

                // Create multiple blood units based on unitsCollected
                const bloodUnits = [];
                for (let i = 0; i < unitsCollected; i++) {
                    const unitBarcode = unitsCollected > 1 ? `${baseBarcode}-U${i + 1}` : baseBarcode;

                    console.log(`Creating unit ${i + 1}/${unitsCollected} with barcode: ${unitBarcode}`);

                    const bloodUnit = await BloodUnit.create({
                        organizationId: this.organizationId,
                        bloodGroup: this.bloodGroup,
                        component: this.collectionData?.componentType || "Whole Blood",
                        collectionDate: this.collectionData?.collectionEndTime || this.completedAt || new Date(),
                        expiryDate: this.expiryDate,
                        barcode: unitBarcode,
                        status: "AVAILABLE",
                        donorId: this.donorId,
                        donationId: this._id
                    });

                    console.log(`✅ Created blood unit: ${bloodUnit._id}`);
                    bloodUnits.push(bloodUnit._id);
                }

                console.log(`✅ Successfully created ${bloodUnits.length} blood units`);

                // Link inventory items to donation (always store as array)
                this.inventoryItemId = bloodUnits;
                this.status = "stored";
            } catch (error) {
                console.error('❌ Error creating blood units:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    donationId: this._id,
                    organizationId: this.organizationId,
                    bloodGroup: this.bloodGroup,
                    collectionData: this.collectionData
                });
                throw error; // Re-throw to be caught by the outer try-catch
            }
        } else {
            // HOSPITAL: Mark as used (blood used on patient)
            this.status = "used";
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

                // Auto-fulfill linked blood request if exists
                if (updatedAppointment.requestId) {
                    try {
                        const request = await Request.findByIdAndUpdate(
                            updatedAppointment.requestId,
                            {
                                status: "FULFILLED",
                                fulfilledAt: new Date()
                            },
                            { new: true }
                        );

                        // Update donor eligibility
                        if (request?.assignedTo?.type === "DONOR" && request.assignedTo.donorId) {
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
            }
        } catch (error) {
            console.error("Error updating appointment status:", error);
        }
    } else {
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
