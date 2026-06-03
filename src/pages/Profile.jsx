import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../api';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Star, MapPin, Calendar, Edit3, MessageSquare, Image as ImageIcon, UserPlus, UserCheck, Eye, Users, Award, ShoppingBag, Camera, Clock, Globe, Languages, Plus, Trash2, X, Repeat } from 'lucide-react';
import { levelColor } from '../constants/seller';

// === Daire şeklinde foto kırpıcı (YouTube tarzı) ===
function AvatarCropper({ src, onCancel, onSave }) {
  const VIEW = 320, CIRCLE = 240, OUT = 256;
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef(null);
  const cropRef = useRef(null);

  const handleDown = (e) => {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    startRef.current = { x: p.clientX, y: p.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };
  const handleMove = (e) => {
    if (!dragging) return;
    const p = e.touches ? e.touches[0] : e;
    setOffset({ x: startRef.current.ox + (p.clientX - startRef.current.x), y: startRef.current.oy + (p.clientY - startRef.current.y) });
  };
  const handleUp = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging]);

  const handleSave = () => {
    const img = imgRef.current, crop = cropRef.current;
    if (!img || !crop) return;
    const ir = img.getBoundingClientRect(), cr = crop.getBoundingClientRect();
    const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
    const sx = (cx - CIRCLE / 2 - ir.left) * (img.naturalWidth / ir.width);
    const sy = (cy - CIRCLE / 2 - ir.top) * (img.naturalHeight / ir.height);
    const ss = CIRCLE * (img.naturalWidth / ir.width);
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    ctx.beginPath(); ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    ctx.drawImage(img, Math.max(0, sx), Math.max(0, sy), ss, ss, 0, 0, OUT, OUT);
    onSave(canvas.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} className="cropper-box" style={{ background: 'var(--bg-surface)', borderRadius: 18, padding: 20, maxWidth: 380, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)', fontWeight: 800 }}>Profil şəkli</h3>
          <button onClick={onCancel} aria-label="Bağla" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}><X size={22} /></button>
        </div>
        <div ref={cropRef} onMouseDown={handleDown} onTouchStart={handleDown}
          style={{ position: 'relative', width: VIEW, height: VIEW, maxWidth: '100%', margin: '0 auto', overflow: 'hidden', borderRadius: 12, background: '#000', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none', touchAction: 'none' }}>
          <img ref={imgRef} src={src} alt="" draggable={false}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`, maxWidth: 'none', width: VIEW, height: 'auto', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: CIRCLE, height: CIRCLE, borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(255,255,255,0.55), inset 0 0 0 2px rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Yaxınlaş</span>
          <input type="range" min="1" max="3" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#10b981' }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0 0' }}>Şəkli sürüklə və zumu tənzimlə — ortadakı dairə profil şəkli olacaq.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} className="btn-modal-cancel" style={{ flex: 1 }}>Ləğv et</button>
          <button onClick={handleSave} className="btn-modal-confirm" style={{ flex: 1 }}>Yadda saxla</button>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isMyProfile = currentUser && currentUser.id === id;

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBioText, setEditBioText] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [showAvatarDeleteModal, setShowAvatarDeleteModal] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editCountry, setEditCountry] = useState('');
  const [editLanguages, setEditLanguages] = useState('');
  const fileAvatarRef = useRef(null);
  const filePortfolioRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/users/${id}/profile`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (response.ok) {
        setProfileData(data);
        setEditBioText(data.user.bio);
        setEditCountry(data.user.country || 'Azərbaycan');
        setEditLanguages((data.user.languages || []).join(', '));
      } else {
        toast.error("Profil tapılmadı.");
        navigate('/');
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.info("İzləmək üçün giriş etməlisiniz.");
      return navigate('/giris');
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/users/${id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfileData(prev => ({
          ...prev,
          user: { ...prev.user, isFollowing: data.isFollowing, followersCount: data.followersCount }
        }));
        toast.success(data.isFollowing ? "İzləməyə başladınız!" : "İzləmədən çıxdınız.");
      } else {
        toast.error(data.message || "Xəta.");
      }
    } catch (e) {
      toast.error("Bağlantı xətası.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const updateLocalUser = (patch) => {
    const ls = localStorage.getItem('user') ? localStorage : sessionStorage;
    const u = JSON.parse(ls.getItem('user') || '{}');
    ls.setItem('user', JSON.stringify({ ...u, ...patch }));
    window.dispatchEvent(new Event('userUpdated'));
  };

  const saveProfilePatch = async (patch, successMsg) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const t = toast.loading('Yadda saxlanılır...');
    try {
      const r = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: successMsg, type: 'success', isLoading: false, autoClose: 1800 });
        if (patch.avatar !== undefined) updateLocalUser({ avatar: patch.avatar });
        fetchProfile();
        return true;
      } else {
        toast.update(t, { render: d.message || 'Xəta baş verdi.', type: 'error', isLoading: false, autoClose: 2200 });
        return false;
      }
    } catch (e) {
      toast.update(t, { render: 'Bağlantı xətası.', type: 'error', isLoading: false, autoClose: 2200 });
      return false;
    }
  };

  const onAvatarFileChosen = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Yalnız şəkil yükləyin.'); return; }
    if (f.size > 6 * 1024 * 1024) { toast.error('Şəkil 6 MB-dan kiçik olmalıdır.'); return; }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const onPortfolioFileChosen = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Yalnız şəkil yükləyin.'); return; }
    if (f.size > 4 * 1024 * 1024) { toast.error('Şəkil 4 MB-dan kiçik olmalıdır.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        const max = 1024;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio), h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const newPortfolio = [...(profileData.user.portfolio || []), dataUrl];
        await saveProfilePatch({ portfolio: newPortfolio }, 'Portfolyoya əlavə edildi');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const removePortfolioItem = async (idx) => {
    const next = (profileData.user.portfolio || []).filter((_, i) => i !== idx);
    await saveProfilePatch({ portfolio: next }, 'Silindi');
  };

  const confirmRemoveAvatar = async () => {
    setShowAvatarDeleteModal(false);
    await saveProfilePatch({ avatar: '' }, 'Profil şəkli silindi');
  };

  const handleDetailsSave = async () => {
    const langs = editLanguages.split(',').map(s => s.trim()).filter(Boolean);
    const ok = await saveProfilePatch({ country: editCountry, languages: langs }, 'Profil yeniləndi');
    if (ok) setEditingDetails(false);
  };

  const formatResponseTime = (m) => {
    if (m === null || m === undefined) return 'Hələ məlumat yoxdur';
    if (m <= 0) return 'Dərhal cavab verir';
    if (m < 60) return `Ortalama ${m} dəq. ərzində cavab verir`;
    const h = Math.round(m / 60);
    if (h < 24) return `Ortalama ${h} saat ərzində cavab verir`;
    return `Ortalama ${Math.round(h / 24)} gün ərzində cavab verir`;
  };

  const formatLastActive = (d) => {
    if (!d) return '—';
    const diff = (Date.now() - new Date(d).getTime()) / 60000;
    if (diff < 5) return 'İndi onlayn';
    if (diff < 60) return `${Math.floor(diff)} dəq. əvvəl`;
    if (diff < 60 * 24) return `${Math.floor(diff / 60)} saat əvvəl`;
    return `${Math.floor(diff / 60 / 24)} gün əvvəl`;
  };

  const handleBioSave = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const loadToast = toast.loading("Yadda saxlanılır...");
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: editBioText })
      });
      if (response.ok) {
        toast.update(loadToast, { render: "Haqqımda yeniləndi!", type: "success", isLoading: false, autoClose: 2000 });
        setIsEditingBio(false);
        fetchProfile();
      } else {
        toast.update(loadToast, { render: "Xəta baş verdi.", type: "error", isLoading: false, autoClose: 2000 });
      }
    } catch (error) {
      toast.update(loadToast, { render: "Bağlantı xətası.", type: "error", isLoading: false, autoClose: 2000 });
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}>Profil yüklənir...</div>;
  if (!profileData) return null;

  const { user, services, reviews } = profileData;
  const totalRating = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

  return (
    <div className="main-content" style={{ minHeight: '70vh', maxWidth: '1100px', margin: '40px auto' }}>
      <div className="profile-grid">
        
        <div className="profile-sidebar">
          <div className="profile-card">
            <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 18px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-muted)', cursor: isMyProfile ? 'pointer' : 'default', border: '4px solid var(--bg-surface)', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
              onClick={() => isMyProfile && fileAvatarRef.current?.click()}
              title={isMyProfile ? 'Profil şəklini dəyiş' : ''}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={64} color="var(--text-muted)" />
                </div>
              )}
              {isMyProfile && (
                <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: 0, transition: '0.2s' }}>
                  <Camera size={26} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Şəkli dəyiş</span>
                </div>
              )}
            </div>
            {isMyProfile && (
              <input ref={fileAvatarRef} type="file" accept="image/*" onChange={onAvatarFileChosen} style={{ display: 'none' }} />
            )}
            {isMyProfile && user.avatar && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: -8, marginBottom: 14 }}>
                <button onClick={() => fileAvatarRef.current?.click()} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Camera size={13} /> Dəyiş
                </button>
                <button onClick={() => setShowAvatarDeleteModal(true)} style={{ background: 'transparent', border: '1px solid #fecaca', color: '#ef4444', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Trash2 size={13} /> Şəkli sil
                </button>
              </div>
            )}
            <h2 className="profile-name">{user.fullName}</h2>
            {user.level && (() => {
              const lc = levelColor(user.level);
              return (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <span style={{ background: lc.bg, color: lc.fg, padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Award size={14} /> {user.level}
                  </span>
                </div>
              );
            })()}
            <div className="profile-rating" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Star size={18} fill="#fbbf24" color="#fbbf24" /> {avgRating} ({reviews.length} rəy)
            </div>

            {/* Sosial Statistika */}
            <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0', padding: '15px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <Users size={16} color="#10b981" /> {user.followersCount || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>İzləyən</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <UserPlus size={16} color="#3b82f6" /> {user.followingCount || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>İzlənilən</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <Eye size={16} color="#f59e0b" /> {user.profileViews || 0}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Baxış</div>
              </div>
            </div>

            {!isMyProfile && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={handleFollowToggle}
                  style={{
                    flex: 1,
                    background: user.isFollowing ? 'var(--bg-muted)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: user.isFollowing ? 'var(--text-primary)' : 'white',
                    border: user.isFollowing ? '1px solid var(--border-strong)' : 'none',
                    padding: '12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: '0.2s'
                  }}
                >
                  {user.isFollowing ? <><UserCheck size={16} /> İzlənilir</> : <><UserPlus size={16} /> İzlə</>}
                </button>
                <button
                  className="btn-publish"
                  style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => navigate('/mesajlar', { state: { partnerId: user._id, partnerName: user.fullName } })}
                >
                  <MessageSquare size={16} /> Mesaj
                </button>
              </div>
            )}
            
            <hr className="profile-divider" />
            
            <div className="profile-meta">
              <div className="meta-row" style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={16} /> Cavab müddəti</span>
                <strong style={{ fontSize: 12, textAlign: 'right' }}>{formatResponseTime(user.responseTimeMinutes)}</strong>
              </div>
              <div className="meta-row" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Eye size={16} /> Son aktivlik</span>
                <strong>{formatLastActive(user.lastActive)}</strong>
              </div>
              {!editingDetails ? (
                <>
                  <div className="meta-row" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Globe size={16} /> Ölkə</span>
                    <strong>{user.country || '—'}</strong>
                  </div>
                  <div className="meta-row" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Languages size={16} /> Dillər</span>
                    <strong style={{ fontSize: 12, textAlign: 'right' }}>{(user.languages || []).join(', ') || '—'}</strong>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Ölkə</label>
                  <input className="auth-input" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} style={{ width: '100%', marginBottom: 10, marginTop: 4 }} />
                  <label style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>Dillər (vergüllə ayır)</label>
                  <input className="auth-input" value={editLanguages} onChange={(e) => setEditLanguages(e.target.value)} placeholder="Azərbaycan dili, English..." style={{ width: '100%', marginTop: 4 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button className="btn-modal-cancel" style={{ flex: 1, padding: 8 }} onClick={() => setEditingDetails(false)}>Ləğv</button>
                    <button className="btn-modal-confirm" style={{ flex: 1, padding: 8 }} onClick={handleDetailsSave}>Yadda saxla</button>
                  </div>
                </div>
              )}
              <div className="meta-row" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={16} /> Üzv olduğu tarix</span>
                <strong>{new Date(user.createdAt).toLocaleDateString('az-AZ', { month: 'short', year: 'numeric' })}</strong>
              </div>
              <div className="meta-row" style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><ShoppingBag size={16} /> Tamamlanmış satış</span>
                <strong>{user.completedSales || 0}</strong>
              </div>
              {isMyProfile && !editingDetails && (
                <button onClick={() => setEditingDetails(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 13 }}>
                  <Edit3 size={13} /> Ölkə və dilləri redaktə et
                </button>
              )}
            </div>

            <hr className="profile-divider" />

            <div className="profile-bio-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Haqqımda</h3>
                {isMyProfile && !isEditingBio && (
                  <button onClick={() => setIsEditingBio(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Edit3 size={14} /> Düzəliş Et
                  </button>
                )}
              </div>
              
              {isEditingBio ? (
                <div>
                  <textarea 
                    className="auth-input" 
                    style={{ width: '100%', minHeight: '120px', padding: '10px' }} 
                    value={editBioText} 
                    onChange={(e) => setEditBioText(e.target.value)} 
                    placeholder="Özünüz, təcrübəniz və bacarıqlarınız haqqında yazın..."
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button className="btn-modal-cancel" style={{ padding: '8px' }} onClick={() => setIsEditingBio(false)}>Ləğv Et</button>
                    <button className="btn-modal-confirm" style={{ padding: '8px' }} onClick={handleBioSave}>Yadda Saxla</button>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-main-content">

          {/* === STATİSTİKA KARTI === */}
          <div className="profile-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 30 }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 14px', textAlign: 'center' }}>
              <ShoppingBag size={22} color="#10b981" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{user.completedSales || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Tamamlanmış sifariş</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 14px', textAlign: 'center' }}>
              <Star size={22} fill="#fbbf24" color="#fbbf24" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{avgRating}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Orta reytinq ({reviews.length} rəy)</div>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 14px', textAlign: 'center' }}>
              <Repeat size={22} color="#3b82f6" style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{user.repeatCustomerPercent || 0}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Təkrar müştəri</div>
            </div>
          </div>

          {/* === PORTFOLYO QALEREYASI === */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>Portfolyo</h2>
              {isMyProfile && (
                <>
                  <button onClick={() => filePortfolioRef.current?.click()} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Şəkil əlavə et
                  </button>
                  <input ref={filePortfolioRef} type="file" accept="image/*" onChange={onPortfolioFileChosen} style={{ display: 'none' }} />
                </>
              )}
            </div>
            {(user.portfolio && user.portfolio.length > 0) ? (
              <div className="portfolio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {user.portfolio.map((src, i) => (
                  <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                    <img src={src} alt={`portfolio-${i}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isMyProfile && (
                      <button onClick={() => removePortfolioItem(i)} aria-label="Sil" style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results-box" style={{ padding: 30, textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 12, border: '1px dashed var(--border-strong)', color: 'var(--text-tertiary)' }}>
                {isMyProfile ? 'Portfolyonu zənginləşdir — keçmiş işlərinin şəkillərini əlavə et.' : 'Portfolyo hələ boşdur.'}
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '20px' }}>{user.fullName} adlı istifadəçinin xidmətləri ({services.length})</h2>
          
          {services.length === 0 ? (
            <div className="no-results-box" style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
              Bu istifadəçinin hələlik aktiv bir xidməti yoxdur.
            </div>
          ) : (
            <div className="services-grid" style={{ marginBottom: '50px' }}>
              {services.map(service => (
                <Link to={`/xidmet/${service._id}`} key={service._id} className="service-card" style={{ textDecoration: 'none' }}>
                  <div className="service-image">
                    {service.image ? <img src={service.image} alt={service.title} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-muted)'}}><ImageIcon size={32} color="var(--border-strong)" /></div>}
                  </div>
                  <div className="service-content">
                    <h3 className="service-title" style={{ color: 'var(--text-primary)' }}>{service.title}</h3>
                    <div className="service-footer">
                      <span className="service-price">{service.price} AZN</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <hr className="profile-divider" style={{ margin: '40px 0' }} />

          <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '20px' }}>Müştəri Rəyləri ({reviews.length})</h2>
          
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)' }}>Hələ heç bir rəy almayıb.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {reviews.map(review => (
                <div key={review._id} style={{ background: 'var(--bg-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{review.reviewerId?.fullName || 'Bilinməyən İstifadəçi'}</strong>
                    <span style={{ color: '#fbbf24', display: 'flex' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < review.rating ? "#fbbf24" : "none"} color={i < review.rating ? "#fbbf24" : "var(--border-strong)"} />
                      ))}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '1.6' }}>{review.comment}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                    <Link to={`/xidmet/${review.serviceId?._id}`} style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                      {review.serviceId?.title?.substring(0, 30)}... xidmətinə yazıldı
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onSave={async (dataUrl) => {
            const ok = await saveProfilePatch({ avatar: dataUrl }, 'Profil şəkli yeniləndi');
            if (ok) setCropSrc(null);
          }}
        />
      )}

      <div className={`custom-modal-overlay ${showAvatarDeleteModal ? 'active' : ''}`} onClick={() => setShowAvatarDeleteModal(false)}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-icon" style={{ width: 80, height: 80, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px auto' }}>
            <Trash2 size={36} />
          </div>
          <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 20, color: 'var(--text-primary)', fontWeight: 800 }}>Profil şəkli silinsin?</h3>
          <p style={{ margin: '0 0 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1.6 }}>
            Profil şəkliniz silinəcək. Bu əməliyyat geri alına bilməz, ancaq istədiyiniz vaxt yeni şəkil yükləyə bilərsiniz.
          </p>
          <div className="modal-actions">
            <button className="btn-modal-cancel" onClick={() => setShowAvatarDeleteModal(false)}>Ləğv et</button>
            <button className="btn-modal-danger" onClick={confirmRemoveAvatar}>Bəli, sil</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
