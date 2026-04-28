const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes    = require("./routes/authRoutes");
const detectRoutes  = require("./routes/detectRoutes");
const historyRoutes = require("./routes/historyRoutes");
const scanRoutes    = require("./routes/scanRoutes");    // NEW

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth",    authRoutes);
app.use("/api/detect",  detectRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/scan",    scanRoutes);                     // NEW

app.get("/", (req, res) =>
  res.json({ message: "Fake News Detection API running" })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`🚀 Server on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));