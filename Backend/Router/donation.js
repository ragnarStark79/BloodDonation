import express from "express";
import Donation from "../modules/Donation.js";
import { auth } from "../Middleware/auth.js";
import { ROLES } from "../config/constants.js";

const router = express.Router();

// Middleware to ensure only admins and organizations can access
const adminOrOrg = auth([ROLES.ADMIN, ROLES.ORGANIZATION]);

// @route   GET /api/admin/donations
// @desc    Get all donations grouped by stage
// @access  Admin
router.get("/", adminOrOrg, async (req, res) => {
    try {
        // Filter by organization for non-admin users
        const query = { status: { $in: ["active", "completed"] } }; // Include both active and completed (ready-storage) donations
        if (req.user.role !== ROLES.ADMIN) {
            query.organizationId = req.user.userId;
        }

        const donations = await Donation.find(query)
            .populate("donorId", "name email")
            .populate("createdBy", "name")
            .sort({ donationDate: -1 });

        // Group donations by stage
        const grouped = {
            "new-donors": {
                id: "new-donors",
                title: "NEW DONORS",
                color: "from-red-50 to-red-100/50",
                items: [],
            },
            screening: {
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
            completed: {
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

        donations.forEach((donation) => {
            const item = {
                id: donation._id.toString(),
                name: donation.donorName,
                group: donation.bloodGroup,
                date: donation.donationDate,
                phone: donation.phone,
                email: donation.email,
                notes: donation.notes,
                screeningNotes: donation.screeningNotes,
                bloodBagId: donation.bloodBagId,
                unitsCollected: donation.unitsCollected,
                appointmentId: donation.appointmentId, // Add appointmentId for deduplication
                screening: donation.screening,
                screeningStatus: donation.screeningStatus,
                collection: donation.collection,
                labTests: donation.labTests,
            };

            if (grouped[donation.stage]) {
                grouped[donation.stage].items.push(item);
            }
        });

        res.json(grouped);
    } catch (error) {
        console.error("Error fetching donations:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/admin/donations
// @desc    Create new donation (register donor)
// @access  Admin
router.post("/", adminOrOrg, async (req, res) => {
    try {
        const { donorName, bloodGroup, phone, email, notes, donorId, appointmentId } = req.body;

        if (!donorName || !bloodGroup) {
            return res
                .status(400)
                .json({ message: "Donor name and blood group are required" });
        }

        // Check for duplicate donation if appointmentId is provided
        if (appointmentId) {
            const existingDonation = await Donation.findOne({ appointmentId });
            if (existingDonation) {
                return res.status(400).json({
                    message: "Donation already exists for this appointment",
                    donationId: existingDonation._id,
                    donation: {
                        _id: existingDonation._id.toString(),
                        id: existingDonation._id.toString(),
                        name: existingDonation.donorName,
                        group: existingDonation.bloodGroup,
                        date: existingDonation.donationDate,
                        phone: existingDonation.phone,
                        email: existingDonation.email,
                        stage: existingDonation.stage,
                    }
                });
            }
        }

        const donation = new Donation({
            donorName,
            bloodGroup,
            phone,
            email,
            notes,
            donorId: donorId || null,
            appointmentId: appointmentId || null,
            stage: "new-donors",
            createdBy: req.user.userId,
            organizationId: req.user.role === ROLES.ADMIN ? req.body.organizationId || req.user.userId : req.user.userId,
        });

        await donation.save();

        res.status(201).json({
            message: "Donation created successfully",
            _id: donation._id.toString(), // Add _id at root level for consistency
            donation: {
                _id: donation._id.toString(), // Include both _id and id for compatibility
                id: donation._id.toString(),
                name: donation.donorName,
                group: donation.bloodGroup,
                date: donation.donationDate,
                phone: donation.phone,
                email: donation.email,
                stage: donation.stage,
                appointmentId: donation.appointmentId,
            },
        });
    } catch (error) {
        console.error("Error creating donation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/admin/donations/:id/stage
// @desc    Update donation stage (for drag-and-drop)
// @access  Admin
router.put("/:id/stage", adminOrOrg, async (req, res) => {
    try {
        const { stage } = req.body;

        if (
            !["new-donors", "screening", "in-progress", "completed", "ready-storage", "rejected"].includes(
                stage
            )
        ) {
            return res.status(400).json({ message: "Invalid stage" });
        }

        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // Check organization ownership (non-admins can only update their own)
        if (req.user.role !== ROLES.ADMIN && donation.organizationId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Not authorized to update this donation" });
        }

        // Use the model method to handle stage-specific logic
        await donation.moveToStage(stage, req.user.userId);

        res.json({
            message: "Donation stage updated",
            donation: {
                id: donation._id.toString(),
                stage: donation.stage,
                startedAt: donation.startedAt,
                completedAt: donation.completedAt,
                expiryDate: donation.expiryDate,
            },
        });
    } catch (error) {
        console.error("Error updating donation stage:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/admin/donations/:id/screening
// @desc    Update donation screening data
// @access  Admin/Org
router.put("/:id/screening", adminOrOrg, async (req, res) => {
    try {
        const { hemoglobin, bloodPressure, weight, temperature, medicalHistory, screeningStatus, notes } = req.body;

        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // Check organization ownership
        if (req.user.role !== ROLES.ADMIN && donation.organizationId.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Not authorized to update this donation" });
        }

        // Update screening data
        donation.screening = {
            hemoglobin,
            bloodPressure,
            weight,
            temperature,
            medicalHistory,
            screenedBy: req.user.userId,
            screenedAt: new Date(),
        };
        donation.screeningStatus = screeningStatus;
        donation.screeningNotes = notes || "";

        // Add history entry
        await donation.addHistoryEntry(
            `Screening ${screeningStatus}`,
            req.user.userId,
            `Hemoglobin: ${hemoglobin} g/dL, BP: ${bloodPressure.systolic}/${bloodPressure.diastolic}, Weight: ${weight} kg`
        );

        await donation.save();

        res.json({
            message: "Screening data updated successfully",
            donation: {
                id: donation._id.toString(),
                screeningStatus: donation.screeningStatus,
                screening: donation.screening,
            },
        });
    } catch (error) {
        console.error("Error updating screening data:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/admin/donations/:id/collection
// @desc    Update blood collection data
// @access  Admin/Org
router.put("/:id/collection", adminOrOrg, async (req, res) => {
    try {
        const { id } = req.params;
        const { bloodBagIdGenerated, volumeCollected, componentType, collectionStartTime, collectionEndTime, donationBed, notes } = req.body;

        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // Check organization ownership (if not admin)
        if (req.user.role !== ROLES.ADMIN && donation.organizationId?.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Not authorized to update this donation" });
        }

        // Update collection data
        donation.collection = {
            bloodBagIdGenerated,
            volumeCollected,
            componentType,
            collectionStartTime,
            collectionEndTime,
            collectedBy: req.user.userId,
            donationBed,
        };

        // Add history entry
        const duration = collectionEndTime && collectionStartTime
            ? Math.floor((new Date(collectionEndTime) - new Date(collectionStartTime)) / 60000)
            : 0;

        donation.history.push({
            stage: donation.stage,
            action: "Blood collection completed",
            performedBy: req.user.userId,
            performedAt: new Date(),
            notes: `${volumeCollected}ml ${componentType} collected in ${duration} minutes. Bag ID: ${bloodBagIdGenerated}${notes ? '. ' + notes : ''}`
        });

        await donation.save();

        res.json({
            message: "Blood collection data updated successfully",
            donation: {
                id: donation._id.toString(),
                collection: donation.collection,
            },
        });
    } catch (error) {
        console.error("Error updating collection data:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/admin/donations/:id/lab-tests
// @desc    Update lab test results
// @access  Admin/Org
router.put("/:id/lab-tests", adminOrOrg, async (req, res) => {
    try {
        const { id } = req.params;
        const { bloodTypeConfirmed, hivTest, hepatitisBTest, hepatitisCTest, malariaTest, syphilisTest, allTestsPassed, notes } = req.body;

        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // Check organization ownership (if not admin)
        if (req.user.role !== ROLES.ADMIN && donation.organizationId?.toString() !== req.user.userId) {
            return res.status(403).json({ message: "Not authorized to update this donation" });
        }

        // Update lab test data
        donation.labTests = {
            bloodTypeConfirmed,
            hivTest,
            hepatitisBTest,
            hepatitisCTest,
            malariaTest,
            syphilisTest,
            testedBy: req.user.userId,
            testedAt: new Date(),
            allTestsPassed,
        };

        // Add history entry
        const failedTests = [];
        if (hivTest === 'Positive') failedTests.push('HIV');
        if (hepatitisBTest === 'Positive') failedTests.push('Hep B');
        if (hepatitisCTest === 'Positive') failedTests.push('Hep C');
        if (malariaTest === 'Positive') failedTests.push('Malaria');
        if (syphilisTest === 'Positive') failedTests.push('Syphilis');

        const historyNote = allTestsPassed
            ? `All lab tests passed. Blood type confirmed: ${bloodTypeConfirmed}${notes ? '. ' + notes : ''}`
            : `Lab tests completed. Failed: ${failedTests.join(', ')}${notes ? '. ' + notes : ''}`;

        // Add history entry manually (don't use addHistoryEntry which saves)
        donation.history.push({
            stage: donation.stage,
            action: allTestsPassed ? "Lab tests passed" : "Lab tests completed with failures",
            performedBy: req.user.userId,
            performedAt: new Date(),
            notes: historyNote
        });

        // If all tests passed, auto-move to ready-storage
        if (allTestsPassed) {
            // Use moveToStage to handle all related updates (appointment status, request fulfillment, history)
            await donation.moveToStage(
                "ready-storage",
                req.user.userId,
                "Auto-moved after passing all lab tests"
            );
        } else {
            // Tests failed - mark as rejected and reopen request
            console.log(`⚠️ Lab tests FAILED for donation ${donation._id}. Failed tests: ${failedTests.join(', ')}`);

            // Mark donation as rejected
            await donation.moveToStage(
                "rejected",
                req.user.userId,
                `Lab tests failed: ${failedTests.join(', ')}`
            );

            // Get linked appointment and request
            const Appointment = (await import("../modules/Appointment.js")).default;
            const Request = (await import("../modules/Request.js")).default;

            if (donation.appointmentId) {
                try {
                    const appointment = await Appointment.findById(donation.appointmentId).populate('requestId');

                    if (appointment) {
                        // Update appointment status to REJECTED
                        appointment.status = "REJECTED";
                        appointment.completedAt = new Date();
                        appointment.notes = `Lab tests failed: ${failedTests.join(', ')}`;
                        await appointment.save();
                        console.log(`✅ Appointment ${appointment._id} marked as REJECTED`);

                        // Reopen the blood request if it exists
                        if (appointment.requestId) {
                            const request = await Request.findById(appointment.requestId);

                            if (request && request.status === "ASSIGNED") {
                                // Reset request to OPEN so hospital can assign another donor
                                request.status = "OPEN";
                                request.assignedTo = undefined; // Clear assignment
                                request.notes = `Previous donor's lab tests failed (${failedTests.join(', ')}). Request reopened for new assignment.`;
                                await request.save();

                                console.log(`✅ Request ${request._id} reopened - ready for new donor assignment`);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error handling failed test cleanup:", error);
                }
            }
        }

        await donation.save();

        res.json({
            message: allTestsPassed
                ? "Lab tests passed! Donation moved to Ready for Storage"
                : `Lab tests failed (${failedTests.join(', ')}). Donation rejected and blood request reopened for new donor.`,
            donation: {
                id: donation._id.toString(),
                labTests: donation.labTests,
                stage: donation.stage,
                status: donation.status
            },
            testsFailed: !allTestsPassed,
            failedTests: allTestsPassed ? [] : failedTests
        });
    } catch (error) {
        console.error("Error updating lab test data:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// @route   PUT /api/admin/donations/:id
// @desc    Update donation details
// @access  Admin
router.put("/:id", adminOrOrg, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = [
            "donorName",
            "bloodGroup",
            "phone",
            "email",
            "notes",
            "screeningNotes",
            "screeningStatus",
            "bloodBagId",
            "unitsCollected",
            "storageLocation",
        ];

        // Filter only allowed fields
        const filteredUpdates = {};
        Object.keys(updates).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                filteredUpdates[key] = updates[key];
            }
        });

        const donation = await Donation.findByIdAndUpdate(
            req.params.id,
            filteredUpdates,
            { new: true, runValidators: true }
        );

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        res.json({
            message: "Donation updated successfully",
            donation,
        });
    } catch (error) {
        console.error("Error updating donation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   DELETE /api/admin/donations/:id
// @desc    Delete/abort donation
// @access  Admin
router.delete("/:id", adminOrOrg, async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }

        // Mark as aborted instead of deleting
        donation.status = "aborted";
        await donation.save();

        res.json({ message: "Donation aborted successfully" });
    } catch (error) {
        console.error("Error deleting donation:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   GET /api/admin/donations/stats
// @desc    Get donation statistics
// @access  Admin
router.get("/stats", adminOrOrg, async (req, res) => {
    try {
        const stats = await Donation.aggregate([
            { $match: { status: "active" } },
            {
                $group: {
                    _id: "$stage",
                    count: { $sum: 1 },
                },
            },
        ]);

        const bloodGroupStats = await Donation.aggregate([
            { $match: { status: "active", stage: "ready-storage" } },
            {
                $group: {
                    _id: "$bloodGroup",
                    units: { $sum: "$unitsCollected" },
                },
            },
        ]);

        res.json({
            byStage: stats,
            byBloodGroup: bloodGroupStats,
        });
    } catch (error) {
        console.error("Error fetching donation stats:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
