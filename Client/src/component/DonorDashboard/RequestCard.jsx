import React from 'react';
import {
    Droplet,
    MapPin,
    Clock,
    AlertCircle,
    Heart,
    Calendar,
    CheckCircle
} from 'lucide-react';
import {
    REQUEST_URGENCY,
    getStatusColor,
    getUrgencyColor,
    formatDistance,
    getDistanceBadge,
    calculateResponseTime,
    getComponentLabel
} from '../../constants/requestConstants';

const RequestCard = ({ request, onViewDetails, onExpressInterest, isInterested }) => {
    const urgencyColor = getUrgencyColor(request.urgency);
    const statusColor = getStatusColor(request.status);
    const distanceBadge = getDistanceBadge(request.distance);

    const distanceColors = {
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        gray: 'bg-gray-100 text-gray-700'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Blood Group Badge */}
                    <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex flex-col items-center justify-center text-white shadow-md">
                        <span className="text-lg font-bold leading-none">{request.bloodGroup}</span>
                        <span className="text-[10px] opacity-90 mt-0.5">Blood</span>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{request.hospitalName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">{request.location?.city || 'Location'}</span>
                        </div>
                    </div>
                </div>

                {/* Urgency Badge */}
                <div className={`px-3 py-1 rounded-full ${urgencyColor.bg} ${urgencyColor.text} text-xs font-semibold flex items-center gap-1.5`}>
                    {request.urgency === REQUEST_URGENCY.CRITICAL && <AlertCircle className="w-3.5 h-3.5" />}
                    {request.urgency}
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500">Units Needed</p>
                        <p className="text-sm font-semibold text-gray-900">{request.unitsNeeded} units</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500">Component</p>
                        <p className="text-sm font-semibold text-gray-900">{getComponentLabel(request.component)}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500">Distance</p>
                        <p className={`text-sm font-semibold ${distanceColors[distanceBadge.color]}`}>
                            {formatDistance(request.distance)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-500">Posted</p>
                        <p className="text-sm font-semibold text-gray-900">
                            {calculateResponseTime(request.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Case Details Preview */}
            {request.caseDetails && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Case Details</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{request.caseDetails}</p>
                </div>
            )}

            {/* Interested Donors Count */}
            {request.interestedDonorsCount > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-red-600 fill-current" />
                    <span>{request.interestedDonorsCount} donor{request.interestedDonorsCount > 1 ? 's' : ''} interested</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={() => onViewDetails(request)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    View Details
                </button>

                {request.isAssignedToMe ? (
                    <div className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 border-2 border-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        ✅ You're Assigned!
                    </div>
                ) : !isInterested ? (
                    <button
                        onClick={() => onExpressInterest(request._id)}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Heart className="w-4 h-4" />
                        I Can Donate
                    </button>
                ) : (
                    <div className="flex-1 px-4 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 border-2 border-green-300">
                        <Heart className="w-4 h-4 fill-current" />
                        Interest Expressed
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestCard;
