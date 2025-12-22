import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const BloodGroupChart = ({ data, loading }) => {
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

    // Use provided data or show empty state
    const hasData = data && data.length > 0;
    const chartData = hasData ? data : [];

    const totalUnits = chartData.reduce((sum, item) => sum + item.value, 0);

    // Find low stock blood types (less than 10 units)
    const lowStock = chartData
        .filter(item => item.value < 10)
        .map(item => item.name)
        .join(', ');

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-gray-800">Blood Type Availability</h3>
                    <p className="text-xs text-gray-500 mt-1">Units by group</p>
                </div>
            </div>

            {!hasData ? (
                <div className="flex items-center justify-center h-56 text-gray-400">
                    <div className="text-center">
                        <p className="text-sm">No inventory data available</p>
                        <p className="text-xs mt-1">Add blood units to your inventory to see distribution</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend
                                    verticalAlign="middle"
                                    align="right"
                                    layout="vertical"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Low Stock Warning */}
                    {lowStock && (
                        <div className="mt-3 text-xs text-gray-500">
                            <strong>Low stock:</strong> {lowStock}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BloodGroupChart;
