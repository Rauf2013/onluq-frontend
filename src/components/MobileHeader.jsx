import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ChevronLeft, Bell, Sun, Moon, Menu, X,
  PlusCircle, Briefcase, Package, Wallet, Heart, BellRing,
  Brain, Shield, LogOut, LogIn, UserPlus, User as UserIcon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { disconnectSocket } from '../socket';
import { API_URL } from '../api';

const TITLES = {
  '/':                 'EVDƏN',
  '/kategoriler':      'Kateqoriyalar',
  '/giris':            'Daxil ol',
  '/qeydiyyat':        'Qeydiyyat',
  '/sifreni-unutdun':  'Şifrəni unutdun',
  '/sevimliler':       'Sevimlilər',
  '/yeni-xidmet':      'Yeni xidmət',
  '/sifarislerim':     'Sifarişlərim',
  '/xidmetlerim':      'Xidmətlərim',
  '/mesajlar':         'Mesajlar',
  '/cuzdan':           'Cüzdan',
  '/admin':            'Admin Panel',
  '/bildirisler':      'Bildirişlər',
  '/beyin-yedeyi':     'Beyin yedəyi',
  '/beyin-yedeyi/yeni':'Yeni qeyd',
};

function titleForPath(path) {
  if (TITLES[path]) return TITLES[path];
  if (path.startsWith('/xidmet/')) return 'Xidmət';
  if (path.startsWith('/profil/')) return 'Profil';
  if (path.startsWith('/odeme/')) return 'Ödəniş';
  if (path.startsWith('/beyin-yedeyi/')) return 'Qeyd';
  if (path.startsWith('/sifre-yenile/')) return 'Şifrə yenilə';
  return 'EVDƏN';
}

const ROOT_PATHS = new Set(['/', '/kategoriler', '/sifarislerim', '/mesajlar']);

function readUser() {
  try {
    const s = localStorage.getItem('user') || sessionStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export default function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const user = readUser();
  const hasUser = !!user;
  const isRoot = ROOT_PATHS.has(location.pathname) || location.pathname.startsWith('/profil/');
  const title = titleForPath(location.pathname);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!hasUser) return;
    let alive = true;
    const tick = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const r = await fetch(`${API_URL}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const data = await r.json();
        if (!alive) return;
        setUnread(Array.isArray(data) ? data.filter((x) => !x.isRead).length : 0);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 25000);
    return () => { alive = false; clearInterval(id); };
  }, [hasUser, location.pathname]);

  const go = (path) => { setMenuOpen(false); navigate(path); };

  const logout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
    disconnectSocket();
    window.dispatchEvent(new Event('userUpdated'));
    setMenuOpen(false);
    navigate('/giris');
  };

  // Menü elementləri
  const authedItems = [
    { icon: PlusCircle, label: 'Yeni xidmət (Elan ver)', to: '/yeni-xidmet', accent: true },
    { icon: Briefcase,  label: 'Xidmətlərim',  to: '/xidmetlerim' },
    { icon: Package,    label: 'Sifarişlərim', to: '/sifarislerim' },
    { icon: Wallet,     label: 'Cüzdan',       to: '/cuzdan' },
    { icon: Heart,      label: 'Sevimlilər',   to: '/sevimliler' },
    { icon: BellRing,   label: 'Bildirişlər',  to: '/bildirisler' },
    { icon: Brain,      label: 'Beyin yedəyi', to: '/beyin-yedeyi' },
  ];
  if (user?.role === 'admin') authedItems.push({ icon: Shield, label: 'Admin Panel', to: '/admin' });

  const guestItems = [
    { icon: LogIn,    label: 'Daxil ol',   to: '/giris', accent: true },
    { icon: UserPlus, label: 'Qeydiyyat',  to: '/qeydiyyat' },
    { icon: Brain,    label: 'Beyin yedəyi', to: '/beyin-yedeyi' },
  ];
  const items = hasUser ? authedItems : guestItems;

  return (
    <>
      <header className="mobile-top-header" aria-label="Səhifə başlığı">
        <div className="mobile-top-left">
          {!isRoot ? (
            <button onClick={() => navigate(-1)} className="mobile-icon-btn" aria-label="Geri">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <span className="mobile-brand">EVDƏN</span>
          )}
        </div>
        <div className="mobile-top-title">{title !== 'EVDƏN' || !isRoot ? title : ''}</div>
        <div className="mobile-top-right">
          <button onClick={toggleTheme} className="mobile-icon-btn" aria-label="Tema">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {hasUser && (
            <button onClick={() => navigate('/bildirisler')} className="mobile-icon-btn" aria-label="Bildirişlər" style={{ position: 'relative' }}>
              <Bell size={20} />
              {unread > 0 && <span className="mobile-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}
          <button onClick={() => setMenuOpen(true)} className="mobile-icon-btn" aria-label="Menyu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Menü drawer */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-head">
              {hasUser ? (
                <Link to={`/profil/${user.id}`} className="mobile-menu-user" onClick={() => setMenuOpen(false)}>
                  <div className="mobile-menu-avatar">
                    {user.avatar ? <img src={user.avatar} alt="" /> : <UserIcon size={22} />}
                  </div>
                  <div>
                    <div className="mobile-menu-name">{user.fullName || 'İstifadəçi'}</div>
                    <div className="mobile-menu-sub">Profilə bax →</div>
                  </div>
                </Link>
              ) : (
                <div className="mobile-menu-name">Menyu</div>
              )}
              <button onClick={() => setMenuOpen(false)} className="mobile-icon-btn" aria-label="Bağla">
                <X size={22} />
              </button>
            </div>

            <nav className="mobile-menu-list">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.to}
                    className={`mobile-menu-item ${it.accent ? 'accent' : ''}`}
                    onClick={() => go(it.to)}
                  >
                    <Icon size={20} />
                    <span>{it.label}</span>
                  </button>
                );
              })}
              {hasUser && (
                <button className="mobile-menu-item danger" onClick={logout}>
                  <LogOut size={20} />
                  <span>Çıxış</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
