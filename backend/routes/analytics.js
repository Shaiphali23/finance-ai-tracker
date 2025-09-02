const express = require("express");
const auth = require("../middleware/auth");
const {
  getFinancialSummary,
  getCategories,
  getTrends,
} = require("../controllers/analyticsController");

const router = express.Router();

// Get financial summary
router.get("/summary", auth, getFinancialSummary);

// Get spending by category
router.get("/categories", auth, getCategories);

// Get spending trends
router.get("/trends", auth, getTrends);

module.exports = router;
