const axios = require('axios');
const Detection = require('../models/Detection');

// @POST /api/detect
const detectNews = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10)
      return res.status(400).json({ message: 'Please provide meaningful text (min 10 chars)' });

    // Call Python ML API
    const mlResponse = await axios.post(`${process.env.ML_API_URL}/predict`, { text });
    const { prediction, confidence, fake_score, real_score } = mlResponse.data;

    // Save to DB
    const detection = await Detection.create({
      userId: req.user._id,
      inputText: text,
      prediction,
      confidence,
      fakeScore: fake_score,
      realScore: real_score,
      wordCount: text.trim().split(/\s+/).length
    });

    res.status(201).json({
      _id: detection._id,
      prediction,
      confidence,
      fakeScore: fake_score,
      realScore: real_score,
      wordCount: detection.wordCount,
      createdAt: detection.createdAt
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ message: 'ML service unavailable. Please start the Python API.' });
    }
    res.status(500).json({ message: 'Detection failed', error: error.message });
  }
};

module.exports = { detectNews };