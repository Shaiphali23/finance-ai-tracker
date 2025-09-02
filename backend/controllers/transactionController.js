const { parseTransactionServices } = require("../services/openaiService");
const Transaction = require("../models/Transaction");
const {
  createTransactionHash,
  calculateTextSimilarity,
} = require("../utils/hashUtils");

const parseTransaction = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Text is required" });
    }

    const parsedData = await parseTransactionServices(text);
    // console.log('Parsed data:', parsedData);
    res.json(parsedData);
  } catch (error) {
    console.error("Parse error:", error);
    res.status(500).json({ message: "Failed to parse transaction" });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date, originalText } =
      req.body;

    // Generate transaction hash
    const transactionHash = createTransactionHash(
      req.user._id,
      amount,
      description,
      originalText
    );

    // Check for duplicates in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentTransactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: twentyFourHoursAgo },
    });

    // Check for exact duplicates using hash
    const exactDuplicate = recentTransactions.find(
      (t) => t.transactionHash === transactionHash
    );

    if (exactDuplicate) {
      return res.status(409).json({
        message: "This exact transaction was already added recently",
        code: "DUPLICATE_TRANSACTION",
        duplicateId: exactDuplicate._id,
      });
    }

    // Check for similar transactions (fallback)
    const similarTransaction = recentTransactions.find((t) => {
      const similarity = calculateTextSimilarity(
        originalText || description,
        t.originalText || t.description
      );
      return similarity > 0.7; // 70% similarity threshold
    });

    if (similarTransaction) {
      return res.status(409).json({
        message: "A similar transaction was already added recently",
        code: "SIMILAR_TRANSACTION",
        duplicateId: similarTransaction._id,
      });
    }

    // Create new transaction
    const transaction = new Transaction({
      userId: req.user._id,
      amount,
      type,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      originalText: originalText || description,
      transactionHash: transactionHash,
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Create transaction error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate transaction detected",
        code: "DUPLICATE_TRANSACTION",
      });
    }

    res.status(500).json({
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page, limit, category, type, startDate, endDate } = req.query;

    const filter = { userId: req.user._id };

    // Apply filters if provided
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // If page & limit are not passed → return ALL transactions
    let transactionsQuery = Transaction.find(filter).sort({ date: -1 });

    // Pagination (only if page & limit provided)
    let totalTransactions = await Transaction.countDocuments(filter);
    if (page && limit) {
      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * pageSize;

      transactionsQuery = transactionsQuery.skip(skip).limit(pageSize);
    }

    const transactions = await transactionsQuery;

    res.status(200).json({
      success: true,
      total: totalTransactions,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    res.json(transaction);
  } catch (error) {
    console.error("Update transaction error:", error);
    res.status(500).json({ message: "Failed to update transaction" });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Delete transaction error:", error);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};

module.exports = {
  parseTransaction,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
