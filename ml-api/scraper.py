"""
Article scraper v3 — uses newspaper3k as primary extractor
which handles The Hindu, Times of India, NDTV and most Indian news sites.
Falls back to BeautifulSoup if newspaper3k fails.
"""

import re
import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Try importing newspaper3k
try:
    from newspaper import Article
    NEWSPAPER_AVAILABLE = True
except ImportError:
    NEWSPAPER_AVAILABLE = False
    print("⚠️  newspaper3k not installed. Run: pip install newspaper3k")

# ── User agents pool ──────────────────────────────────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]

# ── Domain-specific CSS selectors (fallback) ──────────────────────────────────
DOMAIN_SELECTORS = {
    "thehindu.com": [
        ".article-text",
        ".storyline",
        '[class*="article"]',
        '[class*="story"]',
        "article",
        "main",
        ".contentdata",
        "#content-body-14269002",
    ],
    "ndtv.com": [
        ".content_text",
        ".sp-cn",
        ".article__content",
        '[class*="article"]',
        "article",
        "main",
    ],
    "timesofindia.indiatimes.com": [
        "._s30J",
        ".ga-headlines",
        ".artText",
        '[class*="article"]',
        "article",
        "main",
    ],
    "indiatoday.in": [
        ".story-kicker",
        ".description",
        ".story__content",
        '[class*="story"]',
        "article",
        "main",
    ],
    "hindustantimes.com": [
        ".storyDetails",
        ".story-details",
        '[class*="story"]',
        "article",
        "main",
    ],
    "indianexpress.com": [
        ".full-details",
        "[itemprop='articleBody']",
        ".story_details",
        "article",
        "main",
    ],
    "bbc.com": [
        '[data-component="text-block"]',
        ".story-body",
        "article",
        "main",
    ],
    "aljazeera.com": [
        ".wysiwyg",
        '[class*="article-p-wrapper"]',
        "article",
        "main",
    ],
}

GENERIC_SELECTORS = [
    "[itemprop='articleBody']",
    "[itemprop='text']",
    "article",
    '[class*="article-body"]',
    '[class*="article_body"]',
    '[class*="story-body"]',
    '[class*="post-content"]',
    '[class*="entry-content"]',
    '[class*="content-body"]',
    '[class*="article-content"]',
    "main",
    ".content",
    "#content",
    "#article",
    "#main-content",
]

SKIP_TAGS = {
    "script", "style", "noscript", "nav", "footer",
    "header", "aside", "form", "button", "iframe",
    "figure", "figcaption"
}

SKIP_CLASS_WORDS = [
    "cookie", "subscribe", "newsletter", "advertisement",
    "social", "share", "related", "comment", "sidebar",
    "promo", "banner", "popup", "ad-", "widget", "menu",
    "breadcrumb", "tag", "author-bio", "read-more"
]


def get_domain_key(url):
    netloc = urlparse(url).netloc.replace("www.", "")
    for key in DOMAIN_SELECTORS:
        if key.split(".")[0] in netloc:
            return key
    return netloc


def build_headers(referer="https://www.google.com/"):
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": referer,
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "DNT": "1",
        "Cache-Control": "no-cache",
    }


def clean_text(text):
    text = re.sub(r"\s+", " ", str(text)).strip()
    noise = [
        r"Cookie\s+Policy[^.]*\.",
        r"Privacy\s+Policy[^.]*\.",
        r"Subscribe\s+to[^.]*\.",
        r"Sign\s+up\s+for[^.]*\.",
        r"Newsletter[^.]*\.",
        r"Advertisement\s*",
        r"Also\s+read[^.]*\.",
        r"Click\s+here[^.]*\.",
        r"Read\s+more[^.]*\.",
        r"Follow\s+us\s+on[^.]*\.",
        r"Download\s+the[^.]*app[^.]*\.",
    ]
    for pat in noise:
        text = re.sub(pat, "", text, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", text).strip()


# ── Method 1: newspaper3k ─────────────────────────────────────────────────────
def try_newspaper(url):
    if not NEWSPAPER_AVAILABLE:
        return None
    try:
        article = Article(url, language='en')
        article.config.browser_user_agent = random.choice(USER_AGENTS)
        article.config.request_timeout = 15
        article.config.fetch_images = False
        article.download()
        article.parse()
        text = article.text.strip()
        title = article.title.strip() if article.title else "Article"
        if len(text.split()) >= 50:
            return {"title": title, "text": clean_text(text)}
    except Exception as e:
        print(f"   newspaper3k failed: {e}")
    return None


# ── Method 2: BeautifulSoup with domain selectors ────────────────────────────
def try_beautifulsoup(url):
    domain_key = get_domain_key(url)
    headers = build_headers()
    try:
        resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)

        # Handle common HTTP errors
        if resp.status_code == 403:
            return {"error": f"Access blocked by {domain_key} (403). Please copy the article text and use the Paste Text tab instead."}
        if resp.status_code == 404:
            return {"error": "Article not found (404). The URL may be outdated or incorrect."}
        if resp.status_code == 429:
            return {"error": "Too many requests (429). Please wait a minute and try again."}
        if resp.status_code != 200:
            return {"error": f"Could not access this URL (HTTP {resp.status_code}). Please copy the article text and use the Paste Text tab instead."}

        content_type = resp.headers.get("Content-Type", "")
        if "text/html" not in content_type:
            return {"error": "URL does not point to an HTML page."}

        try:
            soup = BeautifulSoup(resp.text, "lxml")
        except Exception:
            soup = BeautifulSoup(resp.text, "html.parser")

        # Extract title
        og = soup.find("meta", property="og:title")
        if og and og.get("content"):
            title = og["content"].strip()
        elif soup.title and soup.title.string:
            title = soup.title.string.strip()
        else:
            title = "Article"
        title = re.sub(r"\s*[\|\-–—]\s*\S[^$]{0,30}$", "", title).strip()

        # Remove noise tags
        for tag in soup(list(SKIP_TAGS)):
            tag.decompose()

        # Try selectors
        selectors = DOMAIN_SELECTORS.get(domain_key, []) + GENERIC_SELECTORS
        best_text = ""

        for sel in selectors:
            try:
                container = soup.select_one(sel)
                if not container:
                    continue
                # Remove skip-class elements
                for el in container.find_all(True):
                    classes = " ".join(el.get("class", []))
                    if any(w in classes.lower() for w in SKIP_CLASS_WORDS):
                        el.decompose()
                paragraphs = container.find_all("p")
                text = " ".join(p.get_text(separator=" ") for p in paragraphs)
                if len(text.split()) > len(best_text.split()):
                    best_text = text
                if len(best_text.split()) > 120:
                    break
            except Exception:
                continue

        # Fallback: all paragraphs
        if len(best_text.split()) < 50:
            all_p = soup.find_all("p")
            best_text = " ".join(p.get_text(separator=" ") for p in all_p)

        best_text = clean_text(best_text)

        if len(best_text.split()) >= 40:
            return {"title": title, "text": best_text}

    except requests.exceptions.Timeout:
        return {"error": "Request timed out. The website took too long to respond."}
    except requests.exceptions.ConnectionError:
        return {"error": "Could not connect. Check your internet connection."}
    except Exception as e:
        return {"error": f"Scraping failed: {str(e)}"}

    return None


# ── Main scrape function ───────────────────────────────────────────────────────
def scrape_article(url: str) -> dict:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    domain = urlparse(url).netloc.replace("www.", "")
    print(f"🔍 Scraping: {domain}")

    # Method 1: newspaper3k (best for most Indian news sites)
    print("   Trying newspaper3k...")
    result = try_newspaper(url)
    if result and not result.get("error"):
        word_count = len(result["text"].split())
        print(f"   ✅ newspaper3k success — {word_count} words")
        return {
            "title":      result["title"],
            "text":       result["text"],
            "source":     domain,
            "error":      None,
            "word_count": word_count,
        }

    # Method 2: BeautifulSoup fallback
    print("   Trying BeautifulSoup...")
    result = try_beautifulsoup(url)

    if result and result.get("error"):
        return {"error": result["error"]}

    if result and not result.get("error"):
        word_count = len(result["text"].split())
        print(f"   ✅ BeautifulSoup success — {word_count} words")
        return {
            "title":      result["title"],
            "text":       result["text"],
            "source":     domain,
            "error":      None,
            "word_count": word_count,
        }

    # Both methods failed
    return {
        "error": (
            f"Could not extract article text from {domain}. "
            f"This site may require JavaScript to load content. "
            f"Please open the article, select all the text (Ctrl+A), copy it (Ctrl+C), "
            f"then paste it in the 'Paste Text' tab instead."
        )
    }