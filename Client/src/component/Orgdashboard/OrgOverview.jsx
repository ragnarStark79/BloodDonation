import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import orgApi from '../../api/orgApi';
import { useAuth } from '../../context/AuthContext';
import { Package, AlertTriangle, Calendar, FileText, Inbox, TrendingUp, Clock } from 'lucide-react';
import { getOrgPermissions, getOrgTypeLabel, getOrgTypeBadgeColor } from './orgUtils';
import DonationStatsCards from './DonationStatsCards';
import DonationTrendsChart from './DonationTrendsChart';
import BloodGroupChart from './BloodGroupChart';

const StatCard = ({ icon: Icon, label, value, color = "red", onClick }) => {
    const colorStyles = {
        blue: {
            gradient: "from-blue-500 to-blue-600",
            bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
            iconBg: "bg-white",
            iconColor: "text-blue-600",
            ring: "ring-blue-100"
        },
        orange: {
            gradient: "from-orange-500 to-orange-600",
            bg: "bg-gradient-to-br from-orange-50 to-orange-100/50",
            iconBg: "bg-white",
            iconColor: "text-orange-600",
            ring: "ring-orange-100"
        },
        green: {
            gradient: "from-green-500 to-green-600",
            bg: "bg-gradient-to-br from-green-50 to-green-100/50",
            iconBg: "bg-white",
            iconColor: "text-green-600",
            ring: "ring-green-100"
        },
        purple: {
            gradient: "from-purple-500 to-purple-600",
            bg: "bg-gradient-to-br from-purple-50 to-purple-100/50",
            iconBg: "bg-white",
            iconColor: "text-purple-600",
            ring: "ring-purple-100"
        },
        red: {
            gradient: "from-red-500 to-red-600",
            bg: "bg-gradient-to-br from-red-50 to-red-100/50",
            iconBg: "bg-white",
            iconColor: "text-red-600",
            ring: "ring-red-100"
        }
    };

    const style = colorStyles[color] || colorStyles.red;

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Gradient Background */}
            <div className={`absolute inset-0 ${style.bg} opacity-60`}></div>

            {/* Content */}
            <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 ${style.iconBg} rounded-xl shadow-md flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 ring-4 ${style.ring}`}>
                        <Icon className={`${style.iconColor}`} size={28} strokeWidth={2.5} />
                    </div>
                    {onClick && (
                        <TrendingUp className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
                    <p className="text-4xl font-bold text-gray-900">{value ?? 0}</p>
                </div>
            </div>
        </div>
    );
};

const RequestCard = ({ request, onClick }) => {
    const urgencyColors = {
        CRITICAL: 'bg-red-100 text-red-700',
        HIGH: 'bg-orange-100 text-orange-700',
        MEDIUM: 'bg-yellow-100 text-yellow-700',
        LOW: 'bg-green-100 text-green-700'
    };

    return (
        <div className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
            <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-gray-800">{request.bloodGroup}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${urgencyColors[request.urgency] || urgencyColors.MEDIUM}`}>
                    {request.urgency}
                </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Units:</strong> {request.unitsNeeded || request.units || 0}</p>
                <p><strong>Status:</strong> {request.status}</p>
                {request.caseId && <p className="text-xs text-gray-500">Case: {request.caseId}</p>}
                {request.createdBy?.organizationName && (
                    <p className="text-xs text-gray-500">From: {request.createdBy.organizationName}</p>
                )}
            </div>
        </div>
    );
};

const OrgOverview = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [donationStats, setDonationStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [monthlyTrends, setMonthlyTrends] = useState(null);
    const [bloodDistribution, setBloodDistribution] = useState(null);
    const [chartsLoading, setChartsLoading] = useState(true);
    const [error, setError] = useState(null);

    const orgType = user?.organizationType;
    const permissions = getOrgPermissions(orgType);

    useEffect(() => {
        fetchDashboard();
        fetchDonationStats();
        fetchChartData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchDashboard();
            fetchDonationStats();
        }, 30000); // 30 seconds

        // Refresh when user returns to tab
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchDashboard();
                fetchDonationStats();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await orgApi.getDashboard();
            setDashboardData(data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDonationStats = async () => {
        try {
            setStatsLoading(true);
            const stats = await orgApi.getDonationStats();
            setDonationStats(stats);
        } catch (err) {
            console.error('Failed to fetch donation stats:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchChartData = async () => {
        try {
            setChartsLoading(true);
            const [trends, distribution] = await Promise.all([
                orgApi.getMonthlyDonationTrends(),
                orgApi.getBloodGroupDistribution()
            ]);
            setMonthlyTrends(trends);
            setBloodDistribution(distribution);
        } catch (err) {
            console.error('Failed to fetch chart data:', err);
        } finally {
            setChartsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    const { organization, stats, myRequests, incomingRequests, todayAppointments, inventoryAlerts } = dashboardData || {};

    return (
        <div className="space-y-6">
            {/* Header with Gradient Background */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-pink-500 rounded-2xl shadow-lg">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>

                <div className="relative p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                                    <Package className="text-red-600" size={28} strokeWidth={2.5} />
                                </div>
                                <h1 className="text-3xl font-bold text-white">
                                    {organization?.organizationName || organization?.Name || 'Organization Dashboard'}
                                </h1>
                            </div>
                            <p className="text-red-50 text-sm ml-15 flex items-center gap-2">
                                {organization?.City && (
                                    <>
                                        <span className="inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-red-200 rounded-full animate-pulse"></span>
                                            {organization.City}
                                        </span>
                                        <span className="text-red-200">•</span>
                                    </>
                                )}
                                <span>Manage Blood Supply & Distribution</span>
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className={`px-6 py-3 rounded-xl text-sm font-semibold shadow-lg backdrop-blur-sm border border-white/20 ${orgType === 'BOTH'
                                ? 'bg-white/95 text-purple-700'
                                : orgType === 'BANK'
                                    ? 'bg-white/95 text-red-700'
                                    : 'bg-white/95 text-blue-700'
                                }`}>
                                {getOrgTypeLabel(orgType)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Moved above charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {permissions.canManageInventory && (
                    <>
                        <StatCard
                            icon={Package}
                            label="Available Units"
                            value={stats?.availableUnits}
                            color="blue"
                            onClick={() => navigate('/org/inventory')}
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Expiring Soon"
                            value={stats?.expiringSoon}
                            color="orange"
                        />
                    </>
                )}

                <StatCard
                    icon={Calendar}
                    label="Appointments Today"
                    value={todayAppointments?.length || 0}
                    color="green"
                    onClick={() => navigate('/org/appointments')}
                />

                {permissions.canCreateRequests && (
                    <StatCard
                        icon={FileText}
                        label="Open Requests"
                        value={myRequests?.length || 0}
                        color="purple"
                        onClick={() => navigate('/org/requests')}
                    />
                )}

                {permissions.canViewIncoming && (
                    <StatCard
                        icon={Inbox}
                        label="Incoming Requests"
                        value={incomingRequests?.length || 0}
                        color="red"
                        onClick={() => navigate('/org/incoming')}
                    />
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <DonationTrendsChart data={monthlyTrends} loading={chartsLoading} />
                </div>
                <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <BloodGroupChart data={bloodDistribution} loading={chartsLoading} />
                </div>
            </div>

            {/* Donation Pipeline (Blood Banks only) - Moved below graphs */}
            {permissions.canManageDonations && (
                <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-50 to-transparent rounded-full -translate-y-32 translate-x-32"></div>

                    <div className="relative p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                                    <Package className="text-white" size={22} strokeWidth={2.5} />
                                </div>
                                Donation Pipeline
                            </h2>
                            <button
                                onClick={() => navigate('/org/donations')}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all text-sm"
                            >
                                View Full Pipeline →
                            </button>
                        </div>

                        {/* Compact 5-stage preview */}
                        <div className="grid grid-cols-5 gap-4">
                            {[
                                { title: 'New Donors', color: 'from-red-50 to-red-100/50', ring: 'ring-red-100', text: 'text-red-600', count: donationStats?.byStage?.['new-donors'] || 0 },
                                { title: 'Screening', color: 'from-blue-50 to-blue-100/50', ring: 'ring-blue-100', text: 'text-blue-600', count: donationStats?.byStage?.['screening'] || 0 },
                                { title: 'In Progress', color: 'from-yellow-50 to-yellow-100/50', ring: 'ring-yellow-100', text: 'text-yellow-600', count: donationStats?.byStage?.['in-progress'] || 0 },
                                { title: 'Completed', color: 'from-green-50 to-green-100/50', ring: 'ring-green-100', text: 'text-green-600', count: donationStats?.byStage?.['completed'] || 0 },
                                { title: 'Ready for Storage', color: 'from-purple-50 to-purple-100/50', ring: 'ring-purple-100', text: 'text-purple-600', count: donationStats?.byStage?.['ready-storage'] || 0 }
                            ].map((stage, index) => (
                                <div
                                    key={index}
                                    className={`rounded-xl p-5 bg-gradient-to-br ${stage.color} border border-gray-100 hover:shadow-md transition-shadow ring-2 ${stage.ring}`}
                                >
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                        {stage.title}
                                    </div>
                                    <div className={`text-3xl font-bold ${stage.text} mb-1`}>{stage.count}</div>
                                    <div className="text-xs text-gray-500">donations</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg py-3 px-4 inline-block">
                                <span className="font-medium text-gray-700">💡 Tip:</span> Full drag-and-drop pipeline available on the Donation Pipeline page
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Donation Stats Cards - for Blood Banks */}
            {permissions.canManageInventory && (
                <DonationStatsCards stats={donationStats} loading={statsLoading} />
            )}

            {/* Three-column layout for requests, appointments, and inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1: My Requests (Hospitals) OR Incoming Requests (Blood Banks) */}
                {permissions.canCreateRequests && (
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FileText className="text-purple-600" size={20} />
                                My Blood Requests
                            </h2>
                            <button
                                onClick={() => navigate('/org/requests')}
                                className="text-sm font-medium text-purple-600 hover:text-purple-700"
                            >
                                View All →
                            </button>
                        </div>

                        {myRequests && myRequests.length > 0 ? (
                            <div className="space-y-3">
                                {myRequests.slice(0, 3).map((req) => (
                                    <RequestCard key={req._id} request={req} onClick={() => navigate('/org/requests')} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <FileText className="mx-auto mb-2 text-gray-300" size={48} />
                                <p>No active requests</p>
                                <button
                                    onClick={() => navigate('/org/requests')}
                                    className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
                                >
                                    Create New Request
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {permissions.canViewIncoming && (
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Inbox className="text-red-600" size={20} />
                                Incoming Requests
                            </h2>
                            <button
                                onClick={() => navigate('/org/incoming')}
                                className="text-sm font-medium text-red-600 hover:text-red-700"
                            >
                                View All →
                            </button>
                        </div>

                        {incomingRequests && incomingRequests.length > 0 ? (
                            <div className="space-y-3">
                                {incomingRequests.slice(0, 3).map((req) => (
                                    <RequestCard key={req._id} request={req} onClick={() => navigate('/org/incoming')} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <Inbox className="mx-auto mb-2 text-gray-300" size={48} />
                                <p>No matching requests</p>
                                <p className="text-sm text-gray-400 mt-1">Requests will appear when hospitals need blood groups you have in stock</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Column 2: Today's Appointments */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                        <Calendar className="text-green-600" size={20} />
                        Today's Appointments
                    </h2>

                    {todayAppointments && todayAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {todayAppointments.map((appt) => (
                                <div key={appt._id} className="flex items-center justify-between border-l-4 border-green-500 pl-4 py-2">
                                    <div>
                                        <p className="font-medium text-gray-800">{appt.donorId?.Name || 'Unknown Donor'}</p>
                                        <p className="text-sm text-gray-500">
                                            <Clock size={14} className="inline mr-1" />
                                            {new Date(appt.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        {appt.donorId?.bloodGroup || 'N/A'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-6">
                            <Calendar className="mx-auto mb-2 text-gray-300" size={40} />
                            <p className="text-sm">No appointments scheduled for today</p>
                        </div>
                    )}
                </div>

                {/* Column 3: Inventory Alerts (Blood Banks only) */}
                {permissions.canManageInventory && (
                    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
                            <AlertTriangle className="text-orange-600" size={20} />
                            Inventory Alerts
                        </h2>

                        {inventoryAlerts && inventoryAlerts.length > 0 ? (
                            <div className="space-y-3">
                                {inventoryAlerts.map((item) => (
                                    <div key={item._id} className="flex items-center justify-between border-l-4 border-orange-500 pl-4 py-2">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.bloodGroup} - {item.component}</p>
                                            <p className="text-sm text-orange-600">
                                                Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {item.barcode && (
                                            <span className="text-xs text-gray-500">{item.barcode}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-6">
                                <TrendingUp className="mx-auto mb-2 text-gray-300" size={40} />
                                <p className="text-sm">No inventory expiring soon</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrgOverview;
