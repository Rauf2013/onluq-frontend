import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Brain, Search, Plus, ThumbsUp, Eye, Tag, User, Award, Lock, Send, X as XIcon, Bot, AlertTriangle, Trash2 } from 'lucide-react';
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
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQ, setAiQ] = useState('');
  const [aiThread, setAiThread] = useState([]); // [{role, content, related?}]
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRemaining, setAiRemaining] = useState(null);
  const aiBottomRef = useRef(null);

  // Yeni mesaj əlavə olunanda və ya AI cavab gözlədikdə avtomatik aşağı kaydır
  useEffect(() => {
    if (aiOpen && aiBottomRef.current) {
      aiBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [aiThread, aiLoading, aiOpen]);

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

  const askAI = async () => {
    if (!aiQ.trim() || aiLoading) return;
    const userMsg = aiQ.trim();
    setAiThread((t) => [...t, { role: 'user', content: userMsg }]);
    setAiQ('');
    setAiLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const r = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, category: category || undefined }),
      });
      const d = await r.json();
      if (r.ok) {
        setAiThread((t) => [...t, { role: 'ai', content: d.answer, related: d.relatedNotes }]);
        setAiRemaining(d.remaining);
      } else {
        setAiThread((t) => [...t, { role: 'ai', content: d.message || 'Xəta baş verdi', error: true }]);
      }
    } catch {
      setAiThread((t) => [...t, { role: 'ai', content: 'Bağlantı xətası', error: true }]);
    }
    setAiLoading(false);
  };

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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setAiOpen(true)}
              style={{ background: 'rgba(255,255,255,0.16)', color: 'white', padding: '10px 16px', borderRadius: 10, fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, transition: '0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.26)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}>
              <Bot size={16} /> AI-dan soruş
            </button>
            <Link to="/beyin-yedeyi/yeni" style={{ background: 'white', color: '#6366f1', padding: '10px 18px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <Plus size={16} /> Yeni yedək yaz
            </Link>
          </div>
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

      {/* AI Modal */}
      {aiOpen && (
        <div onClick={() => setAiOpen(false)} className="ai-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="ai-modal" style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 640, height: 'min(85vh, 720px)', borderRadius: 18, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            {/* Başlıq */}
            <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 8, display: 'inline-flex' }}><Bot size={20} /></div>
                <div>
                  <strong style={{ fontSize: 16 }}>Beyin Yedəyi AI</strong>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>Frilanserlərin kolektiv biliyindən cavab</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {aiThread.length > 0 && (
                  <button onClick={() => { setAiThread([]); setAiQ(''); }} title="Söhbəti təmizlə" aria-label="Söhbəti təmizlə"
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                    <Trash2 size={17} />
                  </button>
                )}
                <button onClick={() => setAiOpen(false)} aria-label="Bağla" title="Bağla"
                  style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 6, display: 'inline-flex' }}>
                  <XIcon size={22} />
                </button>
              </div>
            </div>

            {/* Söhbət */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-page)' }}>
              {aiThread.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 30 }}>
                  <Bot size={36} color="#8b5cf6" style={{ marginBottom: 10 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>Sualını yaz — AI həm bilik bazasından oxşar problemlərə baxır, həm öz bilgisini istifadə edir.</p>
                  <div style={{ marginTop: 14, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['React-də CORS xətası', 'MongoDB performans optimizasiyası', 'Logo dizaynına necə başlayım?'].map((s) => (
                      <button key={s} onClick={() => setAiQ(s)} style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {aiThread.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%',
                    background: m.role === 'user' ? '#6366f1' : 'var(--bg-surface)',
                    color: m.role === 'user' ? 'white' : (m.error ? '#ef4444' : 'var(--text-primary)'),
                    padding: '10px 14px',
                    borderRadius: 12,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 12,
                    borderBottomLeftRadius: m.role === 'user' ? 12 : 4,
                    fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                  }}>
                    {m.error && <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />}
                    {m.content}
                    {m.related && m.related.length > 0 && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 700 }}>İSTİNAD OLUNAN HƏLLƏR:</div>
                        {m.related.map((r) => (
                          <Link key={r._id} to={`/beyin-yedeyi/${r._id}`} onClick={() => setAiOpen(false)} style={{ display: 'block', fontSize: 12, color: '#6366f1', textDecoration: 'none', marginBottom: 3, fontWeight: 600 }}>→ {r.title}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 12, color: 'var(--text-tertiary)', fontSize: 14 }}>
                    Düşünür<span className="ai-dots">...</span>
                  </div>
                </div>
              )}
              <div ref={aiBottomRef} style={{ height: 1 }} />
            </div>

            {/* Input */}
            <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <form onSubmit={(e) => { e.preventDefault(); askAI(); }} style={{ display: 'flex', gap: 8 }}>
                <input value={aiQ} onChange={(e) => setAiQ(e.target.value)} placeholder="Probleminizi yazın..." maxLength={800}
                  className="auth-input" style={{ flex: 1, marginBottom: 0 }} autoFocus disabled={aiLoading} />
                <button type="submit" disabled={aiLoading || !aiQ.trim()}
                  style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0 18px', borderRadius: 8, cursor: aiLoading || !aiQ.trim() ? 'not-allowed' : 'pointer', opacity: aiLoading || !aiQ.trim() ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <Send size={16} />
                </button>
              </form>
              {aiRemaining !== null && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
                  Bu gün üçün qalıb: <strong>{aiRemaining}</strong> sorğu
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainNotes;
