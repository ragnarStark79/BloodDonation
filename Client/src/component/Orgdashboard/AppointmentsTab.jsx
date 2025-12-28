import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import appointmentApi from "../../api/appointmentApi";
import orgApi from "../../api/orgApi";
import { toast } from "sonner";
import {
    Calendar,
    Clock,
    User,
    Droplet,
    CheckCircle,
    XCircle,
    TestTube,
    FileText,
    Play
} from "lucide-react";

const AppointmentsTab = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingDonation, setStartingDonation] = useState(null); // Track which appointment is being started
    const [selected, setSelected] = useState(null); // For completion modal

    // Completion Form State
    const [completeForm, setCompleteForm] = useState({
        donationSuccessful: true,
        unitsCollected: 1,
        bloodGroup: "", // Prefill from donor
        barcode: "",
        expiryDate: "",
        notes: ""
    });

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const res = await appointmentApi.getOrgAppointments({ status: 'UPCOMING' });
            setAppointments(res.appointments || res || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, []);

    const openCompleteModal = (appt) => {
        setSelected(appt);
        // Default expiry to 35 days from now
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 35);

        setCompleteForm({
            donationSuccessful: true,
            unitsCollected: 1,
            bloodGroup: appt.donorId?.bloodGroup || "",
            barcode: `UNIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, // Auto-gen placeholder
            expiryDate: defaultExpiry.toISOString().split('T')[0],
            notes: ""
        });
    };

    const handleStartDonation = async (appt) => {
        setStartingDonation(appt._id);
        try {
            const response = await orgApi.startDonation(appt._id);
            toast.success("Donation started! Donor added to pipeline.");
            fetchAppointments();
            // Navigate to donation pipeline
            setTimeout(() => {
                navigate("/org/donations");
            }, 1000);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to start donation");
        } finally {
            setStartingDonation(null);
        }
    };


    const handleComplete = async (e) => {
        e.preventDefault();
        if (!selected) return;

        try {
            await appointmentApi.completeAppointment(selected._id, completeForm);
            toast.success("Donation recorded successfully");
            setSelected(null);
            fetchAppointments();
        } catch (err) {
            console.error(err);
            toast.error("Failed to record donation");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-blue-100 text-blue-700'; // UPCOMING
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                                <div className="relative w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center">
                                    <Calendar className="text-white drop-shadow-lg" size={34} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-1">
                                    Appointments
                                </h2>
                                <p className="text-indigo-100 text-sm">Manage donor appointments and blood collection</p>
                            </div>
                        </div>

                        <button
                            onClick={fetchAppointments}
                            disabled={loading}
                            className="px-5 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition font-medium shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <Clock size={18} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
                        <p className="text-sm text-gray-500">Upcoming Appointments</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {appointments.filter(a => new Date(a.dateTime).toDateString() === new Date().toDateString()).length}
                        </p>
                        <p className="text-sm text-gray-500">Today's Appointments</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <User className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">
                            {new Set(appointments.map(a => a.donorId?._id)).size}
                        </p>
                        <p className="text-sm text-gray-500">Unique Donors</p>
                    </div>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-500 mt-3">Loading appointments...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="text-gray-400" size={48} />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Scheduled</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            When donors book appointments with your organization, they will appear here.
                            You can manage check-ins and start the donation process.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Upcoming
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Completed
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Cancelled
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-semibold">Date & Time</th>
                                    <th className="p-4 font-semibold">Donor</th>
                                    <th className="p-4 font-semibold">Blood Group</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments.map(appt => (
                                    <tr key={appt._id} className="hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">
                                                {new Date(appt.dateTime).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(appt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{appt.donorId?.Name || "Unknown"}</div>
                                            <div className="text-xs text-gray-500">{appt.donorId?.Email}</div>
                                        </td>
                                        <td className="p-4">
                                            {appt.donorId?.bloodGroup ? (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 font-bold text-xs">{appt.donorId.bloodGroup}</span>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {appt.status === 'UPCOMING' && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleStartDonation(appt)}
                                                        disabled={startingDonation === appt._id}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {startingDonation === appt._id ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                                                Starting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play size={14} /> Start Donation
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => openCompleteModal(appt)}
                                                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm transition font-medium"
                                                    >
                                                        <TestTube size={14} /> Quick Collect
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Completion Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <form onSubmit={handleComplete}>
                            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <TestTube className="text-red-600" size={20} />
                                    Record Donation
                                </h3>
                                <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">✕</button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                                    <User size={16} />
                                    <span>Donor: <strong>{selected.donorId?.Name}</strong> ({selected.donorId?.bloodGroup})</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                                            value={completeForm.bloodGroup}
                                            onChange={e => setCompleteForm({ ...completeForm, bloodGroup: e.target.value })}
                                            required
                                        >
                                            <option value="">Select</option>
                                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Units Collected</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={completeForm.unitsCollected}
                                            onChange={e => setCompleteForm({ ...completeForm, unitsCollected: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode / Bag ID</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={completeForm.barcode}
                                        onChange={e => setCompleteForm({ ...completeForm, barcode: e.target.value })}
                                        required
                                        placeholder="SCAN-12345"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={completeForm.expiryDate}
                                        onChange={e => setCompleteForm({ ...completeForm, expiryDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        rows="2"
                                        value={completeForm.notes}
                                        onChange={e => setCompleteForm({ ...completeForm, notes: e.target.value })}
                                        placeholder="Condition of donor, etc."
                                    />
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        id="success_check"
                                        checked={completeForm.donationSuccessful}
                                        onChange={e => setCompleteForm({ ...completeForm, donationSuccessful: e.target.checked })}
                                        className="w-4 h-4 text-red-600 rounded"
                                    />
                                    <label htmlFor="success_check" className="text-sm text-gray-700 font-medium">Donation Successful</label>
                                </div>
                            </div>

                            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-sm"
                                >
                                    Confirm Collection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsTab;
