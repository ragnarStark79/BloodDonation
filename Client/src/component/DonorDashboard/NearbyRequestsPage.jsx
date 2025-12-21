import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    RefreshCw,
    Heart,
    AlertCircle,
    MapPin,
    Loader2
} from 'lucide-react';
import RequestCard from './RequestCard';
import RequestDetailModal from './RequestDetailModal';
import requestApi from '../../api/requestApi';
import { toast } from 'sonner';
import {
    REQUEST_URGENCY,
    BLOOD_GROUPS,
    REQUEST_STATUS
} from '../../constants/requestConstants';

const NearbyRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [interestedRequests, setInterestedRequests] = useState(new Set());

    // Geolocation state
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [useLocation, setUseLocation] = useState(true);
    const [distanceKm, setDistanceKm] = useState(10);

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

    // Get user's geolocation
    useEffect(() => {
        if (useLocation && !userLocation) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setUserLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                        setLocationError(null);
                        toast.success('Location access granted');
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        setLocationError(error.message);
                        toast.error('Unable to access location');
                    }
                );
            } else {
                setLocationError('Geolocation not supported');
                toast.error('Browser does not support geolocation');
            }
        }
    }, [useLocation, userLocation]);

    // Fetch nearby requests
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
                ...(filters.urgency && { urgency: filters.urgency }),
                // Add location params if available
                ...(useLocation && userLocation && {
                    lat: userLocation.lat,
                    lng: userLocation.lng,
                    km: distanceKm
                })
            };

            const response = await requestApi.getNearbyRequests(params);

            if (isRefresh) {
                setRequests(response.requests || response.items || []);
                setPage(1);
            } else {
                setRequests(prev => page === 1 ? response.requests || response.items || [] : [...prev, ...(response.requests || response.items || [])]);
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
    }, [page, filters.bloodGroup, filters.urgency, userLocation, useLocation, distanceKm]);

    const handleExpressInterest = async (requestId) => {
        try {
            await requestApi.expressInterest(requestId);
            setInterestedRequests(prev => new Set([...prev, requestId]));
            toast.success('Interest expressed successfully! Hospital will contact you soon.');
            // Refresh to update interested count
            fetchRequests(true);
        } catch (error) {
            console.error('Failed to express interest:', error);
            toast.error(error.response?.data?.message || 'Failed to express interest');
        }
    };

    const handleViewDetails = (request) => {
        setSelectedRequest(request);
        setModalOpen(true);
    };

    const handleRefresh = () => {
        fetchRequests(true);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({ bloodGroup: '', urgency: '', search: '' });
        setPage(1);
    };

    const filteredRequests = requests.filter(request => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
                request.hospitalName?.toLowerCase().includes(searchLower) ||
                request.location?.city?.toLowerCase().includes(searchLower) ||
                request.bloodGroup?.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const activeFiltersCount = [filters.bloodGroup, filters.urgency].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Heart className="w-8 h-8 text-red-600" />
                            Nearby Blood Requests
                        </h1>
                        <p className="text-gray-600 mt-1">Help save lives by donating blood</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by hospital, location, or blood group..."
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Blood Group
                                </label>
                                <select
                                    value={filters.bloodGroup}
                                    onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="">All Blood Groups</option>
                                    {BLOOD_GROUPS.map(group => (
                                        <option key={group} value={group}>{group}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Urgency
                                </label>
                                <select
                                    value={filters.urgency}
                                    onChange={(e) => handleFilterChange('urgency', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="">All Urgency Levels</option>
                                    {Object.values(REQUEST_URGENCY).map(urgency => (
                                        <option key={urgency} value={urgency}>{urgency}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Distance
                                </label>
                                <select
                                    value={distanceKm}
                                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                                    disabled={!useLocation}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
                                >
                                    <option value="5">5 km</option>
                                    <option value="10">10 km</option>
                                    <option value="20">20 km</option>
                                    <option value="50">50 km</option>
                                    <option value="100">100 km</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full justify-center">
                                    <input
                                        type="checkbox"
                                        checked={useLocation}
                                        onChange={(e) => setUseLocation(e.target.checked)}
                                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                    />
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium text-gray-700">
                                        Location {userLocation && '✓'}
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Clear Filters
                            </button>
                            {locationError && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {locationError}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Available Requests</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredRequests.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Critical Requests</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {filteredRequests.filter(r => r.urgency === REQUEST_URGENCY.CRITICAL).length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Your Interests</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{interestedRequests.size}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-6 h-6 text-green-600 fill-current" />
                        </div>
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
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Requests Found</h3>
                    <p className="text-gray-600 mb-6">
                        {filters.bloodGroup || filters.urgency || filters.search
                            ? 'Try adjusting your filters'
                            : 'There are no blood requests in your area at the moment'}
                    </p>
                    {(filters.bloodGroup || filters.urgency || filters.search) && (
                        <button
                            onClick={clearFilters}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredRequests.map((request) => (
                        <RequestCard
                            key={request._id}
                            request={request}
                            onViewDetails={handleViewDetails}
                            onExpressInterest={handleExpressInterest}
                            isInterested={interestedRequests.has(request._id) || request.hasExpressedInterest}
                        />
                    ))}
                </div>
            )}

            {/* Load More */}
            {hasMore && filteredRequests.length > 0 && (
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={loading}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}

            {/* Request Detail Modal */}
            <RequestDetailModal
                request={selectedRequest}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onExpressInterest={handleExpressInterest}
                isInterested={interestedRequests.has(selectedRequest?._id) || selectedRequest?.hasExpressedInterest}
            />
        </div>
    );
};

export default NearbyRequestsPage;
