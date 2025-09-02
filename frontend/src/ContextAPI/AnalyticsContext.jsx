import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    loading: true,
    error: null
  });

  const [categories, setCategories] = useState({
    data: [],
    loading: true,
    error: null
  });

  const [trends, setTrends] = useState({
    data: [],
    loading: true,
    error: null
  });

  // Get API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Function to fetch financial summary - using useCallback
  const fetchSummary = useCallback(async (startDate, endDate) => {
    try {
      setSummary(prev => ({ ...prev, loading: true, error: null }));

      let url = `${API_URL}/api/analytics/summary`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary({
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
        loading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummary(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  }, [API_URL]); // API_URL as dependency

  // Function to fetch categories - using useCallback
  const fetchCategories = useCallback(async (type = 'expense', startDate, endDate) => {
    try {
      setCategories(prev => ({ ...prev, loading: true, error: null }));

      let url = `${API_URL}/api/analytics/categories?type=${type}`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCategories({
        data,
        loading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  }, [API_URL]); // API_URL as dependency

  // Function to fetch trends - using useCallback
  const fetchTrends = useCallback(async (period = 'monthly', startDate, endDate) => {
    try {
      setTrends(prev => ({ ...prev, loading: true, error: null }));

      let url = `${API_URL}/api/analytics/trends?period=${period}`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTrends({
        data,
        loading: false,
        error: null
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching trends:', error);
      setTrends(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  }, [API_URL]); // API_URL as dependency

  // Refresh all analytics data - using useCallback
  const refreshAllAnalytics = useCallback(async (filters = {}) => {
    const { startDate, endDate, period } = filters;
    try {
      await Promise.all([
        fetchSummary(startDate, endDate),
        fetchCategories('expense', startDate, endDate),
        fetchTrends(period || 'monthly', startDate, endDate)
      ]);
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    }
  }, [fetchSummary, fetchCategories, fetchTrends]);

  // Initial data fetch
  useEffect(() => {
    refreshAllAnalytics();
  }, [refreshAllAnalytics]); // refreshAllAnalytics as dependency

  const value = {
    // Summary
    summary,
    fetchSummary,
    
    // Categories
    categories,
    fetchCategories,
    
    // Trends
    trends,
    fetchTrends,
    
    // Combined operations
    refreshAllAnalytics
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};