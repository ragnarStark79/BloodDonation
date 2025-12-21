import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Plus, Loader2, X } from 'lucide-react';
import LoadingSkeleton from '../common/LoadingSkeleton';
import appointmentApi from '../../api/appointmentApi';
import { toast } from 'sonner';
import BookAppointmentModal from './BookAppointmentModal';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancelModal, setCancelModal] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await appointmentApi.getMyAppointments('UPCOMING');
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load appointments:', err);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);


    const handleCancel = async () => {
        if (!cancelModal) return;

        try {
            setCancelling(true);
            await appointmentApi.cancelAppointment(cancelModal._id, cancelReason);
            toast.success('Appointment cancelled successfully');
            setCancelModal(null);
            setCancelReason('');
            await fetchAppointments(); // Refetch appointments
        } catch (err) {
            console.error('Failed to cancel appointment:', err);
            toast.error('Failed to cancel appointment');
        } finally {
            setCancelling(false);
        }
    };

    const formatDate = (dateTime) => {
        const date = new Date(dateTime);
        return {
            day: date.getDate(),
            month: date.toLocaleString('en', { month: 'short' }),
            time: date.toLocaleString('en', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <LoadingSkeleton width="w-40" />
                    <LoadingSkeleton width="w-24" />
                </div>
                <div className="space-y-3">
                    <LoadingSkeleton count={2} height="h-20" className="rounded-xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">My Appointments</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-red-600 mb-3">{error}</p>
                    <button
                        onClick={fetchAppointments}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800">My Appointments</h3>
                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                    >
                        <Plus size={14} />
                        Book New
                    </button>
                </div>

                {appointments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No upcoming appointments
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((apt) => {
                            const { day, month, time } = formatDate(apt.dateTime);
                            const orgName = apt.organizationId?.Name || 'Unknown Location';

                            return (
                                <div key={apt._id} className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-red-50 flex flex-col items-center justify-center text-red-600 border border-red-100">
                                            <span className="text-xs font-bold uppercase">{month}</span>
                                            <span className="text-lg font-bold leading-none">{day}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-sm">{orgName}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {time}</span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                                                    {apt.status || 'UPCOMING'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 self-end sm:self-center">
                                        <button
                                            onClick={() => setCancelModal(apt)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Cancel Appointment</h3>
                            <button
                                onClick={() => setCancelModal(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to cancel your appointment at{' '}
                            <span className="font-semibold">{cancelModal.organizationId?.Name || 'this location'}</span>?
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason (optional)
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows="3"
                                placeholder="Let us know why you're cancelling..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setCancelModal(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                disabled={cancelling}
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {cancelling ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel Appointment'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Book Appointment Modal */}
            <BookAppointmentModal
                isOpen={showBookingModal}
                onClose={() => setShowBookingModal(false)}
                request={null}
                onSuccess={() => {
                    setShowBookingModal(false);
                    fetchAppointments();
                }}
            />
        </>
    );
};

export default Appointments;
