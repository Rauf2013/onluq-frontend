import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Package, MessageSquare, User, LogIn } from 'lucide-react';

const ALL_TABS = [
  { key: 'home',     to: '/',             label: 'Ana',         icon: Home,          guestOk: true,  match: (p) => p === '/' },
  { key: 'cats',     to: '/kategoriler',  label: 'Kateqoriya',  icon: LayoutGrid,    guestOk: true,  match: (p) => p.startsWith('/kategoriler') || p.startsWith('/xidmet/') },
  { key: 'orders',   to: '/sifarislerim', label: 'Sifariş',     icon: Package,       guestOk: false, match: (p) => p.startsWith('/sifaris') },
  { key: 'messages', to: '/mesajlar',     label: 'Mesaj',       icon: MessageSquare, guestOk: false, match: (p) => p.startsWith('/mesajlar') },
  { key: 'profile',  to: '__profile__',   label: 'Profil',      icon: User,          guestOk: true,  match: (p) => p.startsWith('/profil') || p === '/cuzdan' || p === '/xidmetlerim' || p === '/sevimliler' || p === '/admin' },
];

function readUser() {
  try {
    const s = localStorage.getItem('user') || sessionStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export default function MobileNav() {
  const location = useLocation();
  const user = readUser();
  const hasUser = !!user;

  // Login/register sayfalarinda tum tab bar gizli
  const hidden = ['/giris', '/qeydiyyat', '/sifreni-unutdun'];
  if (hidden.includes(location.pathname) || location.pathname.startsWith('/sifre-yenile/')) return null;

  // Guest'lerde sadece guestOk tab'lar + son sirada "Giriş"
  let tabs = ALL_TABS.filter((t) => hasUser || t.guestOk);

  // Profile tab'inin yolunu cozumle
  tabs = tabs.map((t) => {
    if (t.key !== 'profile') return t;
    if (hasUser) return { ...t, to: `/profil/${user.id}` };
    // Guest'de "Profil" yerine "Giriş" gosterir, login sayfasina goturur
    return { ...t, to: '/giris', label: 'Giriş', icon: LogIn, match: (p) => p === '/giris' };
  });

  return (
    <nav
      className="mobile-tab-bar"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      aria-label="Əsas naviqasiya"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(location.pathname);
        return (
          <NavLink
            key={tab.key}
            to={tab.to}
            className={`mobile-tab ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
