import React, { useState, useRef, useEffect } from "react";
import { useTransactions } from "../../ContextAPI/TransactionContext";

const SmartTransactionEntry = ({ onTransactionAdded, darkMode = false }) => {
  const [inputText, setInputText] = useState("");
  const [parsedData, setParsedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recentInputs, setRecentInputs] = useState(new Set());
  const { parseTransaction, createTransaction } = useTransactions();

  const parseTimerRef = useRef(null);

  // Clear recent inputs after 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      setRecentInputs(new Set());
    }, 5 * 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setInputText(newText);
    setError("");
    setSuccess("");
  };

  const isDuplicateInput = (text) => {
    return recentInputs.has(text.toLowerCase().trim());
  };

  const handleParse = async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText) {
      setError("Please enter a transaction description");
      return;
    }

    // Frontend duplicate check
    if (isDuplicateInput(trimmedText)) {
      setError(
        "You recently entered this transaction. Please enter a new one."
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setParsedData(null);

    try {
      const response = await parseTransaction(trimmedText);
      setParsedData(response);
    } catch (err) {
      setError("Failed to parse transaction. Please try again.");
      console.error("Parse error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedData) return;

    setIsLoading(true);

    try {
      const transactionData = {
        amount: parsedData.amount,
        category: parsedData.category,
        description: parsedData.description,
        type: parsedData.type || (parsedData.amount < 0 ? "expense" : "income"),
        date: new Date().toISOString(),
        originalText: inputText,
      };

      await createTransaction(transactionData);

      // Add to recent inputs to prevent duplicates
      setRecentInputs((prev) => {
        const newSet = new Set(prev);
        newSet.add(inputText.toLowerCase().trim());
        return newSet;
      });

      setSuccess("Transaction added successfully!");
      setInputText("");
      setParsedData(null);

      if (onTransactionAdded) {
        onTransactionAdded();
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      // Handle duplicate error from backend
      if (err.response?.data?.code === "DUPLICATE_TRANSACTION") {
        setError(
          "This transaction was already added recently. Please enter a new one."
        );

        // Add to recent inputs since backend confirmed it's a duplicate
        setRecentInputs((prev) => {
          const newSet = new Set(prev);
          newSet.add(inputText.toLowerCase().trim());
          return newSet;
        });
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to save transaction. Please try again."
        );
      }
      console.error("Save error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setParsedData(null);
    setInputText("");
    setError("");
    setSuccess("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !parsedData) {
      handleParse();
    } else if (e.key === "Enter" && parsedData) {
      handleConfirm();
    }
  };

  return (
    <div
      className={`rounded-lg shadow-md p-6 mb-6 transition-colors duration-300 ${
        darkMode
          ? "bg-gray-800 border border-gray-700"
          : "bg-white border border-gray-200"
      }`}
    >
      <h2
        className={`text-xl font-semibold mb-4 ${
          darkMode ? "text-white" : "text-gray-800"
        }`}
      >
        Add Transaction
      </h2>

      <div className="mb-4">
        <label
          htmlFor="transaction-input"
          className={`block text-sm font-medium mb-1 ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Describe your transaction in natural language
        </label>
        <div className="flex">
          <input
            id="transaction-input"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="'Coffee at Starbucks ₹150' or 'Got paid ₹35000 salary'"
            className={`flex-1 px-4 py-3 border rounded-l-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
              darkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }`}
            disabled={isLoading}
          />
          <button
            onClick={!parsedData ? handleParse : handleCancel}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-3 bg-blue-600 text-white font-medium rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : !parsedData ? (
              "Analyze"
            ) : (
              "Cancel"
            )}
          </button>
        </div>

        <p
          className={`text-xs mt-2 ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Examples: "Coffee ₹150", "Salary ₹35000", "Petrol ₹2000"
        </p>
      </div>

      {error && (
        <div
          className={`mb-4 p-3 rounded-md flex items-start ${
            darkMode
              ? "bg-red-900/30 border border-red-800 text-red-200"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className={`mb-4 p-3 rounded-md flex items-start ${
            darkMode
              ? "bg-green-900/30 border border-green-800 text-green-200"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span>{success}</span>
        </div>
      )}

      {parsedData && (
        <div
          className={`border rounded-md p-4 transition-colors ${
            darkMode
              ? "bg-gray-700/50 border-gray-600"
              : "bg-blue-50 border-blue-200"
          }`}
        >
          <h3
            className={`font-medium mb-3 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            Transaction Details
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Amount
              </p>
              <p
                className={`text-lg font-semibold ${
                  parsedData.amount < 0
                    ? darkMode
                      ? "text-red-400"
                      : "text-red-600"
                    : darkMode
                    ? "text-green-400"
                    : "text-green-600"
                }`}
              >
                {parsedData.amount < 0 ? "-₹" : "₹"}
                {Math.abs(parsedData.amount).toFixed(2)}
              </p>
            </div>

            <div>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Category
              </p>
              <div className="flex items-center mt-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    darkMode
                      ? "bg-blue-900/40 text-blue-300"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {/* Added null check for category */}
                  {parsedData.category || "Uncategorized"}
                </span>
              </div>
            </div>

            <div className="col-span-2">
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Description
              </p>
              <p className={darkMode ? "text-gray-200" : "text-gray-800"}>
                {/* Added null check for description */}
                {parsedData.description || "No description"}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors ${
                darkMode
                  ? "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Edit
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTransactionEntry;
