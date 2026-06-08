import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Package, MessageSquare, User, LogIn, Bot } from 'lucide-react';

const ALL_TABS = [
  { key: 'home',     to: '/',             label: 'Ana',         icon: Home,          guestOk: true,  match: (p) => p === '/' },
  { key: 'cats',     to: '/kategoriler',  label: 'Kateqoriya',  icon: LayoutGrid,    guestOk: true,  match: (p) => p.startsWith('/kategoriler') || p.startsWith('/xidmet/') },
  { key: 'ai',       to: '__ai__',        label: 'AI',          icon: Bot,           guestOk: true,  match: () => false, special: 'ai' },
  { key: 'messages', to: '/mesajlar',     label: 'Mesaj',       icon: MessageSquare, guestOk: false, match: (p) => p.startsWith('/mesajlar') },
  { key: 'profile',  to: '__profile__',   label: 'Profil',      icon: User,          guestOk: true,  match: (p) => p.startsWith('/profil') || p === '/cuzdan' || p === '/xidmetlerim' || p === '/sevimliler' || p === '/admin' || p === '/sifarislerim' },
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

  const hidden = ['/giris', '/qeydiyyat', '/sifreni-unutdun'];
  if (hidden.includes(location.pathname) || location.pathname.startsWith('/sifre-yenile/')) return null;

  let tabs = ALL_TABS.filter((t) => hasUser || t.guestOk);

  tabs = tabs.map((t) => {
    if (t.key !== 'profile') return t;
    if (hasUser) return { ...t, to: `/profil/${user.id}` };
    return { ...t, to: '/giris', label: 'Giriş', icon: LogIn, match: (p) => p === '/giris' };
  });

  const openAI = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-ai-chat'));
  };

  return (
    <nav
      className="mobile-tab-bar"
      style={{ '--mtab-count': tabs.length }}
      aria-label="Əsas naviqasiya"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.match(location.pathname);

        // AI tab — NavLink degil, button (modal acar)
        if (tab.special === 'ai') {
          return (
            <button
              key={tab.key}
              onClick={openAI}
              className="mobile-tab mobile-tab-ai"
              type="button"
              aria-label="AI Köməkçi"
            >
              <Icon size={22} strokeWidth={2} />
              <span>{tab.label}</span>
            </button>
          );
        }

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
