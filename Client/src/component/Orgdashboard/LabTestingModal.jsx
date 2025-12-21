import React, { useState } from 'react';
import { X, TestTube, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import adminApi from '../../api/adminApi';

const LabTestingModal = ({ donation, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        bloodTypeConfirmed: donation.group || 'O+',
        hivTest: 'Negative',
        hepatitisBTest: 'Negative',
        hepatitisCTest: 'Negative',
        malariaTest: 'Negative',
        syphilisTest: 'Negative',
        notes: ''
    });

    const [saving, setSaving] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const tests = [
        { key: 'hivTest', label: 'HIV Test', icon: TestTube },
        { key: 'hepatitisBTest', label: 'Hepatitis B Test', icon: TestTube },
        { key: 'hepatitisCTest', label: 'Hepatitis C Test', icon: TestTube },
        { key: 'malariaTest', label: 'Malaria Test', icon: TestTube },
        { key: 'syphilisTest', label: 'Syphilis Test', icon: TestTube },
    ];

    // Check if all tests passed (Negative = passed)
    const allTestsPassed = tests.every(test => formData[test.key] === 'Negative');

    const handleTestChange = (testKey, value) => {
        setFormData({ ...formData, [testKey]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If any test failed, show confirmation
        if (!allTestsPassed && !showConfirmation) {
            setShowConfirmation(true);
            return;
        }

        setSaving(true);
        try {
            const response = await adminApi.updateDonationLabTests(donation.id, {
                ...formData,
                allTestsPassed
            });

            // Backend now auto-handles stage changes:
            // - If tests PASS → auto-moves to ready-storage AND auto-fulfills request
            // - If tests FAIL → auto-moves to rejected AND reopens request

            if (allTestsPassed) {
                toast.success('✅ Lab tests passed! Donation moved to Ready for Storage. Request fulfilled!', {
                    duration: 5000
                });
            } else {
                toast.error('❌ Tests failed. Donation rejected and blood request reopened for new donor.', {
                    duration: 6000,
                });
            }

            onSuccess(); // Refreshes the donation pipeline
            onClose();
        } catch (error) {
            console.error('Failed to save lab test results:', error);
            const errorMessage = error.response?.data?.message || 'Failed to save lab test results';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-6 mb-6 bg-white rounded-2xl shadow-2xl w-full overflow-hidden border-2 border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center">
                            <TestTube size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Laboratory Testing</h3>
                            <p className="text-sm text-gray-600">
                                Donor: {donation.name} ({donation.group})
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Blood Type Confirmation */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmed Blood Type *
                    </label>
                    <select
                        value={formData.bloodTypeConfirmed}
                        onChange={(e) => setFormData({ ...formData, bloodTypeConfirmed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 outline-none"
                        required
                    >
                        {bloodGroups.map((group) => (
                            <option key={group} value={group}>{group}</option>
                        ))}
                    </select>
                    {formData.bloodTypeConfirmed !== donation.group && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-xs text-yellow-800">
                            <AlertTriangle size={14} />
                            <span>
                                Warning: Confirmed blood type differs from registered type ({donation.group})
                            </span>
                        </div>
                    )}
                </div>

                {/* Test Results */}
                <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3">Test Results</h4>
                    <div className="space-y-3">
                        {tests.map((test) => (
                            <div key={test.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <test.icon size={16} className="text-gray-500" />
                                    <span className="font-medium text-gray-800">{test.label}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleTestChange(test.key, 'Negative')}
                                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${formData[test.key] === 'Negative'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-green-50'
                                            }`}
                                    >
                                        <CheckCircle size={16} />
                                        Negative
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTestChange(test.key, 'Positive')}
                                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${formData[test.key] === 'Positive'
                                            ? 'bg-red-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-red-50'
                                            }`}
                                    >
                                        <XCircle size={16} />
                                        Positive
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Overall Status */}
                <div className={`p-4 rounded-lg border-2 ${allTestsPassed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                    }`}>
                    <div className="flex items-center gap-3">
                        {allTestsPassed ? (
                            <>
                                <CheckCircle size={24} className="text-green-600" />
                                <div>
                                    <div className="font-bold text-green-800">All Tests Passed</div>
                                    <div className="text-sm text-green-700">
                                        Donation will be moved to "Ready for Storage"
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle size={24} className="text-red-600" />
                                <div>
                                    <div className="font-bold text-red-800">Some Tests Failed</div>
                                    <div className="text-sm text-red-700">
                                        Donation cannot be used for transfusion
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <FileText size={16} />
                        Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 outline-none resize-none"
                        rows="3"
                        placeholder="Any additional observations or notes..."
                    />
                </div>

                {/* Confirmation Warning */}
                {showConfirmation && !allTestsPassed && (
                    <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle size={20} className="text-red-600 mt-0.5" />
                            <div>
                                <div className="font-bold text-red-800 mb-1">Confirm Failed Test Results</div>
                                <div className="text-sm text-red-700 mb-3">
                                    You are about to save test results with failures. This donation will not be usable for transfusion. Are you sure you want to proceed?
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmation(false)}
                                        className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
                                    >
                                        Review Again
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                                    >
                                        Confirm & Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${allTestsPassed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        allTestsPassed ? 'Save & Move to Storage' : 'Save Test Results'
                    )}
                </button>
            </div>
        </div>
    );
};

export default LabTestingModal;
