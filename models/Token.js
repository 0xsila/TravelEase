const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['activation', 'passwordReset'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Token expires after 10 minutes (600 seconds)
  }
});

module.exports = mongoose.model('Token', TokenSchema);