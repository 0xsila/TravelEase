const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();
const {
  getAllBookings,
  createBooking,
  getBookingById,
  updateBookingById,
  deleteBookingById,
} = require("../controllers/booking");

router.route("/").get(protect, getAllBookings).post(protect, createBooking);
router
  .route("/:id", protect)
  .get(protect, getBookingById)
  .patch(protect, updateBookingById)
  .delete(protect, isAdmin, deleteBookingById);

module.exports = router;
