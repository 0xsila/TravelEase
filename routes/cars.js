const express = require("express");
const upload = require("../middleware/multer");
const router = express.Router();

const {
  getAllCars,
  getCar,
  createCar,
  updateCar,
  deleteCar,
} = require("../controllers/cars");
const { protect } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(getAllCars)
  .post(protect, upload.array("images", 5), createCar);

router
  .route("/:id")
  .get(getCar)
  .patch(protect, upload.array("images", 5), updateCar)
  .delete(protect, deleteCar);

module.exports = router;
