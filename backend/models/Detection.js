const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  inputText:    { type: String, required: true },
  prediction:   { type: String, enum: ["REAL", "FAKE"], required: true },
  confidence:   { type: Number, required: true, min: 0, max: 100 },
  fakeScore:    { type: Number },
  realScore:    { type: Number },
  wordCount:    { type: Number },

  // URL detection fields
  source:       { type: String, default: "manual" },  // "manual" | "url"
  sourceUrl:    { type: String, default: null },
  articleTitle: { type: String, default: null },
  sourceDomain: { type: String, default: null },

  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model("Detection", detectionSchema);