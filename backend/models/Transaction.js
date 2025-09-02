const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  originalText: String,
  transactionHash: {
    type: String,
    unique: true // Ensure hash is unique
  }
}, {
  timestamps: true
});

// Index for better duplicate detection performance
transactionSchema.index({ userId: 1, transactionHash: 1 });
transactionSchema.index({ userId: 1, amount: 1, description: 1, date: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
