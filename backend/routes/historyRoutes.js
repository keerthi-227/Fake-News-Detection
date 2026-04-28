const express = require('express');
const router = express.Router();
const { getHistory, getStats, deleteDetection } = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHistory);
router.get('/stats', protect, getStats);
router.delete('/:id', protect, deleteDetection);

module.exports = router;