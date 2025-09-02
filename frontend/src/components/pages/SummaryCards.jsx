import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../ContextAPI/AnalyticsContext';

const SummaryCards = ({ darkMode }) => {
  const { summary, fetchSummary } = useAnalytics();
  const [localSummary, setLocalSummary] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    loading: true
  });

  // Fetch summary data on component mount
  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLocalSummary(prev => ({ ...prev, loading: true }));
        await fetchSummary();
      } catch (error) {
        console.error('Error loading summary:', error);
        setLocalSummary(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    loadSummary();
  }, [fetchSummary]); // Only depend on fetchSummary

  // Update local state when summary data changes
  useEffect(() => {
    if (summary && !summary.loading) {
      setLocalSummary({
        income: summary.income || 0,
        expenses: summary.expenses || 0,
        savings: summary.savings || 0,
        loading: false,
        error: null
      });
    }
  }, [summary?.income, summary?.expenses, summary?.savings, summary?.loading]); // Only depend on specific properties

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const Card = ({ title, amount, isPositive, color, loading }) => (
    <div className={`p-6 rounded-lg shadow-lg transition-all duration-300 hover:scale-105 ${
      darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
    }`}>
      <h3 className={`text-lg font-medium mb-2 ${
        darkMode ? "text-gray-200" : "text-gray-900"
      }`}>
        {title}
      </h3>
      
      {loading ? (
        <div className="animate-pulse">
          <div className={`h-8 bg-gray-300 rounded ${darkMode ? "bg-gray-600" : ""}`}></div>
          <div className={`h-4 bg-gray-200 rounded mt-2 ${darkMode ? "bg-gray-500" : ""}`}></div>
        </div>
      ) : (
        <>
          <p className={`text-3xl font-bold ${color}`}>
            {formatCurrency(amount)}
          </p>
          <div className={`mt-2 text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <i className={`fas ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'} mr-1`}></i>
            {isPositive ? 'Positive' : 'Negative'}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card 
        title="TOTAL INCOME" 
        amount={localSummary.income} 
        isPositive={true}
        color="text-green-600"
        loading={localSummary.loading}
      />
      
      <Card 
        title="TOTAL EXPENSES" 
        amount={localSummary.expenses} 
        isPositive={false}
        color="text-red-600"
        loading={localSummary.loading}
      />
      
      <Card 
        title="NET SAVINGS" 
        amount={localSummary.savings} 
        isPositive={localSummary.savings >= 0}
        color={localSummary.savings >= 0 ? "text-blue-600" : "text-orange-600"}
        loading={localSummary.loading}
      />
    </div>
  );
};

export default SummaryCards;