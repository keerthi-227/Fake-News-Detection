"""
RSS News Scanner
Fetches headlines from real Indian + global news RSS feeds,
runs each through the ML model, and returns scored results.

Used by the /scan endpoint in main.py
"""

import re
import time
import feedparser
import requests
from datetime import datetime, timezone

# ── RSS Feed Sources ──────────────────────────────────────────────────────────
RSS_FEEDS = [
    {
        "name": "NDTV India",
        "url": "https://feeds.feedburner.com/ndtvnews-india-news",
        "category": "India",
        "logo": "NDTV"
    },
    {
        "name": "NDTV World",
        "url": "https://feeds.feedburner.com/ndtvnews-world-news",
        "category": "World",
        "logo": "NDTV"
    },
    {
        "name": "Times of India",
        "url": "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "category": "India",
        "logo": "TOI"
    },
    {
        "name": "The Hindu",
        "url": "https://www.thehindu.com/news/feeder/default.rss",
        "category": "India",
        "logo": "TH"
    },
    {
        "name": "BBC News",
        "url": "http://feeds.bbci.co.uk/news/rss.xml",
        "category": "World",
        "logo": "BBC"
    },
    {
        "name": "Reuters",
        "url": "https://feeds.reuters.com/reuters/topNews",
        "category": "World",
        "logo": "Reuters"
    },
    {
        "name": "India Today",
        "url": "https://www.indiatoday.in/rss/home",
        "category": "India",
        "logo": "IT"
    },
    {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "category": "World",
        "logo": "AJ"
    },
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def clean_html(text):
    """Strip HTML tags from feed descriptions."""
    text = re.sub(r"<[^>]+>", " ", str(text))
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_feed(feed_info, max_items=6):
    """Fetch a single RSS feed, return list of article dicts."""
    articles = []
    try:
        resp = requests.get(feed_info["url"], headers=HEADERS, timeout=8)
        parsed = feedparser.parse(resp.content)

        for entry in parsed.entries[:max_items]:
            title = clean_html(entry.get("title", "")).strip()
            summary = clean_html(entry.get("summary", entry.get("description", ""))).strip()
            link = entry.get("link", "")

            # Parse publish date
            published = "Unknown"
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                try:
                    dt = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                    published = dt.strftime("%d %b %Y, %I:%M %p")
                except Exception:
                    published = "Unknown"

            # Use title + summary as text for prediction
            text = title
            if summary and summary != title:
                text = f"{title}. {summary[:300]}"

            if len(title) > 10:
                articles.append({
                    "title":    title,
                    "summary":  summary[:200] if summary else "",
                    "link":     link,
                    "source":   feed_info["name"],
                    "logo":     feed_info["logo"],
                    "category": feed_info["category"],
                    "published": published,
                    "text":     text,
                })
    except Exception as e:
        print(f"⚠ Feed error [{feed_info['name']}]: {e}")

    return articles


def fetch_all_feeds(max_per_feed=6):
    """
    Fetch all RSS feeds concurrently using threads.
    Returns flat list of article dicts (without predictions yet).
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed

    all_articles = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(fetch_feed, feed, max_per_feed): feed
            for feed in RSS_FEEDS
        }
        for future in as_completed(futures):
            try:
                articles = future.result()
                all_articles.extend(articles)
            except Exception as e:
                print(f"⚠ Thread error: {e}")

    return all_articles