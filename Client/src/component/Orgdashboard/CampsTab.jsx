import { useState, useEffect } from "react";
import client from "../../api/client";
import { toast } from "sonner";
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    Phone,
    User,
    Plus,
    X,
    Edit2,
    Trash2,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Info,
    Download
} from "lucide-react";
import { format } from "date-fns";

const CampsTab = () => {
    const [camps, setCamps] = useState([]);
    const [stats, setStats] = useState({
        totalCamps: 0,
        upcomingCamps: 0,
        completedCamps: 0,
        totalRegistrations: 0
    });
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        date: "",
        startTime: "09:00",
        endTime: "17:00",
        description: "",
        address: "",
        lat: "",
        lng: "",
        capacity: 50,
        contactPerson: "",
        contactPhone: "",
        requirements: "",
        bloodGroupsNeeded: [] // Changed to array
    });
    const [selectedCamp, setSelectedCamp] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [campAnalytics, setCampAnalytics] = useState(null);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const detectLocation = () => {
        setFetchingLocation(true);
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            setFetchingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude.toString(),
                    lng: position.coords.longitude.toString()
                }));
                setFetchingLocation(false);
                toast.success("Location detected successfully");
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Cloud not detect location. Please ensure location access is granted.");
                setFetchingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (showForm && !editingId) {
            detectLocation();
        }
    }, [showForm]);

    useEffect(() => {
        fetchCamps();
        fetchStats();
    }, []);

    const fetchCamps = async () => {
        setLoading(true);
        try {
            const res = await client.get("/api/org/camps");
            setCamps(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch camps");
        } finally {
            setLoading(false);
        }
    };

    const fetchCampDetails = async (id) => {
        try {
            const [detailsRes, analyticsRes] = await Promise.all([
                client.get(`/api/org/camps/${id}`),
                client.get(`/api/org/camps/${id}/analytics`)
            ]);
            setSelectedCamp(detailsRes.data);
            setCampAnalytics(analyticsRes.data);
            setShowDetails(true);
        } catch (err) {
            toast.error("Failed to load camp details");
        }
    };

    const toggleAttendance = async (donorId, currentStatus) => {
        try {
            await client.put(`/api/org/camps/${selectedCamp._id}/attendance/${donorId}`, {
                attended: !currentStatus
            });
            fetchCampDetails(selectedCamp._id);
            toast.success("Attendance updated");
        } catch (err) {
            toast.error("Failed to update attendance");
        }
    };

    const updateCampStatus = async (id, newStatus) => {
        try {
            await client.put(`/api/org/camps/${id}`, { status: newStatus });
            toast.success(`Camp status updated to ${newStatus}`);
            fetchCamps();
            if (selectedCamp?._id === id) fetchCampDetails(id);
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const fetchStats = async () => {
        try {
            const res = await client.get("/api/org/camps/stats/overview");
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadReport = async (id) => {
        try {
            const res = await client.get(`/api/org/camps/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `camp_report_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error("Failed to download report");
        }
    };

    const handleEdit = (camp) => {
        setEditingId(camp._id);
        setFormData({
            title: camp.title,
            date: camp.date.split('T')[0],
            startTime: camp.startTime || "09:00",
            endTime: camp.endTime || "17:00",
            description: camp.description || "",
            address: camp.location?.address || "",
            lat: camp.location?.coordinates?.coordinates[1] || "",
            lng: camp.location?.coordinates?.coordinates[0] || "",
            capacity: camp.capacity || 50,
            contactPerson: camp.contactPerson || "",
            contactPhone: camp.contactPhone || "",
            requirements: camp.requirements?.join(", ") || "",
            bloodGroupsNeeded: camp.bloodGroupsNeeded || []
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this camp?")) return;
        try {
            await client.delete(`/api/org/camps/${id}`);
            toast.success("Camp deleted successfully");
            fetchCamps();
            fetchStats();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete camp");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.lat || !formData.lng) {
                toast.error("Please provide valid Lat/Lng coordinates");
                return;
            }

            const payload = {
                ...formData,
                requirements: formData.requirements.split(",").map(r => r.trim()).filter(r => r),
                bloodGroupsNeeded: formData.bloodGroupsNeeded // Already an array now
            };

            if (editingId) {
                await client.put(`/api/org/camps/${editingId}`, payload);
                toast.success("Camp updated successfully");
            } else {
                await client.post("/api/org/camps", payload);
                toast.success("Donation camp organized successfully");
            }

            setShowForm(false);
            setEditingId(null);
            fetchCamps();
            fetchStats();
            setFormData({
                title: "", date: "", startTime: "09:00", endTime: "17:00",
                description: "", address: "", lat: "", lng: "", capacity: 50,
                contactPerson: "", contactPhone: "", requirements: "", bloodGroupsNeeded: []
            });
        } catch (err) {
            console.error(err);
            toast.error(editingId ? "Failed to update camp" : "Failed to create camp");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PLANNED": return "bg-blue-100 text-blue-700 border-blue-200";
            case "ONGOING": return "bg-green-100 text-green-700 border-green-200";
            case "COMPLETED": return "bg-gray-100 text-gray-700 border-gray-200";
            case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <div className="space-y-6">
            {/* Detail Modal Overlay */}
            {showDetails && selectedCamp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col scale-in-center">
                        <div className="p-6 bg-red-600 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold uppercase tracking-tight">{selectedCamp.title}</h2>
                                <p className="text-red-100 flex items-center gap-2 mt-1">
                                    <Calendar className="w-4 h-4" /> {format(new Date(selectedCamp.date), "PPP")}
                                    <span className="opacity-50">|</span>
                                    <Clock className="w-4 h-4" /> {selectedCamp.startTime} - {selectedCamp.endTime}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column: Info & Analytics */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
                                    <div className="bg-gray-50 p-4 rounded-2xl flex gap-3">
                                        <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                                        <span className="text-sm text-gray-700">{selectedCamp.location?.address}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Management</h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => updateCampStatus(selectedCamp._id, "ONGOING")}
                                            className="w-full py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Mark Ongoing
                                        </button>
                                        <button
                                            onClick={() => updateCampStatus(selectedCamp._id, "COMPLETED")}
                                            className="w-full py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Mark Completed
                                        </button>
                                    </div>
                                </div>

                                {campAnalytics && (
                                    <div className="pt-6 border-t border-gray-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <Info className="w-3 h-3" /> Camp Results
                                            </h4>
                                            <button
                                                onClick={() => handleDownloadReport(selectedCamp._id)}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                            >
                                                <Download className="w-3 h-3" /> Download CSV
                                            </button>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <p className="text-xs text-red-600 font-bold mb-1">Blood Collected</p>
                                                    <p className="text-3xl font-black text-red-700">{campAnalytics.totalUnitsCollected} <span className="text-sm font-normal">Units</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-red-600 font-bold mb-1">Attendance</p>
                                                    <p className="text-xl font-black text-red-700">{campAnalytics.totalAttended}/{campAnalytics.totalRegistered}</p>
                                                </div>
                                            </div>

                                            {Object.keys(campAnalytics.bloodGroupStats || {}).length > 0 ? (
                                                <div className="mt-4 grid grid-cols-4 gap-2">
                                                    {Object.entries(campAnalytics.bloodGroupStats).map(([group, units]) => (
                                                        <div key={group} className="bg-white/60 p-1.5 rounded-lg text-center border border-red-100 transition-all hover:bg-white hover:shadow-sm">
                                                            <p className="text-[10px] font-bold text-red-800">{group}</p>
                                                            <p className="text-xs font-black text-red-600">{units}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-red-400 italic text-center mt-2">No donations recorded yet</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Donor List */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl">
                                    <h4 className="text-lg font-bold text-gray-800">Registered Donors</h4>
                                    <span className="text-xs bg-white px-3 py-1 rounded-full font-bold text-gray-500 border border-gray-100">
                                        {selectedCamp.registeredDonors?.length || 0} Total
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {selectedCamp.registeredDonors?.length > 0 ? (
                                        selectedCamp.registeredDonors.map((donor) => {
                                            const isAttended = selectedCamp.attendedDonors?.some(id => (typeof id === 'string' ? id : id._id) === donor._id);
                                            return (
                                                <div key={donor._id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isAttended ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isAttended ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            {donor.Name?.substring(0, 1)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-800 text-sm">{donor.Name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">{donor.bloodGroup}</span>
                                                                <span className="text-xs text-gray-400">{donor.Email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleAttendance(donor._id, isAttended)}
                                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isAttended
                                                            ? "bg-green-600 text-white shadow-lg shadow-green-100"
                                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                            }`}
                                                    >
                                                        {isAttended ? "Attended" : "Mark Present"}
                                                    </button>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                            <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-gray-400 text-sm font-medium">No donors registered yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 rounded-2xl shadow-2xl">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                                <div className="relative w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center">
                                    <Calendar className="text-white drop-shadow-lg w-9 h-9" strokeWidth={2.5} />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-1">
                                    Donation Camps
                                </h2>
                                <p className="text-teal-100 text-sm">Organize and manage blood donation drives</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                fetchCamps();
                                fetchStats();
                            }}
                            disabled={loading}
                            className="px-5 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition font-medium shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <Clock size={18} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Calendar className="text-gray-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalCamps}</p>
                        <p className="text-sm text-gray-500">Total Camps</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Clock className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.upcomingCamps}</p>
                        <p className="text-sm text-blue-600 font-medium">Upcoming</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.completedCamps}</p>
                        <p className="text-sm text-green-600 font-medium">Completed</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <Users className="text-red-600" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalRegistrations}</p>
                        <p className="text-sm text-red-600 font-medium">Total Registrations</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-red-500" />
                            Donation Camps
                        </h2>
                        <p className="text-sm text-gray-500">Organize and manage your blood donation events</p>
                    </div>
                    <button
                        onClick={() => {
                            if (showForm) {
                                setEditingId(null);
                                setFormData({
                                    title: "", date: "", startTime: "09:00", endTime: "17:00",
                                    description: "", address: "", lat: "", lng: "", capacity: 50,
                                    contactPerson: "", contactPhone: "", requirements: "", bloodGroupsNeeded: ""
                                });
                            }
                            setShowForm(!showForm);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${showForm
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-100"
                            }`}
                    >
                        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {showForm ? "Cancel" : "Organize Camp"}
                    </button>
                </div>

                {showForm && (
                    <div className="p-6 bg-red-50/30 border-b border-gray-100 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                                {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {editingId ? "Edit Camp Details" : "New Camp Information"}
                            </h3>
                            {!editingId && (
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    disabled={fetchingLocation}
                                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-100 rounded-full shadow-sm transition-all hover:shadow-md"
                                >
                                    <MapPin className={`w-3 h-3 ${fetchingLocation ? 'animate-bounce' : ''}`} />
                                    {fetchingLocation ? 'Fetching Position...' : 'Refresh Location'}
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Camp Title</label>
                                    <input
                                        placeholder="e.g. Community Blood Drive 2024"
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label>
                                    <input
                                        type="time"
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Person</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            placeholder="Full Name"
                                            className="w-full p-2.5 pl-10 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                            value={formData.contactPerson}
                                            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Phone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            placeholder="Phone Number"
                                            className="w-full p-2.5 pl-10 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        placeholder="Full Venue Address"
                                        className="w-full p-2.5 pl-10 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="bg-white/50 p-4 rounded-xl border border-dashed border-red-200">
                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-3">Target Blood Groups</p>
                                <div className="flex flex-wrap gap-2">
                                    {bloodGroups.map(group => (
                                        <button
                                            key={group}
                                            type="button"
                                            onClick={() => {
                                                const current = [...formData.bloodGroupsNeeded];
                                                if (current.includes(group)) {
                                                    setFormData({ ...formData, bloodGroupsNeeded: current.filter(g => g !== group) });
                                                } else {
                                                    setFormData({ ...formData, bloodGroupsNeeded: [...current, group] });
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${formData.bloodGroupsNeeded.includes(group)
                                                ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-100"
                                                : "bg-white border-gray-200 text-gray-400 hover:border-red-200"
                                                }`}
                                        >
                                            {group}
                                        </button>
                                    ))}
                                </div>
                            </div>


                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Additional Requirements</label>
                                <input
                                    placeholder="e.g. ID Proof, 18+ (comma separated)"
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea
                                    placeholder="Tell donors about the camp..."
                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none h-24"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                                >
                                    {loading ? "Processing..." : editingId ? "Update Camp Details" : "Organize Now"}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setShowForm(false);
                                        }}
                                        className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Camp Info</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Donors</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex justify-center flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                            <p className="text-sm font-medium text-gray-500">Loading camps...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : camps.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">No donation camps organized yet</p>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="mt-4 text-red-600 font-bold text-sm hover:underline"
                                        >
                                            Organize your first camp
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                camps.map((camp) => (
                                    <tr key={camp._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{camp.title}</p>
                                                    <p className="text-xs text-gray-500">{format(new Date(camp.date), "PPP")}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 max-w-[200px]">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="truncate">{camp.location?.address}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(camp.status)}`}>
                                                {camp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                {camp.registeredDonors?.length || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => fetchCampDetails(camp._id)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Info className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(camp)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(camp._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CampsTab;
