const Notification = require("../models/Notifications");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../errors");

// Get all notifications for the user
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id: notId } = req.params;

    const notification = await Notification.findById(notId);

    if (!notification || notification.user.toString() !== userId) {
      return res.status(403).json({ msg: "notification not found" });
    }

    notification.isRead = true;
    await notification.save();
    res.json({ msg: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
