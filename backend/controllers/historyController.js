const Detection = require('../models/Detection');

// @GET /api/history
const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Detection.countDocuments({ userId: req.user._id });
    const detections = await Detection.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      detections,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

// @GET /api/history/stats
const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const total = await Detection.countDocuments({ userId });
    const fakeCount = await Detection.countDocuments({ userId, prediction: 'FAKE' });
    const realCount = await Detection.countDocuments({ userId, prediction: 'REAL' });

    const avgConfidence = await Detection.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avg: { $avg: '$confidence' } } }
    ]);

    // Last 7 days activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await Detection.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total,
      fakeCount,
      realCount,
      avgConfidence: avgConfidence[0]?.avg?.toFixed(1) || 0,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

// @DELETE /api/history/:id
const deleteDetection = async (req, res) => {
  try {
    const detection = await Detection.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!detection)
      return res.status(404).json({ message: 'Detection not found' });

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

module.exports = { getHistory, getStats, deleteDetection };