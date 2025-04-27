
const Notification = require('../models/Notifications')
const {StatusCodes}= require('http-status-codes')
const {BadRequestError,UnauthenticatedError, NotFoundError}=require('../errors')


// Get all notifications for the user
const getNotifications = async (req, res) => {
    const userId = '660f71bde70a3f4f88771a4b';
  
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  };
  
  // Mark notification as read
  const markAsRead = async (req, res) => {
    const userId = '660f71bde70a3f4f88771a4b';
    const { id: notId }=req.params;
    
    const notification = await Notification.findById(notId);
    
    if (!notification || notification.user.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized or notification not found' });
    }
  
    notification.isRead = true;
    await notification.save();
    res.json({ msg: 'Notification marked as read' });
  };
  

  module.exports={
    getNotifications,
    markAsRead
  }