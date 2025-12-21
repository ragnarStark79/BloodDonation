import React, { useState, useEffect } from 'react';
import {
    Calendar,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    RefreshCw,
    Download,
    Filter
} from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import { toast } from 'sonner';

const AppointmentsMonitor = () => {
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState({ status: 'ALL' });

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            // Fetch appointments and stats in parallel
            const [appointmentsRes, statsRes] = await Promise.all([
                appointmentApi.getAllAppointments({
                    status: filter.status === 'ALL' ? undefined : filter.status,
                    limit: 50
                }),
                appointmentApi.getAppointmentStats()
            ]);

            setAppointments(appointmentsRes.appointments || appointmentsRes || []);
            setStats(statsRes);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load appointment data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter.status]);

    const formatDate = (dateTime) => {
        const date = new Date(dateTime);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusBadge = (status) => {
        const colors = {
            UPCOMING: 'bg-blue-100 text-blue-700',
            COMPLETED: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-red-600" />
                            Appointments Monitor
                        </h1>
                        <p className="text-gray-600 mt-1">System-wide appointment tracking and analytics</p>
                    </div>
                    <button
                        onClick={() => fetchData(true)}
                        disabled={refreshing}
                        className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Appointments"
                        value={stats.total || 0}
                        icon={Calendar}
                        color="bg-blue-600"
                    />
                    <StatCard
                        title="Upcoming"
                        value={stats.upcoming || 0}
                        icon={Clock}
                        color="bg-orange-600"
                    />
                    <StatCard
                        title="Completed"
                        value={stats.completed || 0}
                        icon={CheckCircle}
                        color="bg-green-600"
                        subtitle={`${stats.completionRate || 0}% completion rate`}
                    />
                    <StatCard
                        title="Successful Donations"
                        value={stats.successfulDonations || 0}
                        icon={TrendingUp}
                        color="bg-red-600"
                        subtitle={`${stats.totalUnitsCollected || 0} units collected`}
                    />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-4">
                <Filter size={20} className="text-gray-400" />
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                    <option value="ALL">All Status</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No appointments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Donor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Organization
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Blood Group
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Units
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.map(appointment => (
                                    <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-900">
                                                    {formatDate(appointment.dateTime)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appointment.donorId?.Name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {appointment.donorId?.Email || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {appointment.organizationId?.organizationName || appointment.organizationId?.Name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {appointment.organizationId?.city || ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 font-bold text-xs">
                                                {appointment.donorId?.bloodGroup || '?'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {appointment.unitsCollected || 0} {appointment.status === 'COMPLETED' ? 'collected' : 'planned'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentsMonitor;
