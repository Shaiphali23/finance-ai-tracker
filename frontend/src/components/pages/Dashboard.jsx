import React, { useState, useEffect } from "react";
import { useAuth } from "../../ContextAPI/AuthContext";
import { Navigate } from "react-router-dom";
import TransactionList from "./TransactionsList";
import SmartTransactionEntry from "./SmartTransactionEntry";
import { useTransactions } from "../../ContextAPI/TransactionContext";
import { useAnalytics } from "../../ContextAPI/AnalyticsContext";
import SpendingPieChart from "../pages/SpendingCharts";
import SummaryCards from "./SummaryCards";
import TransactionModal from "./TransactionModal";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { fetchTransactions, updateTransaction } = useTransactions();
  const { refreshAllAnalytics } = useAnalytics();
  const [darkMode, setDarkMode] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeView, setActiveView] = useState("monthly");
  const [chartTransactions, setChartTransactions] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch paginated transactions for table
  useEffect(() => {
    fetchTransactions();
  }, [refreshCount, fetchTransactions]);

  // Fetch ALL transactions for PieChart and refresh analytics
  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Fetch all transactions for charts
        const response = await fetchTransactions({}, { all: true });
        setChartTransactions(response);

        // Refresh analytics data
        await refreshAllAnalytics({ period: activeView });
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    loadAllData();
  }, [refreshCount, activeView, fetchTransactions, refreshAllAnalytics]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleTransactionAdded = () => {
    setRefreshCount((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  // Handle edit transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  // Handle saving edited transaction
  const handleSaveTransaction = async (updatedData) => {
    try {
      await updateTransaction(
        editingTransaction._id || editingTransaction.id,
        updatedData
      );
      setIsEditModalOpen(false);
      setEditingTransaction(null);
      setRefreshCount((prev) => prev + 1); // Refresh data
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  // Toggle between monthly and weekly view
  const toggleView = () => {
    setActiveView((prevView) =>
      prevView === "monthly" ? "weekly" : "monthly"
    );
    setRefreshCount((prev) => prev + 1); // Refresh data with new view
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top row for logo and mobile menu button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div
                className={`${
                  darkMode ? "bg-blue-600" : "bg-blue-500"
                } text-white p-2 rounded-lg`}
              >
                <i className="fas fa-wallet text-xl"></i>
              </div>
              <h1
                className={`ml-3 text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                My Finance Dashboard
              </h1>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-md ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
              </button>
            </div>
          </div>

          {/* Navigation area - shown on desktop, conditional on mobile */}
          <div
            className={`mt-4 flex flex-col md:flex-row md:items-center md:justify-between md:mt-0 ${
              isMenuOpen ? "block" : "hidden md:flex"
            }`}
          >
            {/* Left side buttons */}
            <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
              {/* View Toggle Button */}
              <button
                onClick={toggleView}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {activeView === "monthly" ? "Monthly View" : "Weekly View"}
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-green-300 hover:bg-gray-600"
                    : "bg-gray-100 text-green-600 hover:bg-gray-200"
                }`}
                title="Refresh Data"
              >
                <i className="fas fa-sync-alt"></i>
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Toggle Dark Mode"
              >
                <i className={`fas ${darkMode ? "fa-sun" : "fa-moon"}`}></i>
              </button>
            </div>

            {/* Right side user info and logout */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 border-t md:border-t-0 md:pt-0">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {user.name}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium self-start sm:self-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards (using backend API) */}
        <SummaryCards darkMode={darkMode} />

        {/* Smart Transaction Entry */}
        <SmartTransactionEntry
          onTransactionAdded={handleTransactionAdded}
          darkMode={darkMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            <SpendingPieChart
              darkMode={darkMode}
              onCategorySelect={(category, type) => {
                console.log(`Selected ${type} category:`, category);
              }}
            />
          </div>

          {/* Right Column - Transaction List */}
          <div className="space-y-8">
            <TransactionList
              refreshTrigger={refreshCount}
              darkMode={darkMode}
              onEditTransaction={handleEditTransaction}
            />
          </div>
        </div>

        {/* Edit Transaction Modal */}
        {isEditModalOpen && (
          <TransactionModal
            transaction={editingTransaction}
            onSave={handleSaveTransaction}
            onClose={handleCloseModal}
            darkMode={darkMode}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className={`mt-12 py-6 ${
          darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2025 My Finance Tracker. Built with React & Node.js
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;