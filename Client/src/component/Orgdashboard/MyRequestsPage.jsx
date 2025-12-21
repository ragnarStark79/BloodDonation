import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    RefreshCw,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Users,
    FileText
} from 'lucide-react';
import CreateRequestModal from './CreateRequestModal';
import RequestMatchesModal from './RequestMatchesModal';
import requestApi from '../../api/requestApi';
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

const MyRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [matchesModalOpen, setMatchesModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        urgency: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch requests
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
                ...(filters.status && { status: filters.status }),
                ...(filters.urgency && { urgency: filters.urgency })
            };

            const response = await requestApi.getMyRequests(params);

            if (isRefresh) {
                setRequests(response.requests || response.items || []);
                setPage(1);
            } else {
                setRequests(prev =>
                    page === 1
                        ? response.requests || response.items || []
                        : [...prev, ...(response.requests || response.items || [])]
                );
            }

            setHasMore(response.hasMore || false);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [page, filters.status, filters.urgency]);

    const handleCreateSuccess = (newRequest) => {
        fetchRequests(true);
        toast.success('Request created! Nearby donors and blood banks have been notified.');
    };

    const handleViewMatches = (request) => {
        setSelectedRequest(request);
        setMatchesModalOpen(true);
    };

    const handleFulfillRequest = async (requestId) => {
        if (!window.confirm('Are you sure you want to mark this request as fulfilled?')) {
            return;
        }

        try {
            await requestApi.fulfillRequest(requestId);
            toast.success('Request marked as fulfilled');
            fetchRequests(true);
        } catch (error) {
            console.error('Failed to fulfill request:', error);
            toast.error(error.response?.data?.message || 'Failed to fulfill request');
        }
    };

    const handleCancelRequest = async (requestId) => {
        const reason = window.prompt('Please provide a reason for cancellation:');
        if (!reason) return;

        try {
            await requestApi.cancelRequest(requestId, reason);
            toast.success('Request cancelled');
            fetchRequests(true);
        } catch (error) {
            console.error('Failed to cancel request:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel request');
        }
    };

    const filteredRequests = requests.filter(request => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
                request.bloodGroup?.toLowerCase().includes(searchLower) ||
                request.caseDetails?.toLowerCase().includes(searchLower) ||
                request._id?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const stats = {
        total: requests.length,
        active: requests.filter(r => isRequestActive(r.status)).length,
        fulfilled: requests.filter(r => r.status === REQUEST_STATUS.FULFILLED).length,
        critical: requests.filter(r => r.urgency === REQUEST_URGENCY.CRITICAL && isRequestActive(r.status)).length
    };

    const activeFiltersCount = [filters.status, filters.urgency].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-red-600" />
                            My Blood Requests
                        </h1>
                        <p className="text-gray-600 mt-1">Create and manage your hospital's blood requests</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchRequests(true)}
                            disabled={refreshing}
                            className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Request
                        </button>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by blood group, case details, or ID..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${showFilters || activeFiltersCount > 0
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="">All Statuses</option>
                                    {Object.values(REQUEST_STATUS).map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                                <select
                                    value={filters.urgency}
                                    onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="">All Urgency Levels</option>
                                    {Object.values(REQUEST_URGENCY).map(urgency => (
                                        <option key={urgency} value={urgency}>{urgency}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({ status: '', urgency: '', search: '' })}
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
                        <FileText className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.active}</p>
                        </div>
                        <Clock className="w-10 h-10 text-blue-600 opacity-20" />
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Fulfilled</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.fulfilled}</p>
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
                        <FileText className="w-10 h-10 text-red-600 opacity-20" />
                    </div>
                </div>
            </div>

            {/* Request List */}
            {loading && page === 1 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
                    <p className="text-gray-600 mb-6">
                        {filters.status || filters.urgency || filters.search
                            ? 'Try adjusting your filters'
                            : 'Create your first blood request to get started'}
                    </p>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Create Request
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.map((request) => {
                        const statusColor = getStatusColor(request.status);
                        const urgencyColor = getUrgencyColor(request.urgency);

                        return (
                            <div
                                key={request._id}
                                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
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
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    {request.unitsNeeded} Units - {getComponentLabel(request.component)}
                                                </h3>
                                                <div className={`px-3 py-1 rounded-full ${statusColor.bg} ${statusColor.text} text-xs font-semibold flex items-center gap-1.5`}>
                                                    <div className={`w-2 h-2 rounded-full ${statusColor.dot}`} />
                                                    {request.status}
                                                </div>
                                                <div className={`px-3 py-1 rounded-full ${urgencyColor.bg} ${urgencyColor.text} text-xs font-semibold`}>
                                                    {request.urgency}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                Created {calculateResponseTime(request.createdAt)} ago • #{request._id?.slice(-8)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {isRequestActive(request.status) && (
                                            <>
                                                <button
                                                    onClick={() => handleViewMatches(request)}
                                                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${request.status === REQUEST_STATUS.ASSIGNED
                                                            ? 'bg-purple-600 hover:bg-purple-700'
                                                            : 'bg-blue-600 hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {request.status === REQUEST_STATUS.ASSIGNED ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            View Assigned Donor
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Users className="w-4 h-4" />
                                                            View Matches
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleFulfillRequest(request._id)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Fulfill
                                                </button>
                                                <button
                                                    onClick={() => handleCancelRequest(request._id)}
                                                    className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Case Details */}
                                <p className="text-sm text-gray-700 line-clamp-2 mb-4">{request.caseDetails}</p>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-xs text-gray-500">Interested Donors</p>
                                        <p className="text-lg font-semibold text-gray-900">{request.interestedDonorsCount || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Available Banks</p>
                                        <p className="text-lg font-semibold text-gray-900">{request.availableBanksCount || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Contact</p>
                                        <p className="text-sm font-semibold text-gray-900">{request.contactPerson}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-semibold text-gray-900">{request.contactPhone}</p>
                                    </div>
                                </div>
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

            {/* Modals */}
            <CreateRequestModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <RequestMatchesModal
                isOpen={matchesModalOpen}
                request={selectedRequest}
                onClose={() => setMatchesModalOpen(false)}
                onAssignSuccess={() => {
                    setMatchesModalOpen(false);
                    fetchRequests(true);
                }}
            />
        </div>
    );
};

export default MyRequestsPage;
