const express    = require("express");
const router     = express.Router();
const { scanNews } = require("../controllers/scanController");
const { protect }  = require("../middleware/authMiddleware");

// GET /api/scan
router.get("/", protect, scanNews);

module.exports = router;