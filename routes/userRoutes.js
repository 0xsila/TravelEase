const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  deleteAccount,
  toggleFavorite,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Profile routes
router.get("/profile/:id", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.delete("/:id", protect, deleteAccount);
router.post("/favorite/:id", protect, toggleFavorite);

module.exports = router;
