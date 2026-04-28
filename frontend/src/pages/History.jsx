import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Trash2, ScanSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function History() {
  const [data, setData] = useState({ detections: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/history?page=${p}&limit=10`);
      setData(res.data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/history/${id}`);
      toast.success('Deleted');
      fetchHistory(page);
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 className="section-title">Detection History</h1>
            <p className="section-sub">{data.total} total detections</p>
          </div>
          <Link to="/detect" className="btn btn-primary">
            <ScanSearch size={16} /> New Detection
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <LoadingSpinner size={40} color="var(--accent)" />
          </div>
        ) : data.detections.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <ScanSearch size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>No history yet</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Your detection results will appear here</p>
            <Link to="/detect" className="btn btn-primary">Run First Detection</Link>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 120px 60px', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                {['Text', 'Verdict', 'Confidence', 'Date', ''].map(h => (
                  <div key={h} style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</div>
                ))}
              </div>

              {data.detections.map((d, i) => (
                <div key={d._id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 90px 120px 60px',
                  padding: '16px 20px', alignItems: 'center',
                  borderBottom: i < data.detections.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ fontSize: '0.87rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 16 }}>
                    {d.inputText}
                  </p>
                  <span className={`badge badge-${d.prediction.toLowerCase()}`}>{d.prediction}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{d.confidence}%</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{formatDate(d.createdAt)}</span>
                  <button className="btn btn-danger" style={{ padding: '6px 10px' }}
                    onClick={() => handleDelete(d._id)} disabled={deleting === d._id}>
                    {deleting === d._id
                      ? <LoadingSpinner size={12} color="var(--fake)" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              ))}
            </div>

            {data.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ padding: '8px 14px' }}
                  disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Page {data.page} of {data.pages}</span>
                <button className="btn btn-ghost" style={{ padding: '8px 14px' }}
                  disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}