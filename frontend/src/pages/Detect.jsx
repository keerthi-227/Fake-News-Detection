import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ScanSearch, AlertTriangle, CheckCircle,
  Trash2, Copy, Link2, FileText, Globe,
  ExternalLink, ChevronDown, ChevronUp
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";

const SAMPLE_FAKE = `SHOCKING BOMBSHELL: Secret government scientists have CONFIRMED that 5G towers are being used to control human behavior!! This is the truth they don't want you to know. Share this before it gets DELETED! Elite globalists are hiding this. WAKE UP SHEEPLE!`;
const SAMPLE_REAL = `Scientists at Johns Hopkins University have published new research indicating that regular moderate exercise may help reduce the risk of cardiovascular disease by up to 30 percent. The peer-reviewed study analyzed data from over 50,000 participants over a 10-year period.`;

export default function Detect() {
  const [tab, setTab]               = useState("text");
  const [text, setText]             = useState("");
  const [url, setUrl]               = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [showExtracted, setShowExtracted] = useState(false);

  // ── Text detection ──────────────────────────────────────────────────────
  const handleDetectText = async () => {
    if (!text.trim() || text.trim().length < 10)
      return toast.error("Enter at least 10 characters");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/detect", { text });
      setResult({ ...res.data, mode: "text" });
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Detection failed. Is the ML API running?");
    } finally {
      setLoading(false);
    }
  };

  // ── URL detection ───────────────────────────────────────────────────────
  const handleDetectUrl = async () => {
    if (!url.trim()) return toast.error("Enter a URL");
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/detect/url", { url });
      setResult({ ...res.data, mode: "url" });
      toast.success("Article analyzed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "URL detection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setUrl("");
    setResult(null);
    setShowExtracted(false);
  };

  const isFake = result?.prediction === "FAKE";

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 820 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="section-title">News Detector</h1>
          <p className="section-sub">Analyze text directly or paste a news article URL</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "var(--bg3)", borderRadius: 12,
          padding: 4, width: "fit-content"
        }}>
          {[
            { id: "text", label: "Paste Text", icon: <FileText size={15} /> },
            { id: "url",  label: "From URL",   icon: <Globe size={15} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setResult(null); }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 9, border: "none",
                cursor: "pointer", fontSize: "0.88rem",
                fontFamily: "var(--font-display)", fontWeight: 600,
                transition: "all 0.15s",
                background: tab === t.id ? "var(--accent)" : "transparent",
                color:      tab === t.id ? "#fff" : "var(--muted)",
                boxShadow:  tab === t.id ? "0 0 16px var(--accent-glow)" : "none",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Input card */}
        <div className="card" style={{ marginBottom: 24 }}>

          {/* ── TEXT TAB ── */}
          {tab === "text" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <label className="label" style={{ margin: 0 }}>Article / Text</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                    onClick={() => { setText(SAMPLE_FAKE); setResult(null); }}>
                    Fake Sample
                  </button>
                  <button className="btn btn-ghost" style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                    onClick={() => { setText(SAMPLE_REAL); setResult(null); }}>
                    Real Sample
                  </button>
                </div>
              </div>

              <textarea
                className="input"
                style={{ minHeight: 200 }}
                placeholder="Paste your news article, headline, or social media post here..."
                value={text}
                onChange={e => { setText(e.target.value); setResult(null); }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                  {text.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  {text && (
                    <button className="btn btn-ghost" style={{ padding: "10px 16px" }} onClick={handleClear}>
                      <Trash2 size={14} /> Clear
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={handleDetectText}
                    disabled={loading || !text.trim()} style={{ padding: "10px 24px" }}>
                    {loading
                      ? <><LoadingSpinner size={16} /> Analyzing...</>
                      : <><ScanSearch size={16} /> Analyze</>}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── URL TAB ── */}
          {tab === "url" && (
            <>
              <label className="label">News Article URL</label>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 14, lineHeight: 1.6 }}>
                Paste any news article link. We'll fetch and analyze the article text automatically.
              </p>

              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", left: 14, top: "50%",
                  transform: "translateY(-50%)", color: "var(--muted)",
                  display: "flex", alignItems: "center", pointerEvents: "none"
                }}>
                  <Link2 size={16} />
                </div>
                <input
                  className="input"
                  style={{ paddingLeft: 42 }}
                  type="url"
                  placeholder="https://news.example.com/article..."
                  value={url}
                  onChange={e => { setUrl(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === "Enter" && !loading && url.trim() && handleDetectUrl()}
                />
              </div>

              <p style={{ color: "var(--muted)", fontSize: "0.78rem", marginTop: 10 }}>
                Works with BBC, Reuters, The Hindu, NDTV, Times of India, and most news sites.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, gap: 10 }}>
                {url && (
                  <button className="btn btn-ghost" style={{ padding: "10px 16px" }} onClick={handleClear}>
                    <Trash2 size={14} /> Clear
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleDetectUrl}
                  disabled={loading || !url.trim()} style={{ padding: "10px 28px" }}>
                  {loading
                    ? <><LoadingSpinner size={16} /> Fetching & Analyzing...</>
                    : <><Globe size={16} /> Analyze URL</>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="card fade-in" style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ marginBottom: 20 }}>
              <LoadingSpinner size={44} color="var(--accent)" />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: 6 }}>
              {tab === "url" ? "Fetching article & analyzing..." : "Analyzing content..."}
            </p>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              {tab === "url"
                ? "Scraping article · Cleaning text · Running ML pipeline"
                : "Running ML pipeline · Extracting features · Computing confidence"}
            </p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="fade-in">

            {/* Article info strip (URL mode only) */}
            {result.mode === "url" && result.title && (
              <div className="card" style={{ marginBottom: 16, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
                      Article Detected
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 6, lineHeight: 1.4 }}>
                      {result.title}
                    </p>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>🌐 {result.source}</span>
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>📝 {result.wordCount} words</span>
                    </div>
                  </div>
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost" style={{ padding: "8px 14px", fontSize: "0.8rem", flexShrink: 0 }}>
                    <ExternalLink size={13} /> Open
                  </a>
                </div>

                {/* Extracted text toggle */}
                {result.extractedText && (
                  <>
                    <button
                      onClick={() => setShowExtracted(v => !v)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--muted)", fontSize: "0.8rem", marginTop: 12, padding: 0
                      }}>
                      {showExtracted ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {showExtracted ? "Hide" : "Show"} extracted text preview
                    </button>
                    {showExtracted && (
                      <div style={{
                        marginTop: 10, padding: "12px 14px",
                        background: "var(--bg3)", borderRadius: 8,
                        fontSize: "0.83rem", color: "var(--muted)",
                        lineHeight: 1.7, maxHeight: 180, overflowY: "auto",
                        border: "1px solid var(--border)"
                      }}>
                        {result.extractedText}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Verdict card */}
            <div className="card" style={{
              border: `1px solid ${isFake ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
              background: isFake
                ? "linear-gradient(135deg, rgba(239,68,68,0.06), var(--bg2))"
                : "linear-gradient(135deg, rgba(34,197,94,0.06), var(--bg2))",
              marginBottom: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
                  background: isFake ? "var(--fake-glow)" : "var(--real-glow)",
                  border: `2px solid ${isFake ? "var(--fake)" : "var(--real)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isFake
                    ? <AlertTriangle size={28} color="var(--fake)" />
                    : <CheckCircle size={28} color="var(--real)" />}
                </div>

                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>
                    Verdict
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: isFake ? "var(--fake)" : "var(--real)", lineHeight: 1 }}>
                    {isFake ? "⚠ Likely Fake" : "✓ Likely Real"}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 4 }}>
                    {result.confidence}% confidence
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ width: 150 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: 6 }}>
                    <span>Real</span><span>Fake</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${result.fakeScore}%`,
                      background: "linear-gradient(90deg, #22c55e, #ef4444)", borderRadius: 4
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginTop: 4 }}>
                    <span style={{ color: "var(--real)" }}>{result.realScore}%</span>
                    <span style={{ color: "var(--fake)" }}>{result.fakeScore}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scores + Signals */}
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div className="card">
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
                  Score Breakdown
                </h4>
                {[
                  { label: "Real News Score", value: result.realScore,  color: "var(--real)"   },
                  { label: "Fake News Score", value: result.fakeScore,  color: "var(--fake)"   },
                  { label: "Confidence",      value: result.confidence, color: "var(--accent)" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 5 }}>
                      <span style={{ color: "var(--muted)" }}>{label}</span>
                      <span style={{ color, fontWeight: 600, fontFamily: "var(--font-display)" }}>{value}%</span>
                    </div>
                    <div style={{ height: 6, background: "var(--bg3)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", marginBottom: 16 }}>
                  🔍 Analysis Signals
                </h4>
                {result.signals && result.signals.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.signals.map((s, i) => (
                      <div key={i} style={{
                        fontSize: "0.82rem", lineHeight: 1.5,
                        padding: "6px 10px", borderRadius: 7,
                        background: s.startsWith("✅") ? "var(--real-glow)"
                          : s.startsWith("ℹ") ? "var(--accent-glow)" : "var(--fake-glow)",
                        color: s.startsWith("✅") ? "var(--real)"
                          : s.startsWith("ℹ") ? "var(--accent)" : "var(--fake)",
                      }}>
                        {s}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>No specific signals detected.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" style={{ fontSize: "0.85rem" }}
                onClick={() => {
                  const txt = `TruthLens Result\nVerdict: ${result.prediction}\nConfidence: ${result.confidence}%\nReal: ${result.realScore}% | Fake: ${result.fakeScore}%${result.url ? `\nURL: ${result.url}` : ""}`;
                  navigator.clipboard.writeText(txt);
                  toast.success("Copied!");
                }}>
                <Copy size={14} /> Copy Result
              </button>
              <button className="btn btn-ghost" style={{ fontSize: "0.85rem" }} onClick={handleClear}>
                <Trash2 size={14} /> New Analysis
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}