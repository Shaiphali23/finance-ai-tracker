const express = require("express");
const auth = require("../middleware/auth");
const {
  parseTransaction,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

const router = express.Router();

// Parse transaction text
router.post("/parse", auth, parseTransaction);

// Create transaction
router.post("/", auth, createTransaction);

// Get transactions with filters
router.get("/", auth, getTransactions);

// Update transaction
router.put("/:id", auth, updateTransaction);

// Delete transaction
router.delete("/:id", auth, deleteTransaction);

module.exports = router;
