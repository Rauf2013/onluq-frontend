import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../api';
import { Link } from 'react-router-dom';
import { Bot, Send, X as XIcon, AlertTriangle, Trash2 } from 'lucide-react';
import BetaInfo from './BetaInfo';

// Hər yerdən aça bilən AI chat widget'i
function AIChat({ open, onClose, model: initialModel = 'mid' }) {
  const [q, setQ] = useState('');
  const [thread, setThread] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [modelLabel, setModelLabel] = useState('');
  const [model, setModel] = useState(() => localStorage.getItem('aiModel') || initialModel);
  const [aiModels, setAiModels] = useState([]);
  const bottomRef = useRef(null);

  // Mövcud AI modelləri çək (Sadə / Orta / Güclü)
  useEffect(() => {
    if (!open) return;
    fetch(`${API_URL}/api/ai/models`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.models) setAiModels(d.models); })
      .catch(() => {});
  }, [open]);

  const selectModel = (key) => {
    setModel(key);
    localStorage.setItem('aiModel', key);
  };

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [thread, loading, open]);

  const ask = async () => {
    if (!q.trim() || loading) return;
    const userMsg = q.trim();
    const history = thread.filter(m => !m.error).slice(-10).map(m => ({ role: m.role, content: m.content }));
    setThread((t) => [...t, { role: 'user', content: userMsg }]);
    setQ('');
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: userMsg, history, model }),
      });
      let d = {};
      try { d = await r.json(); } catch {}
      if (r.ok) {
        setThread((t) => [...t, { role: 'ai', content: d.answer }]);
        setRemaining(d.remaining);
        setDailyLimit(d.dailyLimit);
        setIsGuest(!!d.guest);
        if (d.modelLabel) setModelLabel(d.modelLabel);
      } else {
        let msg = d.message || `Server xətası (HTTP ${r.status})`;
        if (r.status === 404) {
          msg = 'AI xidməti serverdə hələ aktiv deyil (404). Server yenilənməlidir — dəstək komandası ilə əlaqə saxla.';
        } else if (r.status === 503) {
          msg = 'AI müvəqqəti əlçatmazdır (503). Bir azdan yenidən cəhd et.';
        } else if (r.status === 429) {
          msg = 'Günlük AI limitin doldu. Sabah yenidən cəhd et.';
        }
        setThread((t) => [...t, { role: 'ai', content: msg, error: true, retry: userMsg }]);
      }
    } catch (e) {
      const detail = (e && e.message) ? ` (${e.message})` : '';
      setThread((t) => [...t, {
        role: 'ai',
        content: `Bağlantı xətası${detail}. İnternet bağlantını yoxla.`,
        error: true,
        retry: userMsg,
      }]);
    }
    setLoading(false);
  };

  const retry = (text) => {
    setQ(text);
    setTimeout(() => ask(), 50);
  };

  if (!open) return null;

  return (
    <div onClick={onClose} className="ai-modal-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Beta info — modal-dan kənar, viewport-un sol üstündə */}
      <div onClick={(e) => e.stopPropagation()}>
        <BetaInfo variant={isGuest ? 'guest' : 'full'} />
      </div>
      <div onClick={(e) => e.stopPropagation()} className="ai-modal"
        style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 640, height: 'min(85vh, 720px)', borderRadius: 18, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Başlıq */}
        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 10, padding: 8, display: 'inline-flex' }}><Bot size={20} /></div>
            <div>
              <strong style={{ fontSize: 16 }}>EVDƏN AI Köməkçi</strong>
              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {isGuest ? 'Qonaq rejimi — Sadə model' : (modelLabel ? `Model: ${modelLabel}` : 'Səninlə söhbət edir')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {thread.length > 0 && (
              <button onClick={() => { setThread([]); setQ(''); }} title="Söhbəti təmizlə" aria-label="Söhbəti təmizlə"
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                <Trash2 size={17} />
              </button>
            )}
            <button onClick={onClose} aria-label="Bağla" title="Bağla"
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 6, display: 'inline-flex' }}>
              <XIcon size={22} />
            </button>
          </div>
        </div>

        {/* Model seçici — qonaq deyilsə və modellər yüklənibsə */}
        {!isGuest && aiModels.length > 0 && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', overflowX: 'auto' }}>
            {aiModels.map((m) => {
              const active = model === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => selectModel(m.key)}
                  title={m.desc}
                  style={{
                    flex: '1 0 auto',
                    background: active ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--bg-muted)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? 'none' : '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: '0.15s',
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Söhbət */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-page)' }}>
          {thread.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 30 }}>
              <Bot size={36} color="#8b5cf6" style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Sualını yaz — AI sənə kömək edəcək.</p>
              <div style={{ marginTop: 14, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['EVDƏN nədir?', 'Necə qeydiyyatdan keçim?', 'Salam, necəsən?'].map((s) => (
                  <button key={s} onClick={() => setQ(s)} style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)', padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {thread.map((m, i) => (
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
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 12, color: 'var(--text-tertiary)', fontSize: 14 }}>
                Düşünür<span className="ai-dots">...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>

        {/* Qonaq qeydi */}
        {isGuest && (
          <div style={{ padding: '8px 14px', background: 'rgba(251,191,36,0.08)', borderTop: '1px solid rgba(251,191,36,0.25)', fontSize: 11.5, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.5 }}>
            Qeydiyyatdan keçmədiyin üçün AI funksiyaları tam deyil. <Link to="/qeydiyyat" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Qeydiyyatdan keç →</Link>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <form onSubmit={(e) => { e.preventDefault(); ask(); }} style={{ display: 'flex', gap: 8 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sualınızı yazın..." maxLength={isGuest ? 300 : 800}
              className="auth-input" style={{ flex: 1, marginBottom: 0 }} autoFocus disabled={loading} />
            <button type="submit" disabled={loading || !q.trim()}
              style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0 18px', borderRadius: 8, cursor: loading || !q.trim() ? 'not-allowed' : 'pointer', opacity: loading || !q.trim() ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <Send size={16} />
            </button>
          </form>
          {remaining !== null && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <span>Bu gün üçün qalıb: <strong>{remaining}</strong>{dailyLimit ? `/${dailyLimit}` : ''}</span>
              {isGuest && <Link to="/qeydiyyat" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 700 }}>Geniş erişim üçün qeydiyyatdan keç →</Link>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIChat;
