import { useEffect, useState, useMemo, useCallback } from "react";
import { useTransactions } from "../../ContextAPI/TransactionContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

const TransactionList = ({ refreshTrigger, darkMode, onEditTransaction }) => {
  const { transactions, loading, error, deleteTransaction, fetchTransactions } =
    useTransactions();
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch transactions when refreshTrigger changes
  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger, fetchTransactions]);

  // Prepare daily spending data using useMemo to avoid recalculations
  const dailyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const dailyTotals = {};
    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        // Create a consistent date key (YYYY-MM-DD format)
        const dateObj = new Date(tx.date);
        const dateKey = dateObj.toISOString().split("T")[0];

        if (!dailyTotals[dateKey]) {
          dailyTotals[dateKey] = {
            date: dateKey,
            displayDate: dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            amount: 0,
          };
        }
        dailyTotals[dateKey].amount += Math.abs(tx.amount);
      }
    });

    // Convert to array and sort by date
    return Object.values(dailyTotals)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Show only the last 7 days
  }, [transactions]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];

    let filtered = transactions;

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    // Apply sorting - newest first by default
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date) - new Date(a.date); // Newest first
        case "amount":
          return Math.abs(b.amount) - Math.abs(a.amount); // Largest first
        case "description":
          return a.description.localeCompare(b.description); // A-Z
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, filterType, sortBy]);

  // Format currency consistently
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  // Function to truncate merchant names based on screen size
  const truncateMerchantName = (name) => {
    if (isSmallScreen && name.length > 10) {
      return name.substring(0, 7) + "...";
    }
    if (name.length > 20) {
      return name.substring(0, 17) + "...";
    }
    return name;
  };

  // Handle transaction deletion with confirmation
  const handleDelete = useCallback((id, description) => {
    if (window.confirm(`Are you sure you want to delete "${description}"?`)) {
      deleteTransaction(id);
    }
  }, [deleteTransaction]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg ${
            darkMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <p
            className={`font-medium ${
              darkMode ? "text-gray-200" : "text-gray-800"
            }`}
          >
            {payload[0]?.payload?.displayDate || label}
          </p>
          <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get bar color based on amount
  const getBarColor = (amount) => {
    if (amount < 50) return "#4ADE80"; // Green for low spending
    if (amount < 100) return "#FBBF24"; // Yellow for medium spending
    return "#EF4444"; // Red for high spending
  };

  // Determine which transactions to display
  const transactionsToDisplay = showAllTransactions 
    ? filteredAndSortedTransactions 
    : filteredAndSortedTransactions.slice(0, 5);

  return (
    <>
      {/* Daily Spending Bar Chart */}
      <div
        className={`rounded-lg p-4 sm:p-6 shadow mb-6 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        role="region"
        aria-label="Daily spending chart"
      >
        <h2
          className={`text-lg font-semibold mb-4 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Daily Spending (Last 7 Days)
        </h2>
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={isSmallScreen ? 250 : 300}>
            <BarChart
              data={dailyData}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={darkMode ? "#4B5563" : "#E5E7EB"}
              />
              <XAxis
                dataKey="displayDate"
                tick={{
                  fontSize: isSmallScreen ? 10 : 12,
                  fill: darkMode ? "#D1D5DB" : "#4B5563",
                }}
              />
              <YAxis
                tickFormatter={(value) => `$${value}`}
                tick={{
                  fontSize: isSmallScreen ? 10 : 12,
                  fill: darkMode ? "#D1D5DB" : "#4B5563",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Spending">
                {dailyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.amount)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p
              className={`text-sm text-center py-4 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {loading
                ? "Loading spending data..."
                : "No daily spending data available"}
            </p>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div
        className={`rounded-lg p-4 sm:p-6 shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        role="region"
        aria-label="Recent transactions"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <h2
            className={`text-lg font-semibold ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Recent Transactions
          </h2>

          {/* Filter and Sort Controls */}
          <div className="flex gap-2 self-end sm:self-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`text-sm rounded-md px-2 py-1 border ${
                darkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              <option
                value="date"
                className={
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }
              >
                Date
              </option>
              <option
                value="amount"
                className={
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }
              >
                Amount
              </option>
              <option
                value="description"
                className={
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }
              >
                Name
              </option>
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`text-sm rounded-md px-2 py-1 border ${
                darkMode
                  ? "bg-gray-700 text-white border-gray-600"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              <option
                value="all"
                className={
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }
              >
                All
              </option>
              <option
                value="income"
                className={
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }
              >
                Income
              </option>
              <option
                value="expense"
                className={
                  darkMode ? "bg-gray-700 text-white" : "bg-white text-gray-800"
                }
              >
                Expenses
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <div
            className="flex justify-center py-8"
            aria-label="Loading transactions"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">Error loading transactions: {error}</p>
            <button
              onClick={fetchTransactions}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactionsToDisplay.map((transaction) => (
              <div
                key={transaction._id || transaction.id}
                className={`p-3 border-b transition-colors ${
                  darkMode
                    ? "border-gray-700 hover:bg-gray-700"
                    : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start sm:items-center gap-2">
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    {/* Category icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        darkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {transaction.description.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-medium truncate ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {truncateMerchantName(transaction.description)}
                      </p>
                      <div className="flex flex-wrap items-center mt-1 gap-x-2">
                        <span
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {transaction.category}
                        </span>
                        <span
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {new Date(transaction.date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: isSmallScreen ? "2-digit" : "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`font-semibold text-sm sm:text-base ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>

                    <div className="flex">
                      <button
                        onClick={() => onEditTransaction(transaction)}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 p-1 rounded"
                        aria-label={`Edit transaction: ${transaction.description}`}
                      >
                        <i className="fas fa-edit text-sm sm:text-base"></i>
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            transaction._id || transaction.id,
                            transaction.description
                          )
                        }
                        className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 p-1 rounded"
                        aria-label={`Delete transaction: ${transaction.description}`}
                      >
                        <i className="fas fa-trash text-sm sm:text-base"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredAndSortedTransactions.length === 0 && (
              <p
                className={`text-sm text-center py-4 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                No transactions found
              </p>
            )}

            {filteredAndSortedTransactions.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowAllTransactions(!showAllTransactions)}
                  className={`text-sm font-medium ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  } hover:underline`}
                >
                  {showAllTransactions ? "Show Less" : `View All (${filteredAndSortedTransactions.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TransactionList;