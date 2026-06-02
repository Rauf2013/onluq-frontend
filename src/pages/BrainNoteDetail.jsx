import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Brain, AlertTriangle, Lightbulb, BookOpen, GitBranch, ThumbsUp, Eye, User, Calendar, Tag, Trash2, ArrowLeft, Lock } from 'lucide-react';
import { levelColor } from '../constants/seller';

function BrainNoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const fetchNote = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) { navigate('/giris'); return; }
    try {
      const r = await fetch(`${API_URL}/api/brain-notes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setNote(d);
      else { toast.error(d.message || 'Tapılmadı'); navigate('/beyin-yedeyi'); }
    } catch { toast.error('Bağlantı xətası'); }
    setLoading(false);
  };

  useEffect(() => { fetchNote(); }, [id]);

  const toggleHelpful = async () => {
    if (voting) return;
    setVoting(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const r = await fetch(`${API_URL}/api/brain-notes/${id}/helpful`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) {
        setNote((n) => ({ ...n, helpfulCount: d.helpfulCount, userHelpful: d.userHelpful }));
      } else toast.error(d.message || 'Xəta');
    } catch { toast.error('Bağlantı xətası'); }
    setVoting(false);
  };

  const confirmDelete = async () => {
    setShowDelete(false);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const t = toast.loading('Silinir...');
    try {
      const r = await fetch(`${API_URL}/api/brain-notes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        toast.update(t, { render: 'Silindi', type: 'success', isLoading: false, autoClose: 1500 });
        navigate('/beyin-yedeyi');
      } else {
        const d = await r.json();
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch { toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 }); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-tertiary)' }}>Yüklənir...</div>;
  if (!note) return null;

  const isMine = currentUser && note.author?._id === currentUser.id;
  const lc = levelColor(note.requiredLevel);

  const Block = ({ icon: Icon, title, text, color = '#6366f1' }) => {
    if (!text || !text.trim()) return null;
    return (
      <div style={{ marginBottom: 22 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
          <span style={{ background: `${color}15`, color, padding: 7, borderRadius: 8, display: 'inline-flex' }}><Icon size={16} /></span>
          {title}
        </h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--bg-page)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>{text}</p>
      </div>
    );
  };

  return (
    <div className="main-content brain-detail-page" style={{ maxWidth: 800, margin: '20px auto', padding: '0 16px' }}>
      <Link to="/beyin-yedeyi" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: 13, marginBottom: 16 }}>
        <ArrowLeft size={14} /> Bütün yedəklər
      </Link>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 26, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>

        {/* Başlıq + meta */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 18, marginBottom: 22 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ background: 'var(--bg-muted)', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{note.category}</span>
            {note.requiredLevel !== 'Yeni Satıcı' && (
              <span style={{ background: lc.bg, color: lc.fg, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Lock size={11} /> {note.requiredLevel}
              </span>
            )}
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.3 }}>{note.title}</h1>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
            <Link to={`/profil/${note.author._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {note.author?.avatar ? <img src={note.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={16} color="#64748b" />}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{note.author?.fullName}</span>
            </Link>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--text-tertiary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(note.createdAt).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {note.views || 0}</span>
            </span>
          </div>
        </div>

        <Block icon={AlertTriangle} title="Qarşılaşılan problem" text={note.challenge} color="#ef4444" />
        <Block icon={Lightbulb} title="Həll yolu" text={note.solution} color="#10b981" />
        <Block icon={BookOpen} title="İstifadə olunan resurslar" text={note.resources} color="#f59e0b" />
        <Block icon={GitBranch} title="Sınanmış digər yollar" text={note.alternatives} color="#8b5cf6" />

        {note.tags && note.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
            {note.tags.map((t) => (
              <span key={t} style={{ fontSize: 12, color: '#6366f1', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Tag size={11} /> {t}</span>
            ))}
          </div>
        )}

        {/* Aksiyalar */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
          {!isMine && (
            <button onClick={toggleHelpful} disabled={voting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: voting ? 'wait' : 'pointer', transition: '0.2s',
                background: note.userHelpful ? '#6366f1' : 'transparent',
                color: note.userHelpful ? 'white' : '#6366f1',
                border: `1px solid ${note.userHelpful ? '#6366f1' : 'rgba(99,102,241,0.4)'}` }}>
              <ThumbsUp size={16} fill={note.userHelpful ? 'white' : 'none'} /> {note.userHelpful ? 'Faydalı oldu' : 'Faydalı oldu mu?'} ({note.helpfulCount || 0})
            </button>
          )}
          {isMine && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'var(--bg-muted)', color: 'var(--text-tertiary)', fontSize: 13 }}>
              <ThumbsUp size={14} /> {note.helpfulCount || 0} nəfər faydalı tapdı
            </span>
          )}
          {isMine && (
            <button onClick={() => setShowDelete(true)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 700, cursor: 'pointer' }}>
              <Trash2 size={14} /> Sil
            </button>
          )}
        </div>
      </div>

      {/* Sil təsdiq modal */}
      <div className={`custom-modal-overlay ${showDelete ? 'active' : ''}`} onClick={() => setShowDelete(false)}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-icon" style={{ width: 70, height: 70, background: 'rgba(239,68,68,0.12)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={30} />
          </div>
          <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Beyin yedəyini sil?</h3>
          <p style={{ margin: '0 0 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>Bu əməliyyat geri alına bilməz.</p>
          <div className="modal-actions">
            <button className="btn-modal-cancel" onClick={() => setShowDelete(false)}>Ləğv et</button>
            <button className="btn-modal-danger" onClick={confirmDelete}>Sil</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrainNoteDetail;
