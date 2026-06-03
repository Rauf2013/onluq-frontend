import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Package, Briefcase, Wallet, ShieldCheck, LogOut, CheckCircle, Bell, Heart, Sun, Moon, ArrowRight, Menu, X, User, Lightbulb, Bot } from 'lucide-react';
import AIChat from './AIChat';
import { toast } from 'react-toastify';
import { useTheme } from '../context/ThemeContext';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const readUser = () => {
    const s = localStorage.getItem('user') || sessionStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  };
  const [user, setUser] = useState(readUser);
  const userId = user ? user.id : null;

  useEffect(() => {
    const refresh = () => setUser(readUser());
    window.addEventListener('userUpdated', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('userUpdated', refresh); window.removeEventListener('storage', refresh); };
  }, []);

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Sevimlilər badge — yalnız son ziyarətdən sonra ƏLAVƏ olunan sevimliləri sayır
  const favKey = userId ? `favorites_${userId}` : null;
  const seenKey = userId ? `favorites_seen_${userId}` : null;

  const computeNewCount = () => {
    if (!favKey || !seenKey) return 0;
    const favs = JSON.parse(localStorage.getItem(favKey)) || [];
    const seen = JSON.parse(localStorage.getItem(seenKey)) || [];
    return favs.filter(id => !seen.includes(id)).length;
  };

  const [favCount, setFavCount] = useState(computeNewCount);

  useEffect(() => {
    const update = () => setFavCount(computeNewCount());
    update();
    window.addEventListener('favoritesUpdated', update);
    window.addEventListener('favoritesSeen', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('favoritesUpdated', update);
      window.removeEventListener('favoritesSeen', update);
      window.removeEventListener('storage', update);
    };
  }, [favKey, seenKey]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNotifications(prev => {
              const isMessagesPage = location.pathname.startsWith('/mesajlar');
              
              const displayData = isMessagesPage 
                ? data.filter(n => !(n.message && n.message.includes('mesaj'))) 
                : data;

              if (prev.length > 0 && displayData.length > prev.length && !isMessagesPage) {
                toast.info("Yeni bir bildirişiniz var!", {
                  position: "top-right",
                  autoClose: 4000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                });
              }
              return displayData;
            });
          }
        }
      } catch (e) {}
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000); 
    return () => clearInterval(interval);
  }, [userId, location.pathname]); 

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const handleNotificationClick = async (n) => {
    setShowNotifs(false);

    // Bildirişi oxundu kimi işarələ
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch(`${API_URL}/api/notifications/${n._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(x => x._id !== n._id));
    } catch (e) {}

    // Bildiriş növünə görə düzgün səhifəyə yönləndir
    const isOrder = n.type === 'order' || /sifariş|təhvil|təsdiqlə|düzəliş/i.test(n.message || '');
    const isMessage = n.type === 'message' || /mesaj/i.test(n.message || '');
    const isFollow = n.type === 'follow' || /izləm/i.test(n.message || '');

    if (isOrder) {
      navigate('/sifarislerim');
    } else if (isMessage) {
      const partnerId = n.senderId ? (n.senderId._id || n.senderId) : null;
      const partnerName = n.senderId ? (n.senderId.fullName || 'Bilinməyən İstifadəçi') : 'Bilinməyən İstifadəçi';
      if (partnerId) navigate('/mesajlar', { state: { partnerId, partnerName } });
    } else if (isFollow) {
      const senderId = n.senderId ? (n.senderId._id || n.senderId) : null;
      if (senderId) navigate(`/profil/${senderId}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setNotifications([]);
    setShowNotifs(false);
    setMobileOpen(false);
    window.dispatchEvent(new Event('userUpdated'));
    navigate('/giris');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 5%', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <Link to="/" style={{ fontSize: '26px', fontWeight: '900', color: '#10b981', textDecoration: 'none', letterSpacing: '-1px' }}>
          Onluq.
        </Link>
      </div>

      <button
        className="navbar-hamburger"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menyu"
        style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 6 }}
      >
        {mobileOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      <div className={`navbar-actions ${mobileOpen ? 'open' : ''}`} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'dark' ? 'İşıqlı rejim' : 'Qaranlıq rejim'}
          aria-label={theme === 'dark' ? 'İşıqlı rejimə keç' : 'Qaranlıq rejimə keç'}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {user ? (
          <>
            {user.role === 'admin' && null}

            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="notif-dropdown" style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', width: '320px', maxWidth: 'calc(100vw - 24px)', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                  <div style={{ padding: '15px', background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Bildirişlər</span>
                    {unreadCount > 0 && <span onClick={handleMarkAllRead} style={{fontSize: '12px', color: '#10b981', cursor: 'pointer'}}>Hamısını oxu</span>}
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Yeni bildiriş yoxdur.</div>
                    ) : (
                      notifications.map(n => {
                        return (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            style={{ padding: '15px', borderBottom: '1px solid var(--border-soft)', background: n.isRead ? 'var(--bg-elevated)' : 'var(--brand-soft)', fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer', transition: '0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                            onMouseOut={(e) => e.currentTarget.style.background = n.isRead ? 'var(--bg-elevated)' : 'var(--brand-soft)'}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                              <div style={{ marginTop: '3px' }}><MessageSquare size={16} color="#10b981" /></div>
                              <div style={{ flex: 1, lineHeight: '1.4' }}>{n.message}</div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <Link
                    to="/bildirisler"
                    onClick={() => setShowNotifs(false)}
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', textAlign: 'center', padding: '12px', background: 'var(--bg-muted)', color: 'var(--brand)', fontWeight: 'bold', textDecoration: 'none', borderTop: '1px solid var(--border)', fontSize: '13px' }}
                  >
                    Hamısını gör <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/sevimliler"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: location.pathname === '/sevimliler' ? '#ef4444' : 'var(--text-secondary)',
                fontWeight: '600',
                fontSize: '15px',
                transition: '0.2s',
                marginLeft: '10px',
                position: 'relative',
                padding: '6px 10px',
                borderRadius: '8px',
                background: location.pathname === '/sevimliler' ? '#fef2f2' : 'transparent'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
              onMouseOut={(e) => {
                if (location.pathname !== '/sevimliler') {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Heart
                size={18}
                style={{ marginRight: '6px' }}
                fill={favCount > 0 ? '#ef4444' : 'none'}
                color={favCount > 0 ? '#ef4444' : 'currentColor'}
              />
              Sevimlilər
              {favCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {favCount > 99 ? '99+' : favCount}
                </span>
              )}
            </Link>

            <Link to="/mesajlar" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px', transition: '0.2s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
              <MessageSquare size={18} style={{ marginRight: '6px' }} /> Mesajlar
            </Link>
            <Link to="/sifarislerim" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px', transition: '0.2s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
              <Package size={18} style={{ marginRight: '6px' }} /> Sifarişlər
            </Link>
            <Link to="/xidmetlerim" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px', transition: '0.2s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>
              <Briefcase size={18} style={{ marginRight: '6px' }} /> Xidmətlərim
            </Link>
            <Link to="/beyin-yedeyi" title="Bilik bazası — Frilanserlərin paylaşdığı həllər" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#6366f1', fontWeight: '700', fontSize: '15px', transition: '0.2s', background: 'rgba(99,102,241,0.08)', padding: '8px 12px', borderRadius: 8 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.16)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
              <Lightbulb size={17} style={{ marginRight: '5px' }} /> Bilik
              <span style={{ position: 'absolute', top: -6, left: -6, background: '#fbbf24', color: 'white', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, transform: 'rotate(-35deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', letterSpacing: 0.6, pointerEvents: 'none' }}>BETA</span>
            </Link>
            <Link to="/cuzdan" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', background: 'var(--brand-soft)', color: '#10b981', fontWeight: '700', padding: '8px 15px', borderRadius: '8px', border: '1px solid var(--brand-soft)' }}>
              <Wallet size={18} style={{ marginRight: '6px' }} /> Cüzdanım
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px', paddingLeft: '14px', borderLeft: '1px solid var(--border)' }}>
              {user.role === 'admin' && (
                <Link to="/admin" title="Admin Paneli" aria-label="Admin Paneli"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', textDecoration: 'none', transition: '0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <ShieldCheck size={17} />
                </Link>
              )}
              <Link to={`/profil/${user.id}`} title="Profilimə bax" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: '700', fontSize: '15px', textDecoration: 'none', padding: '4px 8px', borderRadius: 8, transition: '0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-muted)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={18} color="#64748b" />}
                </span>
                {user.fullName}
              </Link>
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                <LogOut size={16} style={{ marginRight: '6px' }} /> Çıxış
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setAiOpen(true)} title="AI ilə danış" style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#6366f1', fontWeight: '700', fontSize: '15px', transition: '0.2s', background: 'rgba(99,102,241,0.08)', padding: '8px 12px', borderRadius: 8, border: 'none' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.16)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}>
              <Bot size={17} style={{ marginRight: '5px' }} /> AI ilə danış
              <span style={{ position: 'absolute', top: -6, left: -6, background: '#fbbf24', color: 'white', fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 4, transform: 'rotate(-35deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', letterSpacing: 0.6, pointerEvents: 'none' }}>BETA</span>
            </button>
            <Link to="/giris" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: '600', transition: '0.2s' }} onMouseOver={(e) => e.target.style.color = '#10b981'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>Giriş Et</Link>
            <Link to="/qeydiyyat" style={{ background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}>
              Qeydiyyat
            </Link>
          </>
        )}
        <AIChat open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>
    </nav>
  );
}

export default Navbar;
