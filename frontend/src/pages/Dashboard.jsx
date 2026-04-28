import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ScanSearch, TrendingUp, ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/history/stats'), api.get('/history?limit=5')])
      .then(([s, h]) => { setStats(s.data); setRecent(h.data.detections); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner size={40} color="var(--accent)" />
    </div>
  );

  const pieData = stats ? [
    { name: 'Real', value: stats.realCount, color: '#22c55e' },
    { name: 'Fake', value: stats.fakeCount, color: '#ef4444' }
  ] : [];

  const barData = stats?.recentActivity?.map(d => ({
    date: d._id.slice(5), checks: d.count
  })) || [];

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: 36 }}>
          <h1 className="section-title">Hey, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="section-sub">Here's your fake news detection overview</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Total Checks', value: stats?.total || 0, icon: <Activity size={18} />, color: '#3b82f6' },
            { label: 'Fake Detected', value: stats?.fakeCount || 0, icon: <ShieldAlert size={18} />, color: '#ef4444' },
            { label: 'Real Verified', value: stats?.realCount || 0, icon: <ShieldCheck size={18} />, color: '#22c55e' },
            { label: 'Avg Confidence', value: `${stats?.avgConfidence || 0}%`, icon: <TrendingUp size={18} />, color: '#f59e0b' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.78rem', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                  <div className="stat-num">{value}</div>
                </div>
                <div style={{ color, background: `${color}18`, padding: 10, borderRadius: 10 }}>{icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: 28 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Real vs Fake Ratio</h3>
            {stats?.total > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No data yet</div>
            )}
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 20 }}>Activity (Last 7 Days)</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8 }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="checks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>No activity yet</div>
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Recent Detections</h3>
            <Link to="/history" style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <ScanSearch size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>No detections yet</p>
              <Link to="/detect" className="btn btn-primary" style={{ marginTop: 16 }}>Run First Detection</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recent.map(d => (
                <div key={d._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <span className={`badge badge-${d.prediction.toLowerCase()}`}>{d.prediction}</span>
                  <p style={{ flex: 1, fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.inputText}</p>
                  <span style={{ color: 'var(--muted)', fontSize: '0.78rem', flexShrink: 0 }}>{d.confidence}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}