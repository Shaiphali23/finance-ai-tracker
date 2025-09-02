
const Transaction = require("../models/Transaction");

const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = { userId: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Using aggregation optimized for your schema
    const summary = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] }
          },
          totalExpenses: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] }
          }
        }
      }
    ]);

    // If no transactions found
    const result = summary.length > 0 ? summary[0] : { totalIncome: 0, totalExpenses: 0 };

    const savings = result.totalIncome - result.totalExpenses;

    res.json({
      income: parseFloat(result.totalIncome.toFixed(2)),
      expenses: parseFloat(Math.abs(result.totalExpenses).toFixed(2)), // Convert to positive
      savings: parseFloat(savings.toFixed(2))
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
}

const getCategories = async (req, res) => {
  try {
    const { startDate, endDate, type = 'expense' } = req.query;
    
    const filter = { 
      userId: req.user._id,
      type: type // Filter by transaction type
    };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const categoryData = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: type === 'expense' ? 1 : -1 } } // Sort appropriately for expense/income
    ]);

    res.json(categoryData.map(item => ({
      category: item._id,
      amount: parseFloat(Math.abs(item.total).toFixed(2)), // Ensure positive values
      count: item.count,
      type: type
    })));
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

const getTrends = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;
    
    const filter = { userId: req.user._id };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    let groupFormat;
    
    switch (period) {
      case 'daily':
        groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
        break;
      case 'weekly':
        groupFormat = { $dateToString: { format: '%Y-%U', date: '$date' } };
        break;
      default:
        groupFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
    }

    const trendsData = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            period: groupFormat,
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.period': 1 } }
    ]);

    // Format data for easier consumption by frontend
    const formattedData = [];
    const periodMap = {};

    trendsData.forEach(item => {
      const periodKey = item._id.period;
      const type = item._id.type;
      
      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          period: periodKey,
          income: 0,
          expenses: 0
        };
      }
      
      if (type === 'income') {
        periodMap[periodKey].income = item.total;
      } else if (type === 'expense') {
        periodMap[periodKey].expenses = Math.abs(item.total); // Convert to positive
      }
    });

    // Convert object to array
    for (const key in periodMap) {
      formattedData.push(periodMap[key]);
    }

    res.json(formattedData);
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ message: 'Failed to fetch trends' });
  }
}

module.exports = {
  getFinancialSummary,
  getCategories,
  getTrends
};
