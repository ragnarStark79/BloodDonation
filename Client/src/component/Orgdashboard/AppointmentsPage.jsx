import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    CheckCircle,
    XCircle,
    Loader2,
    Search,
    Filter,
    RefreshCw,
    FileText
} from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import { toast } from 'sonner';

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState('UPCOMING');
    const [completeModal, setCompleteModal] = useState(null);
    const [completing, setCompleting] = useState(false);

    const fetchAppointments = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await appointmentApi.getOrgAppointments({ status: selectedTab });
            setAppointments(response.appointments || response || []);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [selectedTab]);

    const handleComplete = async () => {
        if (!completeModal) return;

        try {
            setCompleting(true);
            await appointmentApi.completeAppointment(completeModal._id, {
                donationSuccessful: true,
                unitsCollected: completeModal.requestId?.unitsNeeded || 1,
                notes: 'Donation completed successfully'
            });

            toast.success('Appointment marked as completed');
            setCompleteModal(null);
            fetchAppointments(true);
        } catch (error) {
            console.error('Failed to complete appointment:', error);
            toast.error('Failed to complete appointment');
        } finally {
            setCompleting(false);
        }
    };

    const handleCancel = async (appointment) => {
        const reason = window.prompt('Please provide a reason for cancellation:');
        if (!reason) return;

        try {
            await appointmentApi.cancelAppointmentOrg(appointment._id, reason);
            toast.success('Appointment cancelled');
            fetchAppointments(true);
        } catch (error) {
            console.error('Failed to cancel appointment:', error);
            toast.error('Failed to cancel appointment');
        }
    };

    const formatDate = (dateTime) => {
        const date = new Date(dateTime);
        return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getStatusBadge = (status) => {
        const colors = {
            UPCOMING: 'bg-blue-100 text-blue-700',
            COMPLETED: 'bg-green-100 text-green-700',
            CANCELLED: 'bg-red-100 text-red-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const tabs = [
        { value: 'UPCOMING', label: 'Upcoming', icon: Clock },
        { value: 'COMPLETED', label: 'Completed', icon: CheckCircle },
        { value: 'CANCELLED', label: 'Cancelled', icon: XCircle }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-red-600" />
                            Donor Appointments
                        </h1>
                        <p className="text-gray-600 mt-1">Manage scheduled donor appointments</p>
                    </div>
                    <button
                        onClick={() => fetchAppointments(true)}
                        disabled={refreshing}
                        className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white border border-gray-200 rounded-xl p-1 flex gap-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = selectedTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setSelectedTab(tab.value)}
                                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${isActive
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No {selectedTab.toLowerCase()} appointments</p>
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
                                        Donor Information
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Blood Group
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Request Details
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {appointments.map(appointment => {
                                    const { date, time } = formatDate(appointment.dateTime);
                                    const donor = appointment.donorId;

                                    return (
                                        <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{date}</div>
                                                        <div className="text-sm text-gray-500">{time}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                                        <User size={14} />
                                                        {donor?.Name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <Phone size={12} />
                                                        {donor?.phone || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                        <Mail size={12} />
                                                        {donor?.Email || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 font-bold">
                                                    {donor?.bloodGroup || '?'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    {appointment.requestId ? (
                                                        <>
                                                            <div className="text-gray-900 font-medium">
                                                                {appointment.requestId.unitsNeeded} unit(s) needed
                                                            </div>
                                                            <div className="text-gray-500">
                                                                Urgency: {appointment.requestId.urgency}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">No request linked</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(appointment.status)}`}>
                                                    {appointment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {appointment.status === 'UPCOMING' && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setCompleteModal(appointment)}
                                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <CheckCircle size={14} className="inline mr-1" />
                                                            Complete
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(appointment)}
                                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                                                        >
                                                            <XCircle size={14} className="inline mr-1" />
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Complete Modal */}
            {completeModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-600" />
                            Complete Appointment
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to mark this appointment as completed?
                            This will record the donation as successful.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCompleteModal(null)}
                                disabled={completing}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={completing}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {completing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Completing...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsPage;
