const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const { review } = require("../controllers/general");

router.route("/:id/review").post(protect, review);
// router.route('/:id/comment/:commentId').patch(editComment).delete(deleteComment)

module.exports = router;
