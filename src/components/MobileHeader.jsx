import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../api';

const TITLES = {
  '/':                 'Onluq',
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
  return 'Onluq';
}

const ROOT_PATHS = new Set(['/', '/kategoriler', '/sifarislerim', '/mesajlar']);

export default function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [unread, setUnread] = useState(0);

  const isRoot = ROOT_PATHS.has(location.pathname) || location.pathname.startsWith('/profil/');
  const title = titleForPath(location.pathname);

  const userStr = (typeof window !== 'undefined') ? (localStorage.getItem('user') || sessionStorage.getItem('user')) : null;
  const hasUser = !!userStr;

  // Bildirim sayisi
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
        const n = Array.isArray(data) ? data.filter(x => !x.isRead).length : 0;
        setUnread(n);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 25000);
    return () => { alive = false; clearInterval(id); };
  }, [hasUser, location.pathname]);

  return (
    <header className="mobile-top-header" aria-label="Səhifə başlığı">
      <div className="mobile-top-left">
        {!isRoot ? (
          <button onClick={() => navigate(-1)} className="mobile-icon-btn" aria-label="Geri">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <span className="mobile-brand">Onluq</span>
        )}
      </div>
      <div className="mobile-top-title">{title !== 'Onluq' || !isRoot ? title : ''}</div>
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
      </div>
    </header>
  );
}
