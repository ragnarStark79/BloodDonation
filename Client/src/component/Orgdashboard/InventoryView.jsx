import React, { useState, useEffect } from "react";
import orgApi from "../../api/orgApi";
import AddInventory from "./AddInventory";
import { toast } from "sonner";
import { Droplet, Calendar, Activity, Search, Filter, Download, Package, RefreshCw, CheckSquare, Square } from "lucide-react";
import LoadingSkeleton from "../common/LoadingSkeleton";

const InventoryView = () => {
    const [inventory, setInventory] = useState([]);
    const [filteredInventory, setFilteredInventory] = useState([]);
    const [showForm, setShowForm] = useState(true); // Default open
    const [loading, setLoading] = useState(false);
    const [selectedUnits, setSelectedUnits] = useState([]);

    // Filter states
    const [filters, setFilters] = useState({
        bloodGroup: '',
        component: '',
        status: '',
        searchBarcode: ''
    });

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await orgApi.getInventory();
            setInventory(res || []);
            setFilteredInventory(res || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, []);

    // Filter logic
    useEffect(() => {
        let filtered = [...inventory];

        if (filters.bloodGroup) {
            filtered = filtered.filter(item => item.bloodGroup === filters.bloodGroup);
        }
        if (filters.component) {
            filtered = filtered.filter(item => item.component === filters.component);
        }
        if (filters.status) {
            filtered = filtered.filter(item => item.status === filters.status);
        }
        if (filters.searchBarcode) {
            filtered = filtered.filter(item =>
                item.barcode?.toLowerCase().includes(filters.searchBarcode.toLowerCase())
            );
        }

        setFilteredInventory(filtered);
    }, [filters, inventory]);

    const handleSelectAll = () => {
        if (selectedUnits.length === filteredInventory.length) {
            setSelectedUnits([]);
        } else {
            setSelectedUnits(filteredInventory.map(item => item._id));
        }
    };

    const handleSelectUnit = (id) => {
        if (selectedUnits.includes(id)) {
            setSelectedUnits(selectedUnits.filter(unitId => unitId !== id));
        } else {
            setSelectedUnits([...selectedUnits, id]);
        }
    };

    const handleBatchReserve = async () => {
        try {
            const result = await orgApi.batchReserveUnits(selectedUnits);
            toast.success(result.message || `${result.count} unit(s) reserved`);
            setSelectedUnits([]);
            fetchInventory(); // Refresh
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to reserve units");
        }
    };

    const handleBatchIssue = async () => {
        try {
            const result = await orgApi.batchIssueUnits(selectedUnits);
            toast.success(result.message || `${result.count} unit(s) issued`);
            setSelectedUnits([]);
            fetchInventory(); // Refresh
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to issue units");
        }
    };

    const handleBatchExpire = async () => {
        try {
            const result = await orgApi.batchExpireUnits(selectedUnits);
            toast.success(result.message || `${result.count} unit(s) marked as expired`);
            setSelectedUnits([]);
            fetchInventory(); // Refresh
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to mark units as expired");
        }
    };

    const getExpiryStatus = (expiryDate) => {
        const now = new Date();
        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) return { color: 'bg-gray-100 text-gray-700', text: 'Expired', icon: '⚫' };
        if (daysUntilExpiry <= 3) return { color: 'bg-red-100 text-red-700', text: `${daysUntilExpiry}d left`, icon: '🔴' };
        if (daysUntilExpiry <= 7) return { color: 'bg-yellow-100 text-yellow-700', text: `${daysUntilExpiry}d left`, icon: '🟡' };
        return { color: 'bg-green-100 text-green-700', text: `${daysUntilExpiry}d left`, icon: '🟢' };
    };

    const getBloodGroupColor = (group) => {
        const colors = {
            'A+': 'bg-red-100 text-red-700 border-red-200',
            'A-': 'bg-red-50 text-red-600 border-red-100',
            'B+': 'bg-blue-100 text-blue-700 border-blue-200',
            'B-': 'bg-blue-50 text-blue-600 border-blue-100',
            'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
            'AB-': 'bg-purple-50 text-purple-600 border-purple-100',
            'O+': 'bg-orange-100 text-orange-700 border-orange-200',
            'O-': 'bg-orange-50 text-orange-600 border-orange-100'
        };
        return colors[group] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    const stockSummary = inventory.reduce((acc, item) => {
        if (item.status === 'AVAILABLE') {
            acc[item.bloodGroup] = (acc[item.bloodGroup] || 0) + 1;
        }
        return acc;
    }, {});

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header - Modern Purple/Indigo Theme */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-2xl shadow-2xl">
                {/* Decorative background elements */}
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Icon with glassmorphism */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                                <div className="relative w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center">
                                    <Droplet className="text-white drop-shadow-lg" size={34} strokeWidth={2.5} />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-1">
                                    Blood Inventory
                                </h2>
                                <p className="text-purple-100 text-sm">Professional blood bank management system</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => fetchInventory()}
                                className="px-5 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl hover:bg-white/30 transition font-medium shadow-lg flex items-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="px-6 py-2.5 bg-white text-indigo-600 rounded-xl hover:bg-white/90 transition font-bold shadow-xl"
                            >
                                {showForm ? '− Hide Form' : '+ Add Unit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Summary Cards - Original Color-Coded Design */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                    <div key={group} className={`rounded-xl p-4 border-2 ${getBloodGroupColor(group)} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-lg`}>
                        <div className="text-center">
                            <div className="text-lg font-bold mb-1">{group}</div>
                            <div className="text-2xl font-bold">{stockSummary[group] || 0}</div>
                            <div className="text-xs opacity-75 mt-1">units</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Inventory Form */}
            {showForm && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Add New Blood Unit
                        </h3>
                        <button
                            onClick={() => setShowForm(false)}
                            className="text-gray-400 hover:text-gray-600 transition"
                            title="Close form"
                        >
                            <span className="text-2xl">×</span>
                        </button>
                    </div>
                    <AddInventory onAdded={(itemOrItems) => {
                        // Handle both single item and array of items
                        const newItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
                        setInventory([...inventory, ...newItems]);
                        const count = newItems.length;
                        toast.success(`${count} unit${count > 1 ? 's' : ''} added to inventory`);
                        fetchInventory(); // Refresh to ensure sync
                    }} />
                </div>
            )}

            {/* Filters and Actions */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Blood Group</label>
                        <select
                            value={filters.bloodGroup}
                            onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="">All Groups</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Component</label>
                        <select
                            value={filters.component}
                            onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="">All Components</option>
                            <option value="WB">Whole Blood</option>
                            <option value="RBC">Red Blood Cells</option>
                            <option value="Platelets">Platelets</option>
                            <option value="Plasma">Plasma</option>
                            <option value="Cryo">Cryoprecipitate</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="AVAILABLE">Available</option>
                            <option value="RESERVED">Reserved</option>
                            <option value="ISSUED">Issued</option>
                            <option value="EXPIRED">Expired</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Search Barcode</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={filters.searchBarcode}
                                onChange={(e) => setFilters({ ...filters, searchBarcode: e.target.value })}
                                placeholder="Search by barcode..."
                                className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                {selectedUnits.length > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-700">
                            {selectedUnits.length} unit(s) selected
                        </span>
                        <button
                            onClick={handleBatchReserve}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                            Reserve Selected
                        </button>
                        <button
                            onClick={handleBatchIssue}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                        >
                            Issue Selected
                        </button>
                        <button
                            onClick={handleBatchExpire}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                        >
                            Mark Expired
                        </button>
                        <button
                            onClick={() => setSelectedUnits([])}
                            className="ml-auto text-sm text-gray-600 hover:text-gray-800"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}

                {/* Inventory Table */}
                {loading ? (
                    <div className="space-y-4 mt-6">
                        <LoadingSkeleton count={5} height="h-16" />
                    </div>
                ) : filteredInventory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mt-6">
                        <Package className="mx-auto mb-3 text-gray-300" size={48} />
                        <p className="font-medium">No inventory items found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {inventory.length === 0 ? "Add units to get started" : "Try adjusting your filters"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-6">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-left">
                                        <button onClick={handleSelectAll} className="hover:text-red-600">
                                            {selectedUnits.length === filteredInventory.length ? (
                                                <CheckSquare size={20} className="text-red-600" />
                                            ) : (
                                                <Square size={20} className="text-gray-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Blood Group</th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Component</th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Barcode</th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Collection</th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Expiry Status</th>
                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredInventory.map(item => {
                                    const expiryStatus = getExpiryStatus(item.expiryDate);
                                    return (
                                        <tr key={item._id} className="hover:bg-gray-50 transition group">
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleSelectUnit(item._id)}
                                                    className="hover:text-red-600"
                                                >
                                                    {selectedUnits.includes(item._id) ? (
                                                        <CheckSquare size={20} className="text-red-600" />
                                                    ) : (
                                                        <Square size={20} className="text-gray-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-sm border-2 ${getBloodGroupColor(item.bloodGroup)}`}>
                                                    {item.bloodGroup}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-gray-800">{item.component}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                    {item.barcode || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Calendar size={14} />
                                                    {new Date(item.collectionDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span>{expiryStatus.icon}</span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${expiryStatus.color}`}>
                                                        {expiryStatus.text}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'RESERVED' ? 'bg-blue-100 text-blue-700' :
                                                        item.status === 'ISSUED' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryView;
