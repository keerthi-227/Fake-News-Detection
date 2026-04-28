import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanSearch, ShieldCheck, BarChart3, Zap, Brain, Globe, History } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: '88vh', display: 'flex', alignItems: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 400,
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px', pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
          <div className="badge badge-info fade-in" style={{ margin: '0 auto 28px' }}>
            <Brain size={12} /> ML-Powered • MERN Stack
          </div>

          <h1 className="fade-in" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 6vw, 5rem)',
            fontWeight: 800, lineHeight: 1.05, marginBottom: 24
          }}>
            Stop Misinformation<br />
            <span style={{
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Dead in Its Tracks.
            </span>
          </h1>

          <p className="fade-in" style={{
            color: 'var(--muted)', fontSize: '1.15rem',
            maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7
          }}>
            TruthLens uses machine learning to detect fake news with high accuracy.
            Paste any article or headline and get an instant, explainable verdict.
          </p>

          <div className="fade-in" style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Link to={user ? '/detect' : '/register'} className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '14px 32px' }}>
              <ScanSearch size={18} /> Start Detecting
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-ghost"
                style={{ fontSize: '1rem', padding: '14px 28px' }}>
                Sign In
              </Link>
            )}
          </div>

          <div className="fade-in" style={{
            display: 'flex', gap: 48, justifyContent: 'center', marginTop: 64
          }}>
            {[['95%+', 'Accuracy'], ['<1s', 'Analysis Time'], ['1 Models', 'ML Algorithms']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>{num}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 0', background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 12 }}>
              Why TruthLens?
            </h2>
            <p style={{ color: 'var(--muted)' }}>Built with modern ML techniques and a full-stack MERN architecture</p>
          </div>

          <div className="grid-3">
            {[
              { icon: <Zap size={22} color="#3b82f6" />, title: 'Instant Analysis', desc: 'Real-time predictions with TF-IDF vectorization and Logistic Regression — results in under a second.' },
              { icon: <ShieldCheck size={22} color="#22c55e" />, title: 'Explainable AI', desc: 'Not just a verdict — get confidence scores, signal analysis, and reasoning behind every detection.' },
              { icon: <BarChart3 size={22} color="#f59e0b" />, title: 'Personal Dashboard', desc: 'Track your detection history, view real vs fake ratios, and analyze your usage patterns over time.' },
              { icon: <Brain size={22} color="#8b5cf6" />, title: 'ML Pipeline', desc: 'Trained sklearn pipeline with TF-IDF bigrams, sublinear TF scaling, and optimized Logistic Regression.' },
              { icon: <Globe size={22} color="#ec4899" />, title: 'REST API', desc: 'Modular Flask ML API and Express backend — decoupled, scalable, easy to extend.' },
              { icon: <History size={22} color="#06b6d4" />, title: 'Full History', desc: 'Every detection saved with timestamps, confidence, and word count. Delete or review anytime.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--bg3)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 24, padding: '60px 40px'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 16 }}>
              Ready to fight misinformation?
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>
              Create a free account and start detecting fake news instantly.
            </p>
            <Link to={user ? '/detect' : '/register'} className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '14px 36px' }}>
              <ScanSearch size={18} /> {user ? 'Go to Detector' : 'Create Free Account'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}