import React from 'react';
import { X, User, Droplet, Phone, Mail, Calendar, FileText, History } from 'lucide-react';
import { format } from 'date-fns';

const DonorDetailsModal = ({ donation, onClose, onNext }) => {
    return (
        <div className="mt-6 mb-6 bg-white rounded-2xl shadow-2xl w-full overflow-hidden border-2 border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-red-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                            {donation.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{donation.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                                    {donation.group}
                                </span>
                                <span className="text-sm text-gray-600">
                                    Registered: {format(new Date(donation.date), 'dd MMM yyyy, hh:mm a')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-100 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Contact Information */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User size={16} />
                        Contact Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                <Phone size={14} />
                                Phone Number
                            </div>
                            <div className="font-semibold text-gray-800">
                                {donation.phone || 'Not provided'}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                                <Mail size={14} />
                                Email Address
                            </div>
                            <div className="font-semibold text-gray-800 truncate">
                                {donation.email || 'Not provided'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Donation Details */}
                <div>
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Droplet size={16} />
                        Donation Details
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-blue-600 text-xs mb-1">Current Stage</div>
                            <div className="font-bold text-blue-800 capitalize">
                                {donation.stage?.replace('-', ' ')}
                            </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="text-green-600 text-xs mb-1">Status</div>
                            <div className="font-bold text-green-800">
                                {donation.status || 'Active'}
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-purple-600 text-xs mb-1">Donation ID</div>
                            <div className="font-bold text-purple-800 text-xs truncate">
                                {donation.id.slice(-8)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {donation.notes && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={16} />
                            Notes
                        </h4>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {donation.notes}
                            </p>
                        </div>
                    </div>
                )}

                {/* Appointment Link */}
                {donation.appointmentId && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                            <Calendar size={16} />
                            <span className="text-sm font-semibold">
                                Created from scheduled appointment
                            </span>
                        </div>
                    </div>
                )}

                {/* History */}
                {donation.history && donation.history.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <History size={16} />
                            Activity History
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {donation.history.map((entry, index) => (
                                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-gray-800">{entry.action}</span>
                                        <span className="text-xs text-gray-500">
                                            {format(new Date(entry.performedAt), 'dd MMM, hh:mm a')}
                                        </span>
                                    </div>
                                    {entry.notes && (
                                        <p className="text-xs text-gray-600">{entry.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                    Donation created on {format(new Date(donation.date), 'dd MMMM yyyy')}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                        Close
                    </button>
                    {/* Show Next button only for NEW DONORS stage */}
                    {(() => {
                        // Debug logging
                        console.log('Donation stage:', donation.stage);
                        console.log('Current Stage display:', donation.stage?.replace('-', ' '));

                        // Show button if stage is 'new-donors' OR if the current stage field shows blank/new donors
                        const shouldShowButton = !donation.stage || donation.stage === 'new-donors' || donation.stage === 'new-donor';
                        console.log('Should show Next button:', shouldShowButton);

                        return shouldShowButton;
                    })() && (
                            <button
                                onClick={() => {
                                    if (window.confirm('Move this donor to SCREENING stage?')) {
                                        onNext && onNext(donation);
                                    }
                                }}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                            >
                                Next
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                </div>
            </div>
        </div>
    );
};

export default DonorDetailsModal;
