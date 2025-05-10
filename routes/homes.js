const express = require("express");
const upload = require("../middleware/multer");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const {
  getAllHomes,
  getHome,
  createHome,
  updateHome,
  deleteHome,
} = require("../controllers/homes");

router
  .route("/")
  .post(protect, upload.array("images", 5), createHome)
  .get(getAllHomes);
router
  .route("/:id")
  .get(getHome)
  .patch(protect, upload.array("images", 5), updateHome)
  .delete(protect, deleteHome);

module.exports = router;
