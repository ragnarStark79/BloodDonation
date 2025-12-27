import React, { useState, useEffect } from 'react';
import { X, Droplet, Clock, Package, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import adminApi from '../../api/adminApi';

const BloodCollectionModal = ({ donation, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        bloodBagIdGenerated: '',
        volumeCollected: 450,
        unitsCollected: 1,
        componentType: 'Whole Blood',
        collectionStartTime: '',
        collectionEndTime: '',
        donationBed: '',
        notes: ''
    });

    const [saving, setSaving] = useState(false);

    const componentTypes = ['Whole Blood', 'Plasma', 'Platelets', 'RBC'];

    // Auto-generate blood bag ID on mount
    useEffect(() => {
        const generateBagId = () => {
            const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `BB-${donation.id.slice(-4)}-${date}-${random}`;
        };

        setFormData(prev => ({
            ...prev,
            bloodBagIdGenerated: generateBagId()
        }));
    }, [donation.id]);

    // Calculate collection duration
    const getCollectionDuration = () => {
        if (!formData.collectionStartTime || !formData.collectionEndTime) return null;
        const start = new Date(formData.collectionStartTime);
        const end = new Date(formData.collectionEndTime);
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);
        return diffMins > 0 ? diffMins : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.bloodBagIdGenerated) {
            toast.error('Blood bag ID is required');
            return;
        }

        if (formData.volumeCollected < 200 || formData.volumeCollected > 500) {
            toast.error('Volume must be between 200-500 ml');
            return;
        }

        if (!formData.collectionStartTime || !formData.collectionEndTime) {
            toast.error('Collection start and end times are required');
            return;
        }

        const start = new Date(formData.collectionStartTime);
        const end = new Date(formData.collectionEndTime);
        if (end <= start) {
            toast.error('End time must be after start time');
            return;
        }

        setSaving(true);
        try {
            // Debug: Log the form data being sent
            console.log('📤 Sending Collection Data:', formData);

            // Save collection data
            await adminApi.updateDonationCollection(donation.id, formData);

            // Automatically move to COMPLETED stage
            await adminApi.updateDonationStage(donation.id, 'completed');

            toast.success('Collection data saved! Moved to COMPLETED');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save collection data:', error);
            toast.error('Failed to save collection data');
        } finally {
            setSaving(false);
        }
    };

    const duration = getCollectionDuration();

    return (
        <div className="mt-6 mb-6 bg-white rounded-2xl shadow-2xl w-full overflow-hidden border-2 border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-yellow-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-yellow-600 text-white flex items-center justify-center">
                            <Droplet size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Blood Collection</h3>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Blood Bag ID */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <Package size={16} />
                        Blood Bag ID *
                    </label>
                    <input
                        type="text"
                        value={formData.bloodBagIdGenerated}
                        onChange={(e) => setFormData({ ...formData, bloodBagIdGenerated: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none font-mono"
                        placeholder="BB-XXXX-YYYYMMDD-ABCD"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated, can be edited if needed</p>
                </div>

                {/* Volume, Units, and Component Type */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Volume Collected (ml) *
                        </label>
                        <input
                            type="number"
                            value={formData.volumeCollected}
                            onChange={(e) => setFormData({ ...formData, volumeCollected: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none"
                            min="200"
                            max="500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Range: 200-500 ml</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Units Collected *
                        </label>
                        <input
                            type="number"
                            value={formData.unitsCollected}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                console.log('Units Collected Changed:', value);
                                setFormData({ ...formData, unitsCollected: value });
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none"
                            min="1"
                            max="10"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Range: 1-10 units</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Component Type *
                        </label>
                        <select
                            value={formData.componentType}
                            onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none"
                            required
                        >
                            {componentTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Collection Times */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Clock size={16} />
                            Start Time *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.collectionStartTime}
                            onChange={(e) => setFormData({ ...formData, collectionStartTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Clock size={16} />
                            End Time *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.collectionEndTime}
                            onChange={(e) => setFormData({ ...formData, collectionEndTime: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Duration Display */}
                {duration !== null && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800 text-sm">
                            <Clock size={16} />
                            <span className="font-semibold">
                                Collection Duration: {duration} minutes
                            </span>
                        </div>
                    </div>
                )}

                {/* Donation Bed */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                        <MapPin size={16} />
                        Donation Bed / Location
                    </label>
                    <input
                        type="text"
                        value={formData.donationBed}
                        onChange={(e) => setFormData({ ...formData, donationBed: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none"
                        placeholder="e.g., Bed 3, Room A"
                    />
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-100 outline-none resize-none"
                        rows="3"
                        placeholder="Any additional observations or notes..."
                    />
                </div>
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
                    className="px-4 py-2 text-sm font-bold text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                        </>
                    ) : (
                        'Save Collection Data'
                    )}
                </button>
            </div>
        </div>
    );
};

export default BloodCollectionModal;
