import React, { useState } from 'react';
import { X, Activity, Heart, Weight, Thermometer, FileText, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import adminApi from '../../api/adminApi';

const ScreeningFormModal = ({ donation, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        hemoglobin: '',
        systolic: '',
        diastolic: '',
        weight: '',
        temperature: '98.6',
        medicalHistory: '',
        screeningStatus: 'approved',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await adminApi.updateDonationScreening(donation.id, {
                hemoglobin: parseFloat(formData.hemoglobin),
                bloodPressure: {
                    systolic: parseInt(formData.systolic),
                    diastolic: parseInt(formData.diastolic)
                },
                weight: parseFloat(formData.weight),
                temperature: parseFloat(formData.temperature),
                medicalHistory: formData.medicalHistory,
                screeningStatus: formData.screeningStatus,
                notes: formData.notes
            });

            // If approved, automatically move to IN PROGRESS stage
            if (formData.screeningStatus === 'approved') {
                await adminApi.updateDonationStage(donation.id, 'in-progress');
                toast.success('Screening approved! Moved to IN PROGRESS');
            } else {
                toast.success('Screening data saved successfully!');
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save screening data:', error);
            toast.error('Failed to save screening data');
        } finally {
            setSubmitting(false);
        }
    };

    const isApproved = formData.screeningStatus === 'approved';

    return (
        <div className="mt-6 mb-6 bg-white rounded-2xl shadow-2xl w-full overflow-hidden border-2 border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="text-blue-600" size={24} />
                            Medical Screening
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Donor: <span className="font-semibold">{donation.name}</span> ({donation.group})
                        </p>
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
            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Hemoglobin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Thermometer size={16} className="text-red-500" />
                            Hemoglobin (g/dL) *
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="20"
                            required
                            value={formData.hemoglobin}
                            onChange={(e) => setFormData({ ...formData, hemoglobin: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="12.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Normal: 12-16 g/dL (female), 13-17 g/dL (male)</p>
                    </div>

                    {/* Weight */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Weight size={16} className="text-green-500" />
                            Weight (kg) *
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="200"
                            required
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="55"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum: 50 kg</p>
                    </div>

                    {/* Blood Pressure - Systolic */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Heart size={16} className="text-red-500" />
                            Systolic BP (mmHg) *
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="300"
                            required
                            value={formData.systolic}
                            onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="120"
                        />
                    </div>

                    {/* Blood Pressure - Diastolic */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Diastolic BP (mmHg) *
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="200"
                            required
                            value={formData.diastolic}
                            onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="80"
                        />
                        <p className="text-xs text-gray-500 mt-1">Normal: 90-140 / 60-90</p>
                    </div>

                    {/* Temperature */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Thermometer size={16} className="text-orange-500" />
                            Temperature (°F)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            min="90"
                            max="110"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                            placeholder="98.6"
                        />
                    </div>
                </div>

                {/* Medical History */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        Medical History
                    </label>
                    <textarea
                        value={formData.medicalHistory}
                        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                        rows="3"
                        placeholder="Any recent illness, medications, surgeries..."
                    />
                </div>

                {/* Screening Status */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Screening Decision *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, screeningStatus: 'approved' })}
                            className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${formData.screeningStatus === 'approved'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-green-200'
                                }`}
                        >
                            <CheckCircle size={18} />
                            <span className="font-medium">Approved</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, screeningStatus: 'rejected' })}
                            className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${formData.screeningStatus === 'rejected'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-200 hover:border-red-200'
                                }`}
                        >
                            <XCircle size={18} />
                            <span className="font-medium">Rejected</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, screeningStatus: 'deferred' })}
                            className={`p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${formData.screeningStatus === 'deferred'
                                ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                : 'border-gray-200 hover:border-yellow-200'
                                }`}
                        >
                            <Activity size={18} />
                            <span className="font-medium">Deferred</span>
                        </button>
                    </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                        rows="2"
                        placeholder="Any additional observations..."
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-2 text-sm font-bold text-white rounded-lg transition ${isApproved
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {submitting ? 'Saving...' : `Save & ${isApproved ? 'Approve' : 'Update Status'}`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScreeningFormModal;
