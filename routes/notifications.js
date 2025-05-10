const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const {
  getNotifications,
  markAsRead,
} = require("../controllers/notifications");

router.get("/", protect, getNotifications);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;
