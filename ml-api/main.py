"""
Flask ML API — Fake News Detection
Endpoints:
  GET  /             health check
  POST /predict      predict from raw text
  POST /predict-url  scrape URL + predict
  GET  /scan         fetch RSS feeds + predict all headlines
Run: python main.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import re
import numpy as np
from scipy.sparse import hstack, csr_matrix

from features import LinguisticFeatureExtractor
from scraper import scrape_article
from rss_scanner import fetch_all_feeds

app = Flask(__name__)
CORS(app)

MODEL_PATH = "models/fake_news_model.pkl"
model_data = None


def load_model():
    global model_data
    if os.path.exists(MODEL_PATH):
        model_data = joblib.load(MODEL_PATH)
        print("✅ Model loaded successfully")
    else:
        print("⚠️  Model not found. Run: python train_model.py")


def clean_text(text):
    text = str(text)
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s!?]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.lower()


SENSATIONAL = [
    "breaking", "shocking", "bombshell", "exposed", "urgent", "secret",
    "conspiracy", "censored", "banned", "whistleblower", "elite", "hidden",
    "suppressed", "silenced", "cover-up", "share before deleted", "overnight",
    "doubles", "instantly", "miraculous", "unnamed", "anonymous source",
    "mainstream media refuses", "big pharma", "deep state", "wake up",
    "they dont want", "forward this"
]

CREDIBLE = [
    "according to", "published in", "peer-reviewed", "study found",
    "researchers say", "data shows", "evidence suggests", "confirmed by",
    "official statement", "journal of", "university", "clinical trial",
    "statistically significant", "however", "experts note", "authorities confirmed",
    "cited", "analysis of", "survey of", "based on data", "participants"
]


def get_signals(text):
    tl = text.lower()
    signals = []
    excl = text.count("!")
    caps_words = sum(1 for w in text.split() if w.isupper() and len(w) > 2)
    found_sens = [p for p in SENSATIONAL if p in tl]
    found_cred = [p for p in CREDIBLE if p in tl]
    if excl > 1:
        signals.append(f"⚠ Excessive exclamation marks ({excl})")
    if caps_words > 2:
        signals.append(f"⚠ Multiple ALL-CAPS words ({caps_words})")
    if found_sens:
        signals.append(f"⚠ Sensational language: {', '.join(found_sens[:3])}")
    if "unnamed" in tl or "anonymous" in tl:
        signals.append("⚠ Unnamed or anonymous sources")
    if found_cred:
        signals.append(f"✅ Credibility markers: {', '.join(found_cred[:2])}")
    return signals


def run_prediction(text):
    cleaned = clean_text(text)
    clf        = model_data["clf"]
    tfidf      = model_data["tfidf"]
    tfidf_char = model_data["tfidf_char"]
    ling       = model_data["ling"]

    feat = hstack([
        tfidf.transform([cleaned]),
        tfidf_char.transform([cleaned]),
        csr_matrix(ling.transform([cleaned]))
    ])
    probs      = clf.predict_proba(feat)[0]
    real_score = round(float(probs[0]) * 100, 2)
    fake_score = round(float(probs[1]) * 100, 2)
    prediction = "FAKE" if fake_score > real_score else "REAL"

    return {
        "prediction": prediction,
        "confidence": round(max(real_score, fake_score), 2),
        "real_score": real_score,
        "fake_score": fake_score,
        "word_count": len(text.strip().split()),
        "signals":    get_signals(text),
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "model_loaded": model_data is not None,
        "message": "Fake News Detection ML API"
    })


@app.route("/predict", methods=["POST"])
def predict():
    if model_data is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "text field required"}), 400
    text = data["text"]
    if len(text.strip()) < 10:
        return jsonify({"error": "Text too short"}), 400
    return jsonify(run_prediction(text))


@app.route("/predict-url", methods=["POST"])
def predict_url():
    if model_data is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "url field required"}), 400

    url = data["url"].strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    scraped = scrape_article(url)
    if scraped.get("error"):
        return jsonify({"error": scraped["error"]}), 422

    result = run_prediction(scraped["text"])

    return jsonify({
        **result,
        "title":          scraped["title"],
        "source":         scraped["source"],
        "url":            url,
        "extracted_text": scraped["text"][:500] + "..." if len(scraped["text"]) > 500 else scraped["text"],
        "word_count":     scraped["word_count"],
    })


@app.route("/scan", methods=["GET"])
def scan():
    """
    Fetch all RSS feeds, run ML prediction on each headline,
    return scored results sorted by fake_score descending.

    Query params:
      category: "India" | "World" | "all" (default: "all")
      limit:    max articles to return (default: 40)
    """
    if model_data is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    category = request.args.get("category", "all")
    limit    = int(request.args.get("limit", 40))

    # Fetch all RSS articles
    articles = fetch_all_feeds(max_per_feed=6)

    if not articles:
        return jsonify({"error": "Could not fetch any RSS feeds. Check internet connection."}), 503

    # Filter by category
    if category != "all":
        articles = [a for a in articles if a["category"] == category]

    # Run prediction on each
    results = []
    for article in articles:
        try:
            pred = run_prediction(article["text"])
            results.append({
                "title":      article["title"],
                "summary":    article["summary"],
                "link":       article["link"],
                "source":     article["source"],
                "logo":       article["logo"],
                "category":   article["category"],
                "published":  article["published"],
                "prediction": pred["prediction"],
                "confidence": pred["confidence"],
                "fake_score": pred["fake_score"],
                "real_score": pred["real_score"],
                "signals":    pred["signals"],
            })
        except Exception as e:
            print(f"Prediction error: {e}")
            continue

    # Sort — most suspicious first
    results.sort(key=lambda x: x["fake_score"], reverse=True)
    results = results[:limit]

    # Summary stats
    total      = len(results)
    fake_count = sum(1 for r in results if r["prediction"] == "FAKE")
    real_count = total - fake_count
    avg_conf   = round(sum(r["confidence"] for r in results) / total, 1) if total else 0

    return jsonify({
        "articles":   results,
        "total":      total,
        "fake_count": fake_count,
        "real_count": real_count,
        "avg_confidence": avg_conf,
        "scanned_at": __import__("datetime").datetime.utcnow().strftime("%d %b %Y, %I:%M %p UTC"),
    })


if __name__ == "__main__":
    load_model()
    app.run(host="0.0.0.0", port=8000, debug=True)