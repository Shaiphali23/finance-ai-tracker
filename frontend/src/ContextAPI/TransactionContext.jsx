import { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used within TransactionProvider");
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Get API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const parseTransaction = async (text) => {
    try {
      const response = await axios.post(`${API_URL}/api/transactions/parse`, {
        text,
      });
      return response.data;
    } catch (error) {
      console.error("Parse error:", error);
      throw error;
    }
  };

  const createTransaction = async (transactionData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/transactions`,
        transactionData
      );
      setTransactions((prev) => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error;
      } else {
        throw new Error("Network error. Please try again.");
      }
    }
  };

  const fetchTransactions = useCallback(
    async (filters = {}, { all = false } = {}) => {
      try {
        setLoading(true);

        const params = new URLSearchParams(filters).toString();
        const url = params
          ? `${API_URL}/api/transactions?${params}`
          : `${API_URL}/api/transactions`;

        const response = await axios.get(url, { withCredentials: true });

        if (!all) setTransactions(response.data.transactions); // for table

        return all ? response.data.transactions : response.data; // return array if fetching all
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [] // ✅ empty dependency array ensures stable reference
  );

  const updateTransaction = async (id, updates) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/transactions/${id}`,
        updates
      );
      setTransactions((prev) =>
        prev.map((t) => (t._id === id ? response.data : t))
      );
      return response.data;
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  };

  const value = {
    transactions,
    loading,
    parseTransaction,
    createTransaction,
    fetchTransactions,
    updateTransaction,
    deleteTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
