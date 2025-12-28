import React from "react";

// Helper to generate SVG path for line chart
const getSmoothPath = (values, width, height) => {
  if (values.length < 2) return "";
  const maxX = values.length - 1;
  const maxY = Math.max(...values, 1);

  const points = values.map((val, i) => {
    const x = (i / maxX) * width;
    const y = height - (val / maxY) * height;
    return [x, y];
  });

  return points.reduce((acc, [x, y], i, arr) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = arr[i - 1];
    // simple straight lines for safety
    return `${acc} L ${x},${y}`;
  }, "");
};

// SafeLine: Renders an SVG Area Chart
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
  const color = data.datasets[0].borderColor || "#ef4444";
  const bg = data.datasets[0].backgroundColor || "rgba(239, 68, 68, 0.1)";

  return (
    <div className="relative w-full h-full flex flex-col justify-end">
      <svg className="w-full h-full" viewBox={`0 0 100 50`} preserveAspectRatio="none">
        {/* Area fill */}
        <path
          d={`${getSmoothPath(values, 100, 50)} L 100,50 L 0,50 Z`}
          fill={bg}
          stroke="none"
          opacity="0.5"
        />
        {/* Line stroke */}
        <path
          d={getSmoothPath(values, 100, 50)}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        {labels.map((l, i) => (
          // Show only some labels to avoid crowding
          (i % Math.ceil(labels.length / 5) === 0 || i === labels.length - 1) && (
            <span key={i}>{l}</span>
          )
        ))}
      </div>
    </div>
  );
};

// SafePie: Renders an SVG Pie Chart
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
    "#ef4444", "#dc2626", "#f87171", "#fb7185",
    "#6366f1", "#818cf8", "#10b981", "#34d399",
  ];

  const total = values.reduce((sum, val) => sum + val, 0);
  if (total === 0) return <div className="text-center text-gray-400 text-sm p-4">No Data</div>;

  let cumulativeAngle = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div className="h-full w-full flex flex-col md:flex-row items-center justify-center gap-6">
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-90">
          {values.map((value, index) => {
            const percent = value / total;

            // Handle single value case (full circle)
            if (percent === 1) {
              return (
                <circle
                  key={index}
                  cx="0"
                  cy="0"
                  r="1"
                  fill={colors[index % colors.length]}
                />
              );
            }

            const [startX, startY] = getCoordinatesForPercent(cumulativeAngle);
            cumulativeAngle += percent;
            const [endX, endY] = getCoordinatesForPercent(cumulativeAngle);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            const pathData = [
              `M 0 0`,
              `L ${startX} ${startY}`,
              `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
              `Z`
            ].join(" ");

            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                className="hover:opacity-80 transition-opacity"
              />
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-gray-600 truncate max-w-[100px]" title={label}>{label}</span>
            <span className="font-bold text-gray-800">
              {((values[index] / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
