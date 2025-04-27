const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ['booking', 'reminder', 'system'], default: 'system' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
