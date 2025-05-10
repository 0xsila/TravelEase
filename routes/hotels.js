const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/multer");

const router = express.Router();

const {
  getAllHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel,
} = require("../controllers/hotels");
const isAdmin = require("../middleware/isAdmin");

router
  .route("/")
  .get(getAllHotels)
  .post(protect, isAdmin, upload.array("images", 5), createHotel);
router
  .route("/:id")
  .get(getHotel)
  .patch(protect, isAdmin, upload.array("images", 5), updateHotel)
  .delete(protect, isAdmin, deleteHotel);

module.exports = router;
