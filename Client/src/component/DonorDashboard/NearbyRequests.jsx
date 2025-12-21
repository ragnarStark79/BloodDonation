import React, { useEffect, useState } from 'react';
import { MapPin, Droplets, AlertTriangle, Navigation, Crosshair } from 'lucide-react';
import LoadingSkeleton from '../common/LoadingSkeleton';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toast } from "sonner";

const urgencyColor = {
  CRITICAL: "bg-red-100 text-red-600",
  HIGH: "bg-orange-100 text-orange-600",
  MEDIUM: "bg-yellow-100 text-yellow-600",
  LOW: "bg-green-100 text-green-600"
};

const NearbyRequests = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [eligibleInfo, setEligibleInfo] = useState({ eligible: true, nextEligibleDate: null });
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem("liforceCoords");
    return saved ? JSON.parse(saved) : { lat: 28.6, lng: 77.2 };
  });
  const [filters, setFilters] = useState({ km: 10, urgency: "ALL", group: "" });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [user, coords, filters]);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const params = {
        // Temporarily disable location filtering until requests have proper coordinates
        // lat: coords.lat,
        // lng: coords.lng,
        // km: filters.km || 10,
        urgency: filters.urgency !== "ALL" ? filters.urgency : undefined,
        group: filters.group || undefined,
      };
      const res = await client.get("/api/donor/requests/nearby", { params });
      console.log('🔍 API Response:', res.data);
      console.log('🔍 Requests from API:', res.data.requests);
      console.log('🔍 Requests length:', res.data.requests?.length);
      setRequests(res.data.requests || []);
      console.log('✅ Set requests to state');
      setEligibleInfo({ eligible: res.data.eligible, nextEligibleDate: res.data.nextEligibleDate });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load nearby requests");
    } finally {
      setLoading(false);
    }
  };

  const markInterest = async (id) => {
    try {
      await client.post(`/api/donor/requests/${id}/interest`);
      setRequests((prev) => prev.map((r) => r._id === id ? { ...r, hasExpressedInterest: true } : r));
      toast.success("Interest recorded");
    } catch (err) {
      console.error(err);
      toast.error("Could not mark interest");
    }
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoords(newCoords);
        localStorage.setItem("liforceCoords", JSON.stringify(newCoords));
        try {
          await client.post("/api/geo/location-update", { lat: latitude, lng: longitude });
          toast.success("Location updated");
        } catch (err) {
          console.error(err);
          toast.error("Failed to update location");
        }
      },
      (err) => {
        console.error(err);
        toast.error("Unable to fetch location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Nearby Requests</h3>
          <p className="text-sm text-gray-500">Filter by distance, urgency, and group</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="text-sm border rounded-lg px-3 py-2"
            value={filters.km}
            onChange={(e) => setFilters({ ...filters, km: Number(e.target.value) })}
          >
            {[5, 10, 20, 50].map(k => <option key={k} value={k}>{k} km</option>)}
          </select>
          <select
            className="text-sm border rounded-lg px-3 py-2"
            value={filters.urgency}
            onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
          >
            {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            className="text-sm border rounded-lg px-3 py-2"
            value={filters.group}
            onChange={(e) => setFilters({ ...filters, group: e.target.value })}
          >
            <option value="">Any Group</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            onClick={useMyLocation}
          >
            <Crosshair size={16} /> Use my location
          </button>
        </div>
      </div>

      {!eligibleInfo.eligible && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          You are not currently eligible to donate. Next eligible date:{" "}
          {eligibleInfo.nextEligibleDate ? new Date(eligibleInfo.nextEligibleDate).toLocaleDateString() : "N/A"}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex justify-between mb-2">
              <LoadingSkeleton width="w-1/3" />
              <LoadingSkeleton width="w-20" />
            </div>
            <LoadingSkeleton width="w-2/3" height="h-3" className="mb-4" />
            <div className="grid grid-cols-4 gap-2">
              <LoadingSkeleton count={4} width="w-full" height="h-8" />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex justify-between mb-2">
              <LoadingSkeleton width="w-1/3" />
              <LoadingSkeleton width="w-20" />
            </div>
            <LoadingSkeleton width="w-2/3" height="h-3" className="mb-4" />
            <div className="grid grid-cols-4 gap-2">
              <LoadingSkeleton count={4} width="w-full" height="h-8" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request._id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-red-200 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">{request.caseId || "Blood Request"}</h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${urgencyColor[request.urgency] || "bg-gray-100 text-gray-600"}`}>
                      {request.urgency || "MEDIUM"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{request.notes || "No additional notes"}</p>
                </div>
                <div className="flex gap-2">
                  {request.isAssignedToMe ? (
                    <button
                      className="px-3 py-1.5 text-sm font-semibold bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-1"
                      disabled
                    >
                      ✅ You're Assigned!
                    </button>
                  ) : (
                    <button
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${request.hasExpressedInterest
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      onClick={() => !request.hasExpressedInterest && markInterest(request._id)}
                      disabled={!eligibleInfo.eligible || request.hasExpressedInterest}
                    >
                      {request.hasExpressedInterest ? "Interested" : "I can donate"}
                    </button>
                  )}
                  <button
                    className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50"
                    onClick={() => setSelected(request)}
                  >
                    Details
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Droplets size={16} className="text-red-500" />
                  <div>
                    <p className="text-xs text-gray-500">Blood Group</p>
                    <p className="font-semibold">{request.bloodGroup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <AlertTriangle size={16} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-500">Units Needed</p>
                    <p className="font-semibold">{request.unitsNeeded || request.units || 0} units</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={16} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold">Nearby</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Navigation size={16} className="text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-semibold">{request.status}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {requests.length === 0 && (
            <div className="text-center text-gray-500 py-6 text-sm">
              No nearby requests found for your blood group.
            </div>
          )}
        </div>
      )}

      {/* Debug log */}
      {console.log('🎨 Rendering, requests.length:', requests.length, 'requests:', requests)}

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selected.caseId || "Blood Request Details"}</h3>
                <p className="text-sm text-gray-500">{selected.notes || "No additional notes"}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-800 text-sm">Close</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-500">Blood Group</p>
                <p className="font-semibold text-gray-800">{selected.bloodGroup}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-500">Units</p>
                <p className="font-semibold text-gray-800">{selected.unitsNeeded || selected.units || 0}</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-gray-500">Urgency</p>
                <p className={`font-semibold ${urgencyColor[selected.urgency] || "text-gray-700"}`}>{selected.urgency}</p>
              </div>
              <div className="p-3 border rounded-lg col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-gray-800">{selected.status}</p>
              </div>
              <div className="p-3 border rounded-lg md:col-span-3">
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-semibold text-gray-800">Near you (shared when you accept)</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                onClick={() => { markInterest(selected._id); setSelected(null); }}
                disabled={!eligibleInfo.eligible || selected.hasExpressedInterest}
              >
                {selected.hasExpressedInterest ? "Interested" : "I can donate"}
              </button>
              <button
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyRequests;
