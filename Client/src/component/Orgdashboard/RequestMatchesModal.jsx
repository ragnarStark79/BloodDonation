import React, { useState, useEffect } from 'react';
import {
    X,
    Users,
    Building2,
    MapPin,
    Phone,
    Heart,
    CheckCircle,
    Calendar,
    Droplet,
    Package,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import requestApi from '../../api/requestApi';
import {
    formatDistance,
    getDistanceBadge,
    calculateResponseTime
} from '../../constants/requestConstants';

const RequestMatchesModal = ({ isOpen, request, onClose, onAssignSuccess }) => {
    const [activeTab, setActiveTab] = useState('donors');
    const [matches, setMatches] = useState({ donors: [], bloodBanks: [] });
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        if (isOpen && request) {
            fetchMatches();
        }
    }, [isOpen, request]);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const response = await requestApi.getRequestMatches(request._id);
            setMatches({
                donors: response.donors || [],
                bloodBanks: response.bloodBanks || response.organizations || []
            });
        } catch (error) {
            console.error('Failed to fetch matches:', error);
            toast.error('Failed to load matches');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignDonor = async (donorId) => {
        if (!window.confirm('Assign this donor to the request? They will be notified and an appointment will be scheduled.')) {
            return;
        }

        setAssigning(donorId);
        try {
            await requestApi.assignResponder(request._id, {
                type: 'DONOR',
                donorId: donorId
            });
            toast.success('Donor assigned successfully! Appointment created.');
            onAssignSuccess();
            onClose(); // Close modal after successful assignment
        } catch (error) {
            console.error('Failed to assign donor:', error);
            toast.error(error.response?.data?.message || 'Failed to assign donor');
        } finally {
            setAssigning(null);
        }
    };

    const handleAssignBloodBank = async (organizationId) => {
        if (!window.confirm('Request units from this blood bank? They will be notified to reserve the required units.')) {
            return;
        }

        setAssigning(organizationId);
        try {
            await requestApi.assignResponder(request._id, {
                type: 'BLOOD_BANK',
                organizationId: organizationId
            });
            toast.success('Blood bank assigned! They will reserve and transfer the units.');
            onAssignSuccess();
            onClose(); // Close modal after successful assignment
        } catch (error) {
            console.error('Failed to assign blood bank:', error);
            toast.error(error.response?.data?.message || 'Failed to assign blood bank');
        } finally {
            setAssigning(null);
        }
    };

    if (!isOpen || !request) return null;

    const donorCount = matches.donors.length;
    const bankCount = matches.bloodBanks.length;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative min-h-screen flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Available Matches</h2>
                                <p className="text-sm text-blue-100">
                                    {request.bloodGroup} Blood • {request.unitsNeeded} Units
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 bg-white sticky top-[76px] z-10">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('donors')}
                                className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${activeTab === 'donors'
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Heart className="w-5 h-5" />
                                    <span>Interested Donors</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'donors'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        {donorCount}
                                    </span>
                                </div>
                                {activeTab === 'donors' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('bloodBanks')}
                                className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${activeTab === 'bloodBanks'
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    <span>Blood Banks</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'bloodBanks'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        {bankCount}
                                    </span>
                                </div>
                                {activeTab === 'bloodBanks' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Donors Tab */}
                                {activeTab === 'donors' && (
                                    <div className="space-y-4">
                                        {donorCount === 0 ? (
                                            <div className="text-center py-12">
                                                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    No Interested Donors Yet
                                                </h3>
                                                <p className="text-gray-600">
                                                    Donors will appear here when they express interest in your request
                                                </p>
                                            </div>
                                        ) : (
                                            matches.donors.map((donor) => {
                                                const distanceBadge = getDistanceBadge(donor.distance);
                                                const distanceColors = {
                                                    green: 'bg-green-100 text-green-700 border-green-300',
                                                    blue: 'bg-blue-100 text-blue-700 border-blue-300',
                                                    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                                                    gray: 'bg-gray-100 text-gray-700 border-gray-300'
                                                };

                                                return (
                                                    <div
                                                        key={donor._id}
                                                        className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-blue-300 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                {/* Avatar/Blood Group */}
                                                                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex flex-col items-center justify-center text-white shadow-md">
                                                                    <span className="text-xl font-bold leading-none">{donor.bloodGroup}</span>
                                                                    <span className="text-[10px] opacity-90">Donor</span>
                                                                </div>

                                                                <div>
                                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                                        {donor.Name || 'N/A'}
                                                                    </h3>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                            <MapPin className="w-4 h-4" />
                                                                            <span>{formatDistance(donor.distance)}</span>
                                                                        </div>
                                                                        <div className={`px-2 py-0.5 rounded text-xs font-semibold border ${distanceColors[distanceBadge.color]}`}>
                                                                            {distanceBadge.label}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Eligibility Badge */}
                                                            {donor.isEligible ? (
                                                                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                                    Eligible
                                                                </div>
                                                            ) : (
                                                                <div className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                                    Check Eligibility
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Donor Details */}
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Phone className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-700">{donor.PhoneNumber || 'Not provided'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-700">
                                                                    Last donated: {donor.lastDonationDate ? calculateResponseTime(donor.lastDonationDate) + ' ago' : 'Never'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Interested Time */}
                                                        <p className="text-xs text-gray-500 mb-4">
                                                            Expressed interest {calculateResponseTime(donor.interestedAt || donor.createdAt)} ago
                                                        </p>

                                                        {/* Action - Check if this donor is already assigned */}
                                                        {request.assignedTo?.donorId?.toString() === donor._id?.toString() ? (
                                                            <div className="w-full px-4 py-2.5 bg-green-100 border-2 border-green-300 text-green-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                                                                <CheckCircle className="w-5 h-5" />
                                                                Already Assigned
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAssignDonor(donor._id)}
                                                                disabled={assigning === donor._id || request.status === 'ASSIGNED'}
                                                                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                            >
                                                                {assigning === donor._id ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Assigning...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Assign Donor & Schedule Appointment
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}

                                {/* Blood Banks Tab */}
                                {activeTab === 'bloodBanks' && (
                                    <div className="space-y-4">
                                        {bankCount === 0 ? (
                                            <div className="text-center py-12">
                                                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    No Blood Banks Available
                                                </h3>
                                                <p className="text-gray-600">
                                                    No blood banks in your area have the required blood type in stock
                                                </p>
                                            </div>
                                        ) : (
                                            matches.bloodBanks.map((bank) => {
                                                const distanceBadge = getDistanceBadge(bank.distance);
                                                const distanceColors = {
                                                    green: 'bg-green-100 text-green-700 border-green-300',
                                                    blue: 'bg-blue-100 text-blue-700 border-blue-300',
                                                    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
                                                    gray: 'bg-gray-100 text-gray-700 border-gray-300'
                                                };

                                                return (
                                                    <div
                                                        key={bank._id}
                                                        className="bg-white rounded-xl border-2 border-gray-200 p-5 hover:border-blue-300 transition-all"
                                                    >
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                {/* Bank Icon */}
                                                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center text-white shadow-md">
                                                                    <Building2 className="w-8 h-8" />
                                                                </div>

                                                                <div>
                                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                                        {bank.organizationName}
                                                                    </h3>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                            <MapPin className="w-4 h-4" />
                                                                            <span>{formatDistance(bank.distance)}</span>
                                                                        </div>
                                                                        <div className={`px-2 py-0.5 rounded text-xs font-semibold border ${distanceColors[distanceBadge.color]}`}>
                                                                            {distanceBadge.label}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Available Stock Badge */}
                                                            <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                                <Package className="w-3.5 h-3.5" />
                                                                {bank.availableUnits} Units Available
                                                            </div>
                                                        </div>

                                                        {/* Bank Details */}
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Phone className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-700">{bank.phone || 'Not provided'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                                <span className="text-gray-700">{bank.city || 'Location'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Stock Details */}
                                                        <div className="p-3 bg-purple-50 rounded-lg mb-4">
                                                            <p className="text-sm text-purple-900">
                                                                <Droplet className="w-4 h-4 inline mr-1 text-purple-600" />
                                                                <span className="font-semibold">{bank.availableUnits} units</span> of <span className="font-semibold">{request.bloodGroup}</span> blood available
                                                            </p>
                                                        </div>

                                                        {/* Action - Check if this blood bank is already assigned */}
                                                        {request.assignedTo?.organizationId?.toString() === bank._id?.toString() ? (
                                                            <div className="w-full px-4 py-2.5 bg-green-100 border-2 border-green-300 text-green-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                                                                <CheckCircle className="w-5 h-5" />
                                                                Already Assigned
                                                            </div>
                                                        ) : request.reservedBy?.toString() === bank._id?.toString() ? (
                                                            <div className="w-full px-4 py-2.5 bg-green-100 border-2 border-green-300 text-green-700 rounded-lg font-semibold flex items-center justify-center gap-2">
                                                                <CheckCircle className="w-5 h-5" />
                                                                Units Reserved
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleAssignBloodBank(bank._id)}
                                                                disabled={assigning === bank._id || request.status === 'ASSIGNED'}
                                                                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                            >
                                                                {assigning === bank._id ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        Requesting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Request Units from Blood Bank
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between text-sm">
                            <p className="text-gray-600">
                                Select a donor or blood bank to fulfill your request
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestMatchesModal;
