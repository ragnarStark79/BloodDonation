import React, { useState, useEffect } from "react";
import client from "../../api/client";
import { toast } from "sonner";
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    CheckCircle,
    ArrowRight,
    Search,
    Filter,
    Map as MapIcon,
    Phone,
    Info,
    ChevronRight,
    MoreVertical
} from "lucide-react";
import { format } from "date-fns";

const CampsPage = () => {
    const [camps, setCamps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("all"); // all, upcoming, registered
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        // Get user location for nearby search
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    fetchCamps(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    fetchCamps();
                }
            );
        } else {
            fetchCamps();
        }
    }, []);

    const fetchCamps = async (lat, lng) => {
        setLoading(true);
        try {
            let url = "/api/donor/camps";
            if (lat && lng) {
                url += `?lat=${lat}&lng=${lng}&radius=50`;
            }
            const res = await client.get(url);
            setCamps(res.data || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load camps");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (campId) => {
        try {
            const res = await client.post(`/api/donor/camps/${campId}/register`);
            const { appointment } = res.data;

            if (appointment) {
                toast.success(
                    `Successfully registered! Your appointment is scheduled for ${format(new Date(appointment.dateTime), "PPP 'at' p")}`,
                    { duration: 5000 }
                );
            } else {
                toast.success("Successfully registered for the camp!");
            }

            fetchCamps(userLocation?.lat, userLocation?.lng);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to register");
        }
    };

    const handleUnregister = async (campId) => {
        if (!window.confirm("Are you sure you want to cancel your registration?")) return;
        try {
            await client.delete(`/api/donor/camps/${campId}/unregister`);
            toast.success("Registration cancelled");
            fetchCamps(userLocation?.lat, userLocation?.lng);
        } catch (err) {
            toast.error("Failed to cancel registration");
        }
    };

    const filteredCamps = camps.filter(camp => {
        const matchesSearch = camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            camp.location?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            camp.organizationId?.organizationName?.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeFilter === "registered") return matchesSearch && camp.isRegistered;
        if (activeFilter === "upcoming") {
            const campDate = new Date(camp.date);
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            return matchesSearch && campDate >= startOfToday;
        }
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by camp title, location or organization..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {["all", "upcoming", "registered"].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeFilter === filter
                                ? "bg-red-600 text-white shadow-md shadow-red-100"
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                }`}
                        >
                            {filter === "all" ? "All Camps" : filter === "upcoming" ? "Upcoming" : "My Registrations"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
                            <div className="h-4 w-24 bg-gray-100 rounded"></div>
                            <div className="h-6 w-full bg-gray-100 rounded"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                                <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCamps.map((camp) => (
                        <div
                            key={camp._id}
                            className={`group bg-white rounded-3xl border border-gray-100 p-6 transition-all hover:shadow-2xl hover:shadow-red-500/10 relative overflow-hidden ${camp.isRegistered ? "border-green-100 bg-green-50/10" : ""
                                }`}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-wrap gap-2">
                                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-100 uppercase tracking-wider">
                                        {camp.organizationId?.organizationName || "Blood Bank"}
                                    </span>
                                    {camp.isRegistered && (
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Registered
                                        </span>
                                    )}
                                    {camp.isFull && !camp.isRegistered && (
                                        <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200">
                                            Full
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                                {camp.title}
                            </h3>

                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 italic">
                                {camp.description || "A community blood donation drive to save lives. Join us and make a difference."}
                            </p>

                            {/* Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-semibold">{format(new Date(camp.date), "MMMM do, yyyy")}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-semibold">{camp.startTime || "09:00 AM"} - {camp.endTime || "05:00 PM"}</span>
                                </div>
                                <div className="flex items-start gap-3 text-gray-600">
                                    <div className="p-2 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors mt-0.5">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm line-clamp-2 flex-1">{camp.location?.address}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-bold text-gray-500">
                                        {camp.registeredDonors?.length || 0}/{camp.capacity} Registered
                                    </span>
                                </div>

                                {camp.isRegistered ? (
                                    <button
                                        onClick={() => handleUnregister(camp._id)}
                                        className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        Cancel Registration
                                    </button>
                                ) : (
                                    <button
                                        disabled={camp.isFull}
                                        onClick={() => handleRegister(camp._id)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${camp.isFull
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200"
                                            }`}
                                    >
                                        Register
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredCamps.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                    <div className="p-6 bg-gray-50 rounded-full mb-4">
                        <Calendar className="w-12 h-12 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">No camps found</h3>
                    <p className="text-gray-500 max-w-sm text-center mt-2 px-6">
                        We couldn't find any donation camps matching your search or filters at the moment.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CampsPage;
