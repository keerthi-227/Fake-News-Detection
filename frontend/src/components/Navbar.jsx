import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ScanSearch, LogOut, LayoutDashboard, Clock, Scan, Radio } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(8,11,18,0.85)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      height: 64,
    }}>
      <div className="container" style={{
        height: "100%", display: "flex",
        alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text)" }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ScanSearch size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem" }}>
            Truth<span style={{ color: "var(--accent)" }}>Lens</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {user ? (
            <>
              {[
                { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
                { to: "/detect",    label: "Detect",    icon: <Scan size={15} /> },
                { to: "/live",      label: "Live Scan", icon: <Radio size={15} /> },   /* NEW */
                { to: "/history",   label: "History",   icon: <Clock size={15} /> },
              ].map(({ to, label, icon }) => (
                <Link key={to} to={to} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 13px", borderRadius: 8,
                  fontSize: "0.85rem", fontFamily: "var(--font-display)", fontWeight: 600,
                  textDecoration: "none",
                  color: isActive(to) ? "var(--text)" : "var(--muted)",
                  background: isActive(to) ? "rgba(255,255,255,0.06)" : "transparent",
                  transition: "all 0.15s",
                  /* Live Scan gets a subtle pulse dot when active */
                  position: "relative",
                }}>
                  {icon} {label}
                  {to === "/live" && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--real)",
                      boxShadow: "0 0 6px var(--real-glow)",
                      animation: "pulse 2s infinite",
                      flexShrink: 0
                    }} />
                  )}
                </Link>
              ))}

              <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 8px" }} />
              <span style={{ color: "var(--muted)", fontSize: "0.85rem", marginRight: 8 }}>
                {user.name.split(" ")[0]}
              </span>
              <button onClick={handleLogout} className="btn btn-ghost"
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}>
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost"   style={{ padding: "8px 16px", fontSize: "0.85rem" }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>Get Started</Link>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </nav>
  );
}