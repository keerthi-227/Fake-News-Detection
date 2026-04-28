import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Radio, RefreshCw, AlertTriangle, CheckCircle,
  ExternalLink, Filter, Clock, TrendingUp,
  ShieldAlert, ShieldCheck, Wifi
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const CATEGORIES = ["all", "India", "World"];
const AUTO_REFRESH_SECS = 120;  // auto refresh every 2 minutes

export default function LiveScanner() {
  const [articles, setArticles]     = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [category, setCategory]     = useState("all");
  const [filter, setFilter]         = useState("all");   // "all" | "FAKE" | "REAL"
  const [lastScanned, setLastScanned] = useState(null);
  const [countdown, setCountdown]   = useState(AUTO_REFRESH_SECS);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef  = useRef(null);
  const countRef  = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchScan = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/scan", { params: { category, limit: 40 } });
      setArticles(res.data.articles);
      setStats({
        total:      res.data.total,
        fakeCount:  res.data.fake_count,
        realCount:  res.data.real_count,
        avgConf:    res.data.avg_confidence,
        scannedAt:  res.data.scanned_at,
      });
      setLastScanned(new Date());
      setCountdown(AUTO_REFRESH_SECS);
      if (!silent) toast.success(`Scanned ${res.data.total} articles!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Scan failed. Is the ML API running?");
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-refresh ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => fetchScan(true), AUTO_REFRESH_SECS * 1000);
      countRef.current = setInterval(() => {
        setCountdown(c => (c <= 1 ? AUTO_REFRESH_SECS : c - 1));
      }, 1000);
    }
    return () => {
      clearInterval(timerRef.current);
      clearInterval(countRef.current);
    };
  }, [autoRefresh, category]);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => { fetchScan(); }, [category]);

  // ── Filtered articles ────────────────────────────────────────────────────
  const displayed = articles.filter(a =>
    filter === "all" ? true : a.prediction === filter
  );

  const fakePercent = stats
    ? Math.round((stats.fakeCount / stats.total) * 100)
    : 0;

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: autoRefresh ? "var(--real)" : "var(--muted)",
                boxShadow: autoRefresh ? "0 0 8px var(--real-glow)" : "none",
                animation: autoRefresh ? "pulse 2s infinite" : "none"
              }} />
              <h1 className="section-title" style={{ margin: 0 }}>Live News Scanner</h1>
            </div>
            <p className="section-sub" style={{ margin: 0 }}>
              Real-time fake news detection across {CATEGORIES.length - 1} categories
              {lastScanned && (
                <span style={{ marginLeft: 10, color: "var(--muted)", fontSize: "0.8rem" }}>
                  · Last scan: {lastScanned.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(v => !v)}
              className={`btn ${autoRefresh ? "btn-primary" : "btn-ghost"}`}
              style={{ padding: "9px 16px", fontSize: "0.82rem" }}>
              <Wifi size={14} />
              {autoRefresh ? `Auto (${countdown}s)` : "Auto Off"}
            </button>

            {/* Manual refresh */}
            <button
              onClick={() => fetchScan()}
              className="btn btn-ghost"
              disabled={loading}
              style={{ padding: "9px 16px", fontSize: "0.82rem" }}>
              <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: "Articles Scanned",  value: stats.total,      icon: <Radio size={18} />,      color: "#3b82f6" },
              { label: "Likely Fake",        value: stats.fakeCount,  icon: <ShieldAlert size={18} />, color: "#ef4444" },
              { label: "Likely Real",        value: stats.realCount,  icon: <ShieldCheck size={18} />, color: "#22c55e" },
              { label: "Avg Confidence",     value: `${stats.avgConf}%`, icon: <TrendingUp size={18} />, color: "#f59e0b" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: "0.72rem", fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                      {label}
                    </div>
                    <div className="stat-num">{value}</div>
                  </div>
                  <div style={{ color, background: `${color}18`, padding: 10, borderRadius: 10 }}>
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fake % bar */}
        {stats && (
          <div className="card" style={{ marginBottom: 24, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.88rem" }}>
                Fake news ratio in current headlines
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", color: fakePercent > 30 ? "var(--fake)" : "var(--real)" }}>
                {fakePercent}%
              </span>
            </div>
            <div style={{ height: 10, background: "var(--bg3)", borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${fakePercent}%`,
                background: fakePercent > 40
                  ? "var(--fake)"
                  : fakePercent > 20
                    ? "var(--warn)"
                    : "var(--real)",
                borderRadius: 5,
                transition: "width 0.8s ease"
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginTop: 6 }}>
              <span>0% fake</span>
              <span>scanned at {stats.scannedAt}</span>
              <span>100% fake</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {/* Category filter */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg3)", padding: 4, borderRadius: 10 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: "0.82rem", fontFamily: "var(--font-display)", fontWeight: 600,
                background: category === c ? "var(--accent)" : "transparent",
                color: category === c ? "#fff" : "var(--muted)",
                transition: "all 0.15s",
              }}>
                {c === "all" ? "All Sources" : c}
              </button>
            ))}
          </div>

          {/* Verdict filter */}
          <div style={{ display: "flex", gap: 4, background: "var(--bg3)", padding: 4, borderRadius: 10 }}>
            {[
              { id: "all",  label: "All" },
              { id: "FAKE", label: "Fake" },
              { id: "REAL", label: "Real" },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: "0.82rem", fontFamily: "var(--font-display)", fontWeight: 600,
                background: filter === f.id
                  ? f.id === "FAKE" ? "var(--fake)" : f.id === "REAL" ? "var(--real)" : "var(--accent)"
                  : "transparent",
                color: filter === f.id ? "#fff" : "var(--muted)",
                transition: "all 0.15s",
              }}>
                {f.label}
              </button>
            ))}
          </div>

          <span style={{ color: "var(--muted)", fontSize: "0.82rem", marginLeft: "auto" }}>
            {displayed.length} articles shown
          </span>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="card fade-in" style={{ textAlign: "center", padding: "56px 24px" }}>
            <LoadingSpinner size={48} color="var(--accent)" />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginTop: 20, marginBottom: 6 }}>
              Scanning live news feeds...
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              Fetching RSS · Running ML on each headline · Sorting by suspicion
            </p>
          </div>
        )}

        {/* Articles grid */}
        {!loading && displayed.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayed.map((article, i) => (
              <ArticleCard key={i} article={article} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && displayed.length === 0 && articles.length > 0 && (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <Filter size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 8 }}>
              No {filter === "FAKE" ? "fake" : "real"} articles in current scan
            </p>
            <button className="btn btn-ghost" onClick={() => setFilter("all")}>
              Show all articles
            </button>
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
            <Radio size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 8 }}>
              Click Refresh to scan live news
            </p>
            <button className="btn btn-primary" onClick={() => fetchScan()}>
              Start Scanning
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Article Card Component ────────────────────────────────────────────────────
function ArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false);
  const isFake = article.prediction === "FAKE";

  return (
    <div
      className="card"
      style={{
        padding: "16px 20px",
        borderLeft: `3px solid ${isFake ? "var(--fake)" : "var(--real)"}`,
        borderRadius: "0 var(--radius-lg) var(--radius-lg) 0",
        transition: "border-color 0.2s",
        cursor: "pointer",
      }}
      onClick={() => setExpanded(v => !v)}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>

        {/* Source badge */}
        <div style={{
          flexShrink: 0, width: 44, height: 44, borderRadius: 10,
          background: "var(--bg3)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", fontWeight: 700, fontFamily: "var(--font-display)",
          color: "var(--muted)", textAlign: "center", lineHeight: 1.2, padding: 4
        }}>
          {article.logo}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span className={`badge badge-${article.prediction.toLowerCase()}`}>
              {isFake ? "⚠ Fake" : "✓ Real"}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
              {article.source}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>·</span>
            <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
              <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
              {article.published}
            </span>
            <span style={{
              marginLeft: "auto", fontFamily: "var(--font-display)",
              fontWeight: 700, fontSize: "0.82rem",
              color: isFake ? "var(--fake)" : "var(--real)"
            }}>
              {article.confidence}%
            </span>
          </div>

          {/* Title */}
          <p style={{ fontSize: "0.92rem", fontWeight: 600, lineHeight: 1.5, marginBottom: 6, color: "var(--text)" }}>
            {article.title}
          </p>

          {/* Confidence bar */}
          <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
            <div style={{
              height: "100%",
              width: `${article.fake_score}%`,
              background: `linear-gradient(90deg, #22c55e, #ef4444)`,
              borderRadius: 2
            }} />
          </div>

          {/* Expanded: summary + signals */}
          {expanded && (
            <div style={{ marginTop: 10, animation: "fadeIn 0.2s ease" }}>
              {article.summary && (
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6, marginBottom: 10 }}>
                  {article.summary}
                </p>
              )}

              {/* Score row */}
              <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--real)" }}>
                  Real: {article.real_score}%
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--fake)" }}>
                  Fake: {article.fake_score}%
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
                  Confidence: {article.confidence}%
                </span>
              </div>

              {/* Signals */}
              {article.signals && article.signals.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {article.signals.map((s, i) => (
                    <div key={i} style={{
                      fontSize: "0.78rem", padding: "4px 8px", borderRadius: 6, lineHeight: 1.4,
                      background: s.startsWith("✅") ? "var(--real-glow)" : s.startsWith("ℹ") ? "var(--accent-glow)" : "var(--fake-glow)",
                      color: s.startsWith("✅") ? "var(--real)" : s.startsWith("ℹ") ? "var(--accent)" : "var(--fake)",
                    }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Link */}
              {article.link && (
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ fontSize: "0.8rem", padding: "7px 14px", display: "inline-flex" }}
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink size={13} /> Read Original Article
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}