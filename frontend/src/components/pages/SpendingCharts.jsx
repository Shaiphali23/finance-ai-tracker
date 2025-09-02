import React, { useMemo, useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAnalytics } from "../../ContextAPI/AnalyticsContext";

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#A569BD", "#E67E22", "#5DADE2", "#EC7063",
  "#45B39D", "#AF7AC5", "#F7DC6F", "#DC7633",
  "#5499C7", "#58D68D", "#EB984E", "#CB4335"
];

const SpendingPieChart = ({ darkMode, timeRange = "month", onCategorySelect }) => {
  const { categories } = useAnalytics();
  const [debugData, setDebugData] = useState(null);

  // Process category data for the pie chart - combine both expense and income
  const chartData = useMemo(() => {
    if (!categories.data || categories.data.length === 0) {
      // console.log("No categories data available");
      return [];
    }
    
    // Process data with better error handling
    const processedData = categories.data
      .map(item => {
        try {
          // Handle different possible data structures
          const name = item._id || item.name || item.category || 'Unknown';
          const value = Number(item.totalAmount || item.amount || item.value || 0);
          const count = Number(item.count || item.transactionCount || 0);
          const type = item.type || 'unknown';
          
          return {
            name,
            value,
            count,
            type
          };
        } catch (error) {
          console.error("Error processing item:", item, error);
          return null;
        }
      })
      .filter(item => item !== null && item.value > 0) // Only include valid items with positive values
      .sort((a, b) => b.value - a.value);
    
    setDebugData(processedData); // Store for debugging
    
    return processedData;
  }, [categories.data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-md shadow-lg border ${
            darkMode 
              ? "bg-gray-800 border-gray-700 text-white" 
              : "bg-white border-gray-200 text-gray-800"
          }`}
        >
          <p className="font-bold">{data.name}</p>
          <p className="mt-1">
            Amount: <span className="font-semibold">${(data.value || 0).toFixed(2)}</span>
          </p>
          <p>
            Transactions: <span className="font-semibold">{data.count || 0}</span>
          </p>
          <p className="capitalize">
            Type: <span className="font-semibold">{data.type}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Handle click on a pie segment
  const handlePieClick = (data) => {
    if (onCategorySelect && data) {
      onCategorySelect(data.name, data.type);
    }
  };

  return (
    <div
      className={`p-6 rounded-lg shadow ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      }`}
    >
      <h2 className="text-xl font-semibold mb-6">Spending Categories</h2>

      {categories.loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                label={renderCustomizedLabel}
                labelLine={false}
                onClick={handlePieClick}
                style={{ cursor: onCategorySelect ? "pointer" : "default" }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={darkMode ? "#374151" : "#fff"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 max-h-40 overflow-y-auto">
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}>
              {chartData.slice(0, 8).map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded hover:bg-opacity-10"
                  style={{ 
                    backgroundColor: `${COLORS[index % COLORS.length]}22` 
                  }}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="font-medium">${(item.value || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-64 flex-col">
          <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
            No category data available for the selected period
          </p>
          {/* Debug information */}
          <div className="text-xs mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <p>Debug Info:</p>
            <p>Has categories data: {categories.data ? "Yes" : "No"}</p>
            <p>Data length: {categories.data?.length || 0}</p>
            {debugData && (
              <p>Processed data length: {debugData.length}</p>
            )}
            {categories.data && categories.data.length > 0 && (
              <div className="mt-2">
                <p>Sample data:</p>
                <pre className="text-xs overflow-auto max-h-20">
                  {JSON.stringify(categories.data[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingPieChart;