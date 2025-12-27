import React, { useState, useEffect } from 'react';
import {
    X,
    Calendar,
    Clock,
    Building2,
    MapPin,
    Droplet,
    AlertCircle,
    CheckCircle,
    Loader2
} from 'lucide-react';
import donorApi from '../../api/donorApi';
import { toast } from 'sonner';

const BookAppointmentModal = ({ isOpen, onClose, request, onSuccess }) => {
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        notes: '',
        organizationId: '',
        organizationInfo: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Organization search state
    const [searchQuery, setSearchQuery] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            // Default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            setFormData({
                date: dateStr,
                time: '09:00',
                notes: '',
                organizationId: '',
                organizationInfo: ''
            });
            setErrors({});
            setSearchQuery('');
            setOrganizations([]);
            setSelectedOrg(null);
            setShowDropdown(false);
        }
    }, [isOpen]);

    // Debounced organization search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2 && !request) {
                setSearching(true);
                try {
                    const results = await donorApi.searchOrganizations(searchQuery);
                    setOrganizations(results);
                    setShowDropdown(true);
                } catch (error) {
                    console.error('Failed to search organizations:', error);
                    setOrganizations([]);
                } finally {
                    setSearching(false);
                }
            } else {
                setOrganizations([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, request]);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else {
            const selectedDate = new Date(formData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                newErrors.date = 'Date must be in the future';
            }
        }

        if (!formData.time) {
            newErrors.time = 'Time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Check if we have organizationId
        const orgId = request?.organizationId?._id || request?.organizationId || selectedOrg?._id || formData.organizationId;


        if (!orgId) {
            toast.error('Please provide hospital/organization details');
            return;
        }

        try {
            setSubmitting(true);

            // Combine date and time
            const dateTime = new Date(`${formData.date}T${formData.time}`);

            const appointmentData = {
                organizationId: orgId,
                dateTime: dateTime.toISOString(),
                requestId: request?._id,
                notes: formData.notes
            };


            await donorApi.bookAppointment(appointmentData);

            toast.success('Appointment booked successfully!');

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (error) {
            console.error('Failed to book appointment:', error);
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDateChange = (e) => {
        setFormData({ ...formData, date: e.target.value });
        if (errors.date) {
            setErrors({ ...errors, date: null });
        }
    };

    const handleTimeChange = (e) => {
        setFormData({ ...formData, time: e.target.value });
        if (errors.time) {
            setErrors({ ...errors, time: null });
        }
    };

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
                                <p className="text-sm text-gray-500">Schedule your donation</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Request Info (if provided) */}
                        {request && (
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                        <Droplet className="w-6 h-6 fill-current" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">
                                            {request.hospitalName || request.organizationName}
                                        </h3>
                                        <div className="space-y-1 text-sm text-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Droplet className="w-3.5 h-3.5 text-red-600" />
                                                <span>Blood Group: <strong>{request.bloodGroup}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                                <span>{request.location?.city || 'Location'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Organization Search (for standalone booking) */}
                        {!request && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                                <div className="flex items-start gap-3 mb-3">
                                    <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-sm">Select Hospital/Blood Bank</h4>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            Search by name or city
                                        </p>
                                    </div>
                                </div>

                                {/* Search Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={selectedOrg ? selectedOrg.organizationName || selectedOrg.Name : searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setSelectedOrg(null);
                                        }}
                                        onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Type to search hospitals or blood banks..."
                                        required={!request}
                                    />
                                    {searching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        </div>
                                    )}

                                    {/* Dropdown Results */}
                                    {showDropdown && organizations.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {organizations.map((org) => (
                                                <button
                                                    key={org._id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOrg(org);
                                                        setSearchQuery('');
                                                        setShowDropdown(false);
                                                        setFormData({ ...formData, organizationId: org._id });
                                                    }}
                                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-0 transition flex items-start gap-3"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {org.organizationType === 'HOSPITAL' ? '🏥' : '🩸'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-gray-800 text-sm truncate">
                                                            {org.organizationName || org.Name}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {org.City}, {org.State} • {org.organizationType === 'HOSPITAL' ? 'Hospital' : 'Blood Bank'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* No Results */}
                                    {showDropdown && !searching && searchQuery.length >= 2 && organizations.length === 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                                            No organizations found. Try a different search term.
                                        </div>
                                    )}
                                </div>

                                {/* Selected Organization Display */}
                                {selectedOrg && (
                                    <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-2">
                                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                <div>
                                                    <div className="font-semibold text-gray-800 text-sm">
                                                        {selectedOrg.organizationName || selectedOrg.Name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {selectedOrg.City}, {selectedOrg.State}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedOrg(null);
                                                    setFormData({ ...formData, organizationId: '' });
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Appointment Date *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={handleDateChange}
                                    min={minDate}
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    required
                                />
                            </div>
                            {errors.date && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.date}
                                </p>
                            )}
                        </div>

                        {/* Time Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Appointment Time *
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={handleTimeChange}
                                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.time ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    required
                                />
                            </div>
                            {errors.time && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.time}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                Select a time during hospital hours (usually 9 AM - 5 PM)
                            </p>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                placeholder="Any special requests or information..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">Before your appointment:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                                        <li>Get adequate rest and sleep</li>
                                        <li>Eat a healthy meal before donating</li>
                                        <li>Drink plenty of water</li>
                                        <li>Bring a valid ID</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Confirm Booking
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookAppointmentModal;
