const axios = require("axios");
const Detection = require("../models/Detection");

// @POST /api/detect/url
const detectFromUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim())
      return res.status(400).json({ message: "URL is required" });

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://"))
      cleanUrl = "https://" + cleanUrl;

    try { new URL(cleanUrl); }
    catch { return res.status(400).json({ message: "Invalid URL format" }); }

    // Call Flask ML API
    let mlResponse;
    try {
      mlResponse = await axios.post(
        `${process.env.ML_API_URL}/predict-url`,
        { url: cleanUrl },
        { timeout: 20000 }
      );
    } catch (err) {
      if (err.code === "ECONNREFUSED")
        return res.status(503).json({ message: "ML service unavailable. Start the Python API." });
      if (err.response?.data?.error)
        return res.status(422).json({ message: err.response.data.error });
      throw err;
    }

    const {
      prediction, confidence, real_score, fake_score,
      title, source, word_count, signals, extracted_text
    } = mlResponse.data;

    // Save to DB
    const detection = await Detection.create({
      userId:       req.user._id,
      inputText:    extracted_text || cleanUrl,
      prediction,
      confidence,
      fakeScore:    fake_score,
      realScore:    real_score,
      wordCount:    word_count,
      source:       "url",
      sourceUrl:    cleanUrl,
      articleTitle: title,
      sourceDomain: source,
    });

    res.status(201).json({
      _id:           detection._id,
      prediction,
      confidence,
      fakeScore:     fake_score,
      realScore:     real_score,
      wordCount:     word_count,
      signals,
      title,
      source,
      url:           cleanUrl,
      extractedText: extracted_text,
      createdAt:     detection.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "URL detection failed", error: error.message });
  }
};

module.exports = { detectFromUrl };