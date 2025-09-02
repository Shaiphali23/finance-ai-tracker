const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  picture: {
    type: String
  },
  preferences: {
    currency: {
      type: String,
      default: 'USD'
    },
    categories: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);