import React from 'react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const DonationTrendsChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-48 bg-gray-100 rounded"></div>
                </div>
            </div>
        );
    }

    // Use provided data or show empty state. Check both donations and requests
    const hasData = data && data.length > 0 && data.some(d => d.donations > 0 || d.requests > 0);
    const chartData = hasData ? data : [
        { month: 'Jan', donations: 0, requests: 0 },
        { month: 'Feb', donations: 0, requests: 0 },
        { month: 'Mar', donations: 0, requests: 0 },
        { month: 'Apr', donations: 0, requests: 0 },
        { month: 'May', donations: 0, requests: 0 },
        { month: 'Jun', donations: 0, requests: 0 },
        { month: 'Jul', donations: 0, requests: 0 },
        { month: 'Aug', donations: 0, requests: 0 },
        { month: 'Sep', donations: 0, requests: 0 },
        { month: 'Oct', donations: 0, requests: 0 },
        { month: 'Nov', donations: 0, requests: 0 },
        { month: 'Dec', donations: 0, requests: 0 }
    ];

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-gray-800">Monthly Trends</h3>
                    <p className="text-xs text-gray-500 mt-1">Donations vs Fulfilled Requests</p>
                </div>
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Donations</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                        <span>Fulfilled</span>
                    </div>
                </div>
            </div>

            {!hasData ? (
                <div className="flex items-center justify-center h-48 text-gray-400">
                    <div className="text-center">
                        <p className="text-sm">No trend data available</p>
                        <p className="text-xs mt-1">Start collecting donations to see trends</p>
                    </div>
                </div>
            ) : (
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="donations"
                                name="Donations"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorDonations)"
                            />
                            <Area
                                type="monotone"
                                dataKey="requests"
                                name="Fulfilled Requests"
                                stroke="#2dd4bf"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRequests)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default DonationTrendsChart;
