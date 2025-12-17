import React from "react";

// Temporary placeholder components until react-chartjs-2 is compatible with React 19
export const SafeLine = ({ data, options }) => {
  if (!data || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  const values = data.datasets[0].data || [];
  const labels = data.labels || [];
  const maxValue = Math.max(...values, 1);

  return (
    <div className="h-full flex flex-col justify-end">
      <div className="flex items-end justify-between h-full gap-1">
        {values.map((value, index) => {
          const height = (value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-red-500 rounded-t transition-all"
                style={{
                  height: `${height}%`,
                  minHeight: value > 0 ? "4px" : "0",
                }}
                title={`${labels[index]}: ${value}`}
              />
              <div className="text-[10px] text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                {labels[index]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SafePie = ({ data, options }) => {
  if (!data || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  const values = data.datasets[0].data || [];
  const labels = data.labels || [];
  const colors = data.datasets[0].backgroundColor || [
    "#ef4444",
    "#dc2626",
    "#f87171",
    "#fb7185",
    "#6366f1",
    "#818cf8",
    "#10b981",
    "#34d399",
  ];
  const total = values.reduce((sum, val) => sum + val, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {labels.map((label, index) => {
          const value = values[index] || 0;
          const percentage = ((value / total) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <div className="text-xs">
                <div className="font-semibold">{label}</div>
                <div className="text-gray-500">
                  {value} units ({percentage}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};



