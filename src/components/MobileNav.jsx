import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Package, MessageSquare, User } from 'lucide-react';

const TABS = [
  { to: '/',              label: 'Ana',          icon: Home,           match: (p) => p === '/' },
  { to: '/kategoriler',   label: 'Kateqoriya',   icon: LayoutGrid,     match: (p) => p.startsWith('/kategoriler') || p.startsWith('/xidmet/') },
  { to: '/sifarislerim',  label: 'Sifarişlər',   icon: Package,        match: (p) => p.startsWith('/sifaris') },
  { to: '/mesajlar',      label: 'Mesaj',        icon: MessageSquare,  match: (p) => p.startsWith('/mesajlar') },
  { to: '/profil/me',     label: 'Profil',       icon: User,           match: (p) => p.startsWith('/profil') || p === '/cuzdan' || p === '/xidmetlerim' },
];

function readUserId() {
  try {
    const s = localStorage.getItem('user') || sessionStorage.getItem('user');
    return s ? JSON.parse(s).id : null;
  } catch { return null; }
}

export default function MobileNav() {
  const location = useLocation();
  const userId = readUserId();

  // Login/register sayfalarinda gizle
  const hidden = ['/giris', '/qeydiyyat', '/sifreni-unutdun'];
  if (hidden.includes(location.pathname) || location.pathname.startsWith('/sifre-yenile/')) return null;

  return (
    <nav className="mobile-tab-bar" aria-label="Əsas naviqasiya">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(location.pathname);
        const to = tab.to === '/profil/me' ? (userId ? `/profil/${userId}` : '/giris') : tab.to;
        return (
          <NavLink
            key={tab.label}
            to={to}
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
