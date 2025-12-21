import React, { useState, useEffect } from 'react';
import {
    X,
    Package,
    Calendar,
    Barcode,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import orgApi from '../../api/orgApi';
import requestApi from '../../api/requestApi';
import { toast } from 'sonner';
import { formatDistance } from '../../constants/requestConstants';

const ReserveUnitsModal = ({ request, isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [availableUnits, setAvailableUnits] = useState([]);
    const [selectedUnits, setSelectedUnits] = useState([]);
    const [reserving, setReserving] = useState(false);

    useEffect(() => {
        if (isOpen && request) {
            fetchAvailableUnits();
        }
    }, [isOpen, request]);

    const fetchAvailableUnits = async () => {
        try {
            setLoading(true);
            // Get inventory for the requested blood group
            const response = await orgApi.getInventory();

            console.log('📦 Inventory API Response:', response);
            console.log('📦 Response type:', typeof response);
            console.log('📦 Is Array?:', Array.isArray(response));
            console.log('📦 Response keys:', response ? Object.keys(response) : 'null/undefined');

            // Handle multiple possible response formats
            let units = [];

            if (Array.isArray(response)) {
                // Direct array response
                units = response;
            } else if (response && typeof response === 'object') {
                // Object response - try multiple properties
                units = response.units || response.data || response.items || [];
            }

            console.log('📦 Units after parsing:', units);
            console.log('📦 Units length:', units?.length);
            console.log('📦 Units is array?:', Array.isArray(units));

            if (!Array.isArray(units)) {
                console.error('❌ Units is not an array:', units);
                toast.error('Invalid inventory data format');
                setAvailableUnits([]);
                return;
            }

            // Filter for available units matching the blood group
            const matching = units.filter(unit =>
                unit?.bloodGroup === request?.bloodGroup &&
                unit?.status === 'AVAILABLE'
            );

            console.log('✅ Matching units:', matching.length);
            console.log('✅ Matching units details:', matching);

            setAvailableUnits(matching);
        } catch (error) {
            console.error('❌ Failed to fetch units:', error);
            console.error('❌ Error stack:', error.stack);
            toast.error('Failed to load available units');
            setAvailableUnits([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleUnit = (unitId) => {
        setSelectedUnits(prev => {
            if (prev.includes(unitId)) {
                return prev.filter(id => id !== unitId);
            } else {
                // Limit selection to units needed
                if (prev.length < request.unitsNeeded) {
                    return [...prev, unitId];
                } else {
                    toast.warning(`Only ${request.unitsNeeded} units needed`);
                    return prev;
                }
            }
        });
    };

    const handleReserve = async () => {
        if (selectedUnits.length === 0) {
            toast.error('Please select at least one unit');
            return;
        }

        if (selectedUnits.length > request.unitsNeeded) {
            toast.error(`Cannot reserve more than ${request.unitsNeeded} units`);
            return;
        }

        try {
            setReserving(true);
            // Pass requestId so backend can update request status
            await orgApi.batchReserveUnits(selectedUnits, request._id);
            toast.success(`${selectedUnits.length} units reserved for ${request.hospitalName || 'hospital'}!`);
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to reserve units:', error);
            toast.error(error.response?.data?.message || 'Failed to reserve units');
        } finally {
            setReserving(false);
        }
    };

    const handleClose = () => {
        setSelectedUnits([]);
        onClose();
    };

    const getDaysUntilExpiry = (expiryDate) => {
        const days = Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-bold">Reserve Blood Units</h3>
                        <p className="text-blue-100 mt-1">
                            Request from {request?.hospitalName} - {request?.bloodGroup} ({request?.unitsNeeded} units needed)
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Selection Summary */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Units Selected</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {selectedUnits.length} <span className="text-lg text-gray-500">/ {request?.unitsNeeded}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Available in Stock</p>
                                <p className="text-3xl font-bold text-green-600">{availableUnits.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Available Units List */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Units</h4>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                        ) : availableUnits.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 font-medium">No available units for {request?.bloodGroup}</p>
                                <p className="text-sm text-gray-500 mt-2">Please add inventory first</p>
                            </div>
                        ) : (
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {availableUnits.map((unit) => {
                                    const daysUntilExpiry = getDaysUntilExpiry(unit.expiryDate);
                                    const isExpiringSoon = daysUntilExpiry <= 7;
                                    const isSelected = selectedUnits.includes(unit._id);

                                    return (
                                        <div
                                            key={unit._id}
                                            onClick={() => toggleUnit(unit._id)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {/* Checkbox */}
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                                                    </div>

                                                    {/* Blood Group Badge */}
                                                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex flex-col items-center justify-center text-white shadow-md">
                                                        <span className="text-xl font-bold">{unit.bloodGroup}</span>
                                                        <span className="text-xs opacity-90">{unit.component || 'WB'}</span>
                                                    </div>

                                                    {/* Unit Details */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Barcode className="w-4 h-4 text-gray-400" />
                                                            <span className="font-mono text-sm text-gray-700">
                                                                {unit.barcode || unit._id.slice(-8)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                <span>Collected: {new Date(unit.collectionDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expiry Badge */}
                                                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isExpiringSoon
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {daysUntilExpiry} days left
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Warning if insufficient selection */}
                    {selectedUnits.length > 0 && selectedUnits.length < request?.unitsNeeded && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                You've selected {selectedUnits.length} unit(s), but {request?.unitsNeeded} are needed.
                                Select {request?.unitsNeeded - selectedUnits.length} more to fully fulfill this request.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReserve}
                        disabled={selectedUnits.length === 0 || reserving || availableUnits.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {reserving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Reserving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Reserve {selectedUnits.length} Unit{selectedUnits.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReserveUnitsModal;
