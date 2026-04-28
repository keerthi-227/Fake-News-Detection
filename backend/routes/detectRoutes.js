const express = require("express");
const router  = express.Router();
const { detectNews }    = require("../controllers/detectController");
const { detectFromUrl } = require("../controllers/urlController");
const { protect }       = require("../middleware/authMiddleware");

router.post("/",    protect, detectNews);      // text detection
router.post("/url", protect, detectFromUrl);   // URL detection

module.exports = router;