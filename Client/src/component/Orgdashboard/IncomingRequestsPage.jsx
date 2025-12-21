import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    Package,
    MapPin,
    Building2,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    Droplet
} from 'lucide-react';
import requestApi from '../../api/requestApi';
import ReserveUnitsModal from './ReserveUnitsModal';
import { toast } from 'sonner';
import {
    REQUEST_STATUS,
    REQUEST_URGENCY,
    BLOOD_GROUPS,
    getStatusColor,
    getUrgencyColor,
    formatDistance,
    calculateResponseTime,
    getComponentLabel,
    isRequestActive
} from '../../constants/requestConstants';

const IncomingRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [reserveModalOpen, setReserveModalOpen] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        bloodGroup: '',
        urgency: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch incoming requests
    const fetchRequests = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const params = {
                page: isRefresh ? 1 : page,
                limit: 10,
                ...(filters.bloodGroup && { bloodGroup: filters.bloodGroup }),
                ...(filters.urgency && { urgency: filters.urgency })
            };

            const response = await requestApi.getIncomingRequests(params);

            // Backend returns array directly, not wrapped in object
            const requestsArray = Array.isArray(response) ? response : (response.requests || response.items || []);

            if (isRefresh) {
                setRequests(requestsArray);
                setPage(1);
            } else {
                setRequests(prev =>
                    page === 1
                        ? requestsArray
                        : [...prev, ...requestsArray]
                );
            }

            setHasMore(response.hasMore || false);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            toast.error('Failed to load incoming requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, filters.bloodGroup, filters.urgency]);

    const handleReserveUnits = (request) => {
        setSelectedRequest(request);
        setReserveModalOpen(true);
    };

    const handleReserveSuccess = () => {
        setReserveModalOpen(false);
        fetchRequests(true);
        toast.success('Units reserved successfully!');
    };

    const filteredRequests = requests.filter(request => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
                request.hospitalName?.toLowerCase().includes(searchLower) ||
                request.location?.city?.toLowerCase().includes(searchLower) ||
                request.bloodGroup?.toLowerCase().includes(searchLower) ||
                request.caseDetails?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const stats = {
        total: filteredRequests.length,
        critical: filteredRequests.filter(r => r.urgency === REQUEST_URGENCY.CRITICAL).length,
        canFulfill: filteredRequests.filter(r => r.canFulfill).length,
        active: filteredRequests.filter(r => isRequestActive(r.status)).length
    };

    const activeFiltersCount = [filters.bloodGroup, filters.urgency].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Package className="w-8 h-8 text-purple-600" />
                            Incoming Blood Requests
                        </h1>
                        <p className="text-gray-600 mt-1">Requests from hospitals that you can fulfill from your inventory</p>
                    </div>
                    <button
                        onClick={() => fetchRequests(true)}
                        disabled={refreshing}
                        className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by hospital, location, blood group, or case details..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${showFilters || activeFiltersCount > 0
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                                <select
                                    value={filters.bloodGroup}
                                    onChange={(e) => setFilters(prev => ({ ...prev, bloodGroup: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">All Blood Groups</option>
                                    {BLOOD_GROUPS.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                                <select
                                    value={filters.urgency}
                                    onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">All Urgency Levels</option>
                                    {Object.values(REQUEST_URGENCY).map(urgency => (
                                        <option key={urgency} value={urgency}>{urgency}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ bloodGroup: '', urgency: '', search: '' })}
                                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <Package className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Can Fulfill</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.canFulfill}</p>
                        </div>
                        <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Critical</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.critical}</p>
                        </div>
                        <AlertCircle className="w-10 h-10 text-red-600 opacity-20" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.active}</p>
                        </div>
                        <Clock className="w-10 h-10 text-purple-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Request List */}
            {loading && page === 1 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Incoming Requests</h3>
                    <p className="text-gray-600">
                        {filters.bloodGroup || filters.urgency || filters.search
                            ? 'Try adjusting your filters'
                            : 'There are no requests that match your inventory at the moment'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((request) => {
                        const statusColor = getStatusColor(request.status);
                        const urgencyColor = getUrgencyColor(request.urgency);

                        return (
                            <div
                                key={request._id}
                                className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-purple-300 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        {/* Blood Group Badge */}
                                        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex flex-col items-center justify-center text-white shadow-md flex-shrink-0">
                                            <span className="text-xl font-bold leading-none">{request.bloodGroup}</span>
                                            <span className="text-[10px] opacity-90 mt-0.5">Blood</span>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Building2 className="w-4 h-4 text-gray-400" />
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {request.hospitalName || request.organizationName}
                                                </h3>
                                                <div className={`px-3 py-1 rounded-full ${urgencyColor.bg} ${urgencyColor.text} text-xs font-semibold`}>
                                                    {request.urgency}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{formatDistance(request.distance)} away</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{calculateResponseTime(request.createdAt)} ago</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Availability Badge */}
                                    {request.canFulfill ? (
                                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-sm flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            {request.availableUnits} Units in Stock
                                        </div>
                                    ) : (
                                        <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-semibold text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Insufficient Stock
                                        </div>
                                    )}
                                </div>

                                {/* Requirements */}
                                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Units Needed</p>
                                        <p className="text-lg font-bold text-gray-900">{request.unitsNeeded}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Component</p>
                                        <p className="text-sm font-semibold text-gray-900">{getComponentLabel(request.component)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Contact</p>
                                        <p className="text-sm font-semibold text-gray-900">{request.contactPhone}</p>
                                    </div>
                                </div>

                                {/* Case Details */}
                                <p className="text-sm text-gray-700 line-clamp-2 mb-4">{request.caseDetails}</p>

                                {/* Action */}
                                {request.canFulfill && isRequestActive(request.status) ? (
                                    <button
                                        onClick={() => handleReserveUnits(request)}
                                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Package className="w-5 h-5" />
                                        Reserve & Issue Units
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full px-6 py-3 bg-gray-100 text-gray-400 rounded-lg font-semibold cursor-not-allowed"
                                    >
                                        {!isRequestActive(request.status) ? 'Request No Longer Active' : 'Cannot Fulfill - Insufficient Stock'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Load More */}
            {hasMore && filteredRequests.length > 0 && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={loading}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}


            {/* Reserve Units Modal */}
            <ReserveUnitsModal
                request={selectedRequest}
                isOpen={reserveModalOpen}
                onClose={() => setReserveModalOpen(false)}
                onSuccess={() => {
                    fetchRequests(true); // Refresh requests after reservation
                }}
            />
        </div>
    );
};

export default IncomingRequestsPage;
