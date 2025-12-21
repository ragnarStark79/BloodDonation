import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import client from '../../api/client';

const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '320px',
    borderRadius: '0.75rem'
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

const GoogleMapWidget = () => {
    const [coords, setCoords] = useState(() => {
        const saved = localStorage.getItem("liforceCoords");
        return saved ? JSON.parse(saved) : defaultCenter;
    });
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Use the useLoadScript hook instead of LoadScript component
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey || '',
    });

    // Fetch nearby blood requests
    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoading(true);
                const res = await client.get("/api/donor/requests/nearby", {
                    params: { lat: coords.lat, lng: coords.lng, km: 10 },
                });
                console.log('🎨 Rendering, requests.length:', res.data.requests?.length || 0, 'requests:', res.data.requests || []);
                setRequests(res.data.requests || []);
            } catch (err) {
                console.error('Failed to load requests:', err);
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
    }, [coords]);

    const handleMarkerClick = (request) => {
        setSelectedRequest(request);
    };

    const handleInfoWindowClose = () => {
        setSelectedRequest(null);
    };

    // Check if API key is configured
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Nearby Map</h3>
                <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[320px] flex items-center justify-center bg-gray-50">
                    <div className="text-center p-6">
                        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">API Key Required</h4>
                        <p className="text-sm text-gray-600 max-w-md">
                            Please add your Google Maps API key to the <code className="px-2 py-1 bg-gray-100 rounded text-xs">.env</code> file to enable the map.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Nearby Map</h3>
                <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[320px] flex items-center justify-center bg-gray-50">
                    <div className="text-center p-6">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Map Load Error</h4>
                        <p className="text-sm text-gray-600 max-w-md">
                            Failed to load Google Maps. Please check your API key and internet connection.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Nearby Map</h3>
                <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[320px] flex items-center justify-center bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="animate-spin w-5 h-5" />
                        <span>Loading map...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Nearby Map</h3>

            <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[320px] relative">
                {loading && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4 text-red-600" />
                        <span className="text-sm text-gray-700">Loading requests...</span>
                    </div>
                )}

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={coords}
                    zoom={13}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {/* Circle showing 10km radius */}
                    <Circle
                        center={coords}
                        radius={10000}
                        options={{
                            fillColor: '#ef4444',
                            fillOpacity: 0.08,
                            strokeColor: '#ef4444',
                            strokeOpacity: 0.3,
                            strokeWeight: 2,
                        }}
                    />

                    {/* User's current location marker */}
                    <Marker
                        position={coords}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: '#3b82f6',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                            scale: 10,
                        }}
                        title="You are here"
                    />

                    {/* Blood request markers */}
                    {requests.map((request) => {
                        const [lng, lat] = request.location?.coordinates || [];
                        if (!lat || !lng) return null;

                        const position = { lat, lng };

                        return (
                            <Marker
                                key={request._id}
                                position={position}
                                onClick={() => handleMarkerClick(request)}
                                icon={{
                                    url: 'data:image/svg+xml;base64,' + btoa(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                        <path fill="#dc2626" stroke="#ffffff" stroke-width="2" d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z"/>
                        <circle cx="16" cy="12" r="6" fill="#ffffff"/>
                      </svg>
                    `),
                                    scaledSize: new window.google.maps.Size(32, 40),
                                    anchor: new window.google.maps.Point(16, 40),
                                }}
                                title={`${request.bloodGroup} Blood Request`}
                            />
                        );
                    })}

                    {/* Info Window for selected request */}
                    {selectedRequest && (() => {
                        const [lng, lat] = selectedRequest.location?.coordinates || [];
                        if (!lat || !lng) return null;

                        return (
                            <InfoWindow
                                position={{ lat, lng }}
                                onCloseClick={handleInfoWindowClose}
                            >
                                <div className="p-2 max-w-xs">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-red-600" />
                                        {selectedRequest.caseId || 'Blood Request'}
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-700">
                                        <p>
                                            <span className="font-medium">Blood Group:</span>{' '}
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-semibold">
                                                {selectedRequest.bloodGroup}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="font-medium">Units Needed:</span> {selectedRequest.unitsNeeded || selectedRequest.units || 0}
                                        </p>
                                        <p>
                                            <span className="font-medium">Urgency:</span>{' '}
                                            <span className={`capitalize ${selectedRequest.urgency === 'critical'
                                                ? 'text-red-600 font-semibold'
                                                : selectedRequest.urgency === 'urgent'
                                                    ? 'text-orange-600'
                                                    : 'text-gray-600'
                                                }`}>
                                                {selectedRequest.urgency}
                                            </span>
                                        </p>
                                        {selectedRequest.hospitalName && (
                                            <p>
                                                <span className="font-medium">Hospital:</span> {selectedRequest.hospitalName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </InfoWindow>
                        );
                    })()}
                </GoogleMap>
            </div>

            <div className="mt-3 text-xs text-gray-500">
                <MapPin className="w-3 h-3 inline mr-1" />
                Showing requests within 10 km. Update location in Nearby Requests to refresh.
            </div>
        </div>
    );
};

export default GoogleMapWidget;
