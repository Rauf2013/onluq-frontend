import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Brain, Search, Plus, ThumbsUp, Eye, Tag, User, Award, Lock } from 'lucide-react';
import { CATEGORY_DATA } from '../constants/categories';
import { levelColor } from '../constants/seller';

function BrainNotes() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [myLevel, setMyLevel] = useState('Yeni Satıcı');

  const fetchNotes = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { navigate('/giris'); return; }
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      const r = await fetch(`${API_URL}/api/brain-notes?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) { setItems(d.items); setTotal(d.total); setMyLevel(d.myLevel || 'Yeni Satıcı'); }
      else toast.error(d.message || 'Yüklənmədi');
    } catch { toast.error('Bağlantı xətası'); }
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [page, q, category]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); setQ(searchInput.trim()); };

  return (
    <div className="main-content brain-notes-page" style={{ maxWidth: 1100, margin: '30px auto', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: 20, padding: '36px 30px', color: 'white', marginBottom: 24, boxShadow: '0 10px 30px rgba(99,102,241,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: 12, display: 'inline-flex' }}>
            <Brain size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Beyin Yedəyi</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 14 }}>Frilanserlərin kolektiv bilik bazası — bir dəfə həll edilmiş problemə ikinci dəfə vaxt itirmə.</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, opacity: 0.9 }}>Sənin səviyyən: <strong>{myLevel}</strong></span>
          <Link to="/beyin-yedeyi/yeni" style={{ background: 'white', color: '#6366f1', padding: '10px 18px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Plus size={16} /> Yeni yedək yaz
          </Link>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <form onSubmit={onSearch} style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Açar söz ilə axtar..."
            className="auth-input" style={{ width: '100%', paddingLeft: 40, marginBottom: 0 }} />
        </form>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="auth-input" style={{ minWidth: 200, marginBottom: 0 }}>
          <option value="">Bütün kateqoriyalar</option>
          {CATEGORY_DATA.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-tertiary)' }}>Yüklənir...</div>
      ) : items.length === 0 ? (
        <div className="no-results-box" style={{ padding: 60, textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 16, border: '1px dashed var(--border-strong)', color: 'var(--text-tertiary)' }}>
          <Brain size={40} style={{ marginBottom: 14, opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 15 }}>Hələ heç bir beyin yedəyi yoxdur. İlk yazan sən ol!</p>
          <Link to="/beyin-yedeyi/yeni" style={{ display: 'inline-block', marginTop: 16, background: '#6366f1', color: 'white', padding: '10px 18px', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>+ Yeni yedək</Link>
        </div>
      ) : (
        <>
          <div className="brain-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {items.map((n) => {
              const lc = levelColor(n.requiredLevel);
              return (
                <Link key={n._id} to={`/beyin-yedeyi/${n._id}`} className="brain-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 10, transition: '0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span style={{ background: 'var(--bg-muted)', padding: '3px 9px', borderRadius: 999, fontWeight: 600 }}>{n.category}</span>
                    {n.requiredLevel !== 'Yeni Satıcı' && (
                      <span style={{ background: lc.bg, color: lc.fg, padding: '3px 9px', borderRadius: 999, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Lock size={10} /> {n.requiredLevel}
                      </span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.4 }}>{n.title}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.challenge}</p>
                  {n.tags && n.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {n.tags.slice(0, 4).map((t) => (
                        <span key={t} style={{ fontSize: 11, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}><Tag size={9} style={{ verticalAlign: 'middle' }} /> {t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-soft)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {n.author?.avatar ? <img src={n.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={11} color="#64748b" />}
                      </span>
                      {n.author?.fullName || '—'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><ThumbsUp size={12} /> {n.helpfulCount || 0}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Eye size={12} /> {n.views || 0}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          {total > 12 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} className="btn-modal-cancel" style={{ padding: '8px 14px', opacity: page <= 1 ? 0.4 : 1 }}>‹ Əvvəlki</button>
              <span style={{ padding: '8px 16px', color: 'var(--text-tertiary)' }}>Səh. {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 12 >= total} className="btn-modal-cancel" style={{ padding: '8px 14px', opacity: page * 12 >= total ? 0.4 : 1 }}>Növbəti ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BrainNotes;
