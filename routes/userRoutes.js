const express = require('express');
const router = express.Router();
const { 
    getProfile, 
    updateProfile, 
    deleteAccount 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Profile routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.delete('/:id', protect, deleteAccount);

module.exports = router; 