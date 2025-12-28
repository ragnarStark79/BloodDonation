import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import adminApi from "../../api/adminApi";
import { SafePie } from "./SafeChart";
import { Plus, Minus, Droplet, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

const StockView = () => {
    const {
        stock,
        settings,
        totalUnits,
        fetchDashboardData,
    } = useDashboard();

    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [stockEdit, setStockEdit] = useState({
        group: Object.keys(stock || {})[0] || "O+",
        change: 0,
        reason: "Donation",
    });

    // Derived data for charts
    const lowStockTypes = useMemo(
        () =>
            Object.entries(stock || {})
                .filter(([, v]) => v.units <= settings.threshold)
                .map(([k]) => k),
        [stock, settings.threshold]
    );

    // Pie chart data for blood type availability
    const pieData = useMemo(() => {
        const labels = Object.keys(stock || {});
        const data = labels.map((k) => (stock || {})[k]?.units || 0);
        return {
            labels,
            datasets: [
                {
                    label: "Units Available",
                    data,
                    backgroundColor: [
                        "#ef4444", "#dc2626", "#f87171", "#fb7185",
                        "#6366f1", "#818cf8", "#10b981", "#34d399",
                    ],
                    borderColor: "#fff",
                    borderWidth: 2,
                },
            ],
        };
    }, [stock]);

    const pieOptions = {
        plugins: {
            legend: {
                position: "bottom",
                labels: { padding: 15, font: { size: 11 } }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} units (${percentage}%)`;
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    const submitStockChange = async () => {
        const { group, change, reason } = stockEdit;
        if (!group) return;
        try {
            await adminApi.updateStock(group, Number(change), reason);
            toast.success("Stock updated successfully");
            setShowAddStockModal(false);
            setStockEdit({
                group: Object.keys(stock || {})[0] || "O+",
                change: 0,
                reason: "Donation",
            });
            fetchDashboardData();
        } catch (err) {
            console.error("Failed to update stock:", err);
            toast.error("Failed to update stock");
        }
    };


    return (
        <div className="animate-fade-in">
            {/* Premium Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-2xl shadow-2xl mb-6">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-sm"></div>
                                <div className="relative w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                    <Droplet className="text-white w-7 h-7" strokeWidth={2.5} fill="currentColor" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                                    Stock Management
                                </h2>
                                <p className="text-rose-100 text-sm mt-1">
                                    Manage blood inventory • {totalUnits} total units
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAddStockModal(true)}
                            className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-red-600 bg-white rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <Plus className="w-4 h-4" /> Adjust Stock
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-6">Stock Levels</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gradient-to-r from-gray-50 to-red-50/30">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Blood Group</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Available</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Reserved</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Quick Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {Object.keys(stock || {}).map((g) => {
                                    const units = (stock || {})[g]?.units || 0;
                                    const reserved = (stock || {})[g]?.reserved || 0;
                                    const isLow = units <= settings.threshold;
                                    const isCritical = units < settings.threshold / 2;

                                    return (
                                        <tr key={g} className="hover:bg-gradient-to-r hover:from-red-50/20 hover:to-rose-50/20 transition-all duration-200 group">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all">
                                                        <Droplet className="w-5 h-5" fill="currentColor" />
                                                    </div>
                                                    <span className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">{g}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl font-bold text-gray-900">{units}</span>
                                                    <span className="text-xs text-gray-500">units</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                    {reserved} reserved
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {isCritical ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Critical
                                                    </span>
                                                ) : isLow ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
                                                        <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Good
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setStockEdit({ group: g, change: 5, reason: "Donation" });
                                                            setShowAddStockModal(true);
                                                        }}
                                                        className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all"
                                                        title="Add units"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setStockEdit({ group: g, change: -5, reason: "Usage" });
                                                            setShowAddStockModal(true);
                                                        }}
                                                        className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-600 text-white hover:from-red-600 hover:to-orange-700 shadow-sm hover:shadow-md transition-all"
                                                        title="Remove units"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                        Blood Type Distribution
                    </h4>
                    <div className="h-64">
                        <SafePie data={pieData} options={pieOptions} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Total Units</span>
                            <strong className="text-xl font-bold text-red-600">{totalUnits}</strong>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">Blood Groups</span>
                            <strong className="text-lg font-bold text-gray-900">{Object.keys(stock || {}).length}</strong>
                        </div>
                        {lowStockTypes.length > 0 && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                                <div className="flex items-start gap-2 mb-2">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                    <span className="text-sm font-bold text-amber-800">Low Stock Alert</span>
                                </div>
                                <div className="flex flex-wrap gap-2 ml-7">
                                    {lowStockTypes.map((type) => (
                                        <span key={type} className="inline-flex items-center px-3 py-1 rounded-lg bg-white text-amber-700 font-bold text-sm border border-amber-300 shadow-sm">
                                            {type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAddStockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-600 p-6">
                            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
                            <div className="relative flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                    <Droplet className="w-6 h-6 text-white" fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white drop-shadow-lg">Adjust Stock Level</h3>
                                    <p className="text-red-100 text-sm">Update blood inventory</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Blood Group</label>
                                <select
                                    value={stockEdit.group}
                                    onChange={(e) => setStockEdit({ ...stockEdit, group: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-semibold"
                                >
                                    {Object.keys(stock || {}).map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Change Amount</label>
                                <input
                                    type="number"
                                    value={stockEdit.change}
                                    onChange={(e) => setStockEdit({ ...stockEdit, change: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-semibold text-lg"
                                    placeholder="e.g., +5 or -3"
                                />
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <span className="font-semibold">Tip:</span> Use positive numbers to add, negative to remove
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Reason</label>
                                <select
                                    value={stockEdit.reason}
                                    onChange={(e) => setStockEdit({ ...stockEdit, reason: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-semibold"
                                >
                                    <option value="Donation">Donation</option>
                                    <option value="Usage">Usage (Hospital Request)</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Correction">Inventory Correction</option>
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-200">
                            <button
                                onClick={() => setShowAddStockModal(false)}
                                className="px-5 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitStockChange}
                                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                            >
                                Update Stock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockView;
