import React, { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Loader2, MapPin, AlertCircle, Building2, Hospital } from 'lucide-react';
import client from '../../api/client';

const containerStyle = {
    width: '100%',
    height: '100%',
    minHeight: '400px',
    borderRadius: '0.75rem'
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
};

const OrganizationMapWidget = () => {
    const [coords, setCoords] = useState(() => {
        const saved = localStorage.getItem("liforceCoords");
        return saved ? JSON.parse(saved) : defaultCenter;
    });
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey || '',
    });

    // Fetch all organizations
    useEffect(() => {
        const loadOrganizations = async () => {
            try {
                setLoading(true);
                const res = await client.get("/api/admin/users", {
                    params: { limit: 1000, role: 'ORGANIZATION' }
                });

                const orgUsers = res.data.users || res.data || [];
                const validOrgs = orgUsers.filter(org =>
                    org.locationGeo?.coordinates &&
                    org.locationGeo.coordinates.length === 2 &&
                    (org.organizationType === 'HOSPITAL' || org.organizationType === 'BANK')
                );
                setOrganizations(validOrgs);
            } catch (err) {
                console.error("Failed to fetch organizations:", err);
                setOrganizations([]);
            } finally {
                setLoading(false);
            }
        };
        loadOrganizations();
    }, []);

    const handleMarkerClick = (org) => {
        setSelectedOrg(org);
    };

    const handleInfoWindowClose = () => {
        setSelectedOrg(null);
    };

    const hospitals = organizations.filter(org => org.organizationType === 'HOSPITAL');
    const bloodBanks = organizations.filter(org => org.organizationType === 'BANK');

    // Check if API key is configured
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Network Map</h3>
                <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[400px] flex items-center justify-center bg-gray-50">
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">Network Map</h3>
                <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[400px] flex items-center justify-center bg-gray-50">
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">Network Map</h3>
                <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[400px] flex items-center justify-center bg-gray-50">
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
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Network Map</h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                        <span className="text-gray-600">Hospitals ({hospitals.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-600">Blood Banks ({bloodBanks.length})</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 min-h-[400px] relative">
                {loading && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Loader2 className="animate-spin w-4 h-4 text-red-600" />
                        <span className="text-sm text-gray-700">Loading organizations...</span>
                    </div>
                )}

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={coords}
                    zoom={11}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {/* Current location marker */}
                    <Marker
                        position={coords}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: '#10b981',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                            scale: 10,
                        }}
                        title="Your Organization"
                    />

                    {/* Hospital markers (red) */}
                    {hospitals.map((hospital) => {
                        const [lng, lat] = hospital.locationGeo?.coordinates || [];
                        if (!lat || !lng) return null;

                        return (
                            <Marker
                                key={hospital._id}
                                position={{ lat, lng }}
                                onClick={() => handleMarkerClick(hospital)}
                                icon={{
                                    url: 'data:image/svg+xml;base64,' + btoa(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                                            <path fill="#dc2626" stroke="#ffffff" stroke-width="2" d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z"/>
                                            <path fill="#ffffff" d="M16 6c-3.3 0-6 2.7-6 6 0 3.3 2.7 6 6 6s6-2.7 6-6c0-3.3-2.7-6-6-6zm2 9h-1.5v1.5h-1V15H14v-1h1.5v-1.5h1V14H18v1z"/>
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(32, 40),
                                    anchor: new window.google.maps.Point(16, 40),
                                }}
                                title={hospital.organizationName || hospital.Name}
                            />
                        );
                    })}

                    {/* Blood Bank markers (blue) */}
                    {bloodBanks.map((bank) => {
                        const [lng, lat] = bank.locationGeo?.coordinates || [];
                        if (!lat || !lng) return null;

                        return (
                            <Marker
                                key={bank._id}
                                position={{ lat, lng }}
                                onClick={() => handleMarkerClick(bank)}
                                icon={{
                                    url: 'data:image/svg+xml;base64,' + btoa(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                                            <path fill="#2563eb" stroke="#ffffff" stroke-width="2" d="M16 0C9.4 0 4 5.4 4 12c0 8 12 28 12 28s12-20 12-28c0-6.6-5.4-12-12-12z"/>
                                            <circle cx="16" cy="12" r="6" fill="#ffffff"/>
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(32, 40),
                                    anchor: new window.google.maps.Point(16, 40),
                                }}
                                title={bank.organizationName || bank.Name}
                            />
                        );
                    })}

                    {/* Info Window for selected organization */}
                    {selectedOrg && (() => {
                        const [lng, lat] = selectedOrg.locationGeo?.coordinates || [];
                        if (!lat || !lng) return null;

                        const isHospital = selectedOrg.organizationType === 'HOSPITAL';

                        return (
                            <InfoWindow
                                position={{ lat, lng }}
                                onCloseClick={handleInfoWindowClose}
                            >
                                <div className="p-2 max-w-xs">
                                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        {isHospital ? (
                                            <Hospital className="w-4 h-4 text-red-600" />
                                        ) : (
                                            <Building2 className="w-4 h-4 text-blue-600" />
                                        )}
                                        {isHospital ? 'Hospital' : 'Blood Bank'}
                                    </h4>
                                    <div className="space-y-1 text-sm text-gray-700">
                                        <p className="font-medium text-base">
                                            {selectedOrg.organizationName || selectedOrg.Name}
                                        </p>
                                        {selectedOrg.City && (
                                            <p className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {selectedOrg.City}
                                            </p>
                                        )}
                                        {selectedOrg.PhoneNumber && (
                                            <p>📞 {selectedOrg.PhoneNumber}</p>
                                        )}
                                        {selectedOrg.verificationStatus && (
                                            <p>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedOrg.verificationStatus === 'VERIFIED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {selectedOrg.verificationStatus}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </InfoWindow>
                        );
                    })()}
                </GoogleMap>
            </div>

            <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Showing {hospitals.length} hospitals and {bloodBanks.length} blood banks in the network.
            </div>
        </div>
    );
};

export default OrganizationMapWidget;
