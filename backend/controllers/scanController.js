const axios = require("axios");

// @GET /api/scan?category=all&limit=40
const scanNews = async (req, res) => {
  try {
    const { category = "all", limit = 40 } = req.query;

    let mlResponse;
    try {
      mlResponse = await axios.get(
        `${process.env.ML_API_URL}/scan`,
        {
          params: { category, limit },
          timeout: 30000   // RSS fetching can be slow
        }
      );
    } catch (err) {
      if (err.code === "ECONNREFUSED") {
        return res.status(503).json({
          message: "ML service unavailable. Start the Python API."
        });
      }
      if (err.response?.data?.error) {
        return res.status(503).json({ message: err.response.data.error });
      }
      throw err;
    }

    res.json(mlResponse.data);
  } catch (error) {
    res.status(500).json({
      message: "Live scan failed",
      error: error.message
    });
  }
};

module.exports = { scanNews };