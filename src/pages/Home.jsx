import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search, CreditCard, MessageCircle, Star,
  ClipboardList, Wallet, MessageSquare, Bot, Layers, UserCog,
  UserPlus, ClipboardCheck, ArrowRight,
  Heart, ImageIcon, Award, Clock, User,
} from 'lucide-react';
import { CATEGORY_DATA } from '../constants/categories';
import { levelColor } from '../constants/seller';
import EvdenLogo from '../components/EvdenLogo';

export { CATEGORY_DATA };

// ============================================
//   EVDƏN — landing page (PDF dizaynına uyğun)
//   1) Hero (navy + sarı logo + tagline + CTA)
//   2) "EVDƏN nədir?" — 4 feature card
//   3) "Platformanın modulları" — 8 module card
//   4) "İstifadəçi axını" — 6 step flow
//   5) Xidmətlər (functional list)
// ============================================

// --- Page 3: 4 feature ---
const FEATURES = [
  { icon: Search,        accent: 'navy',   title: 'Tap & sifariş et',     desc: 'Xidməti axtar, müqayisə et, dərhal sifariş ver.' },
  { icon: CreditCard,    accent: 'yellow', title: 'Təhlükəsiz ödəniş',   desc: 'Cüzdan üzərindən qorunan ödəniş axını.' },
  { icon: MessageCircle, accent: 'navy',   title: 'Real-time mesajlaşma', desc: 'Sifarişçi və icraçı birbaşa danışır.' },
  { icon: Star,          accent: 'yellow', title: 'Reytinq & etibar',     desc: 'Rəylər və qiymətləndirmə ilə şəffaflıq.' },
];

// --- Page 4: 8 module ---
const MODULES = [
  { icon: ClipboardList, accent: 'navy',   title: 'Xidmət elanları',     desc: 'Kateqoriya üzrə elan yaratma və axtarış.' },
  { icon: CreditCard,    accent: 'yellow', title: 'Sifariş & ödəniş',   desc: 'Sifariş axını və qorunan ödəniş.' },
  { icon: Wallet,        accent: 'navy',   title: 'Cüzdan',              desc: 'Balans, daxil/çıxış əməliyyatları.' },
  { icon: MessageSquare, accent: 'yellow', title: 'Mesajlaşma',          desc: 'Socket.io ilə real-time söhbət.' },
  { icon: Star,          accent: 'navy',   title: 'Profil & reytinq',    desc: 'İcraçı profili, rəylər, sevimlilər.' },
  { icon: Bot,           accent: 'yellow', title: 'AI köməkçi',          desc: 'Ağıllı tövsiyə və dəstək.' },
  { icon: Layers,        accent: 'navy',   title: 'Kateqoriya & axtarış', desc: 'Strukturlaşmış kateqoriyalar.' },
  { icon: UserCog,       accent: 'yellow', title: 'Admin panel',         desc: 'İdarəetmə və moderasiya.' },
];

// --- Page 5: 6 step user flow ---
const FLOW = [
  { n: 1, icon: UserPlus,        accent: 'navy',   label: 'Qeydiyyat' },
  { n: 2, icon: Search,          accent: 'yellow', label: 'Xidmət tap / elan ver' },
  { n: 3, icon: ClipboardCheck,  accent: 'navy',   label: 'Sifariş' },
  { n: 4, icon: MessageCircle,   accent: 'yellow', label: 'Razılaşma & mesaj' },
  { n: 5, icon: CreditCard,      accent: 'navy',   label: 'Ödəniş + cüzdan' },
  { n: 6, icon: Star,            accent: 'yellow', label: 'Reytinq' },
];

function EvdenCard({ icon: Icon, accent, title, desc }) {
  return (
    <div className="evden-card">
      <div className={`evden-card-icon ${accent}`}>
        <Icon size={28} strokeWidth={2.2} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function FlowStep({ n, icon: Icon, accent, label, isLast }) {
  return (
    <>
      <div className="evden-flow-step">
        <div className={`evden-flow-circle ${accent}`}>
          <span className="evden-flow-num">{n}</span>
          <Icon size={26} strokeWidth={2.2} />
        </div>
        <div className="evden-flow-label">{label}</div>
      </div>
      {!isLast && <ArrowRight className="evden-flow-arrow" size={22} />}
    </>
  );
}

function Home() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const favKey = currentUser ? `favorites_${currentUser.id}` : null;

  const [favorites, setFavorites] = useState(() => {
    if (!favKey) return [];
    const saved = localStorage.getItem(favKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (!favKey) return;
    localStorage.setItem(favKey, JSON.stringify(favorites));
    window.dispatchEvent(new Event('favoritesUpdated'));
  }, [favorites, favKey]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const r = await fetch(`${API_URL}/api/services`);
        const d = await r.json();
        if (r.ok) setServices(d);
      } catch {
        toast.error('Xidmətlər yüklənərkən xəta baş verdi.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const toggleFavorite = (e, serviceId) => {
    e.preventDefault();
    if (!currentUser) {
      toast.info('Sevimliyə əlavə etmək üçün giriş etməlisiniz.');
      navigate('/giris');
      return;
    }
    const isFav = favorites.includes(serviceId);
    if (isFav) {
      setFavorites(favorites.filter((id) => id !== serviceId));
    } else {
      setFavorites([...favorites, serviceId]);
    }
  };

  const featured = services.slice(0, 8);

  // Axtarış (yalnız daxil olmuş dashboard üçün)
  const [search, setSearch] = useState('');
  const submitSearch = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/kategoriler?q=${encodeURIComponent(q)}` : '/kategoriler');
  };

  // ---- Ortaq: xidmət kartları grid'i (hər iki ekranda göstərilir) ----
  const servicesGrid = (
    loading ? (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>Yüklənir...</div>
    ) : featured.length === 0 ? (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
        Hələ elan yoxdur. <Link to="/yeni-xidmet" style={{ color: 'var(--brand)', fontWeight: 700 }}>İlk elan ver →</Link>
      </div>
    ) : (
      <div className="evden-services-grid">
        {featured.map((s) => {
          const isFav = favorites.includes(s._id);
          const startPrice = s.packages?.length ? Math.min(...s.packages.map((p) => p.price)) : s.price;
          const fastest = s.packages?.length ? Math.min(...s.packages.map((p) => p.deliveryDays)) : s.deliveryDays;
          const lc = levelColor(s.author?.level || 'Yeni Satıcı');
          return (
            <Link key={s._id} to={`/xidmet/${s._id}`} className="evden-service-card">
              <div className="evden-service-img">
                {s.images?.[0] ? (
                  <img src={s.images[0]} alt={s.title} />
                ) : (
                  <div className="evden-service-img-fallback"><ImageIcon size={32} /></div>
                )}
                {fastest && (
                  <span className="evden-service-badge">
                    <Clock size={12} /> {fastest} gün
                  </span>
                )}
                <button
                  className="evden-service-fav"
                  onClick={(e) => toggleFavorite(e, s._id)}
                  aria-label={isFav ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
                >
                  <Heart size={16} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : 'var(--text-muted)'} />
                </button>
              </div>
              <div className="evden-service-body">
                <div className="evden-service-author">
                  <User size={14} />
                  <span>{s.author?.fullName || 'Anonim'}</span>
                  {s.author?.level && (
                    <span style={{ background: lc.bg, color: lc.fg, padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                      <Award size={9} style={{ display: 'inline', marginRight: 2 }} />
                      {s.author.level}
                    </span>
                  )}
                </div>
                <h3 className="evden-service-title">{s.title}</h3>
                <div className="evden-service-footer">
                  <span className="evden-service-rating"><Star size={14} fill="#FFED00" color="#FFED00" /> {s.rating || '—'}</span>
                  <span className="evden-service-price"><strong>{startPrice}</strong> AZN</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    )
  );

  // ============================================
  //   DAXİL OLMUŞ İSTİFADƏÇİ — Dashboard
  // ============================================
  if (currentUser) {
    const firstName = (currentUser.fullName || '').split(' ')[0] || 'istifadəçi';
    return (
      <div className="evden-page">
        {/* Salamlama + axtarış */}
        <section className="evden-dash-hero">
          <div className="evden-dash-inner">
            <p className="evden-dash-hi">Xoş gəldin, {firstName} 👋</p>
            <h1 className="evden-dash-title">Bu gün hansı xidmət lazımdır?</h1>
            <form className="evden-dash-search" onSubmit={submitSearch}>
              <Search size={20} color="var(--text-muted)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Xidmət axtar (məs: Loqo, Veb sayt...)"
              />
              <button type="submit" className="btn-evden-cta">Axtar</button>
            </form>
            <div className="evden-dash-actions">
              <button className="evden-dash-action" onClick={() => navigate('/yeni-xidmet')}>
                <ClipboardList size={18} /> Elan ver
              </button>
              <button className="evden-dash-action" onClick={() => navigate('/sifarislerim')}>
                <ClipboardCheck size={18} /> Sifarişlərim
              </button>
              <button className="evden-dash-action" onClick={() => navigate('/cuzdan')}>
                <Wallet size={18} /> Cüzdan
              </button>
              <button className="evden-dash-action" onClick={() => navigate('/mesajlar')}>
                <MessageSquare size={18} /> Mesajlar
              </button>
            </div>
          </div>
        </section>

        {/* Kateqoriyalar chip */}
        <section className="evden-section" style={{ paddingBottom: 30 }}>
          <div className="evden-section-inner">
            <h2 className="evden-section-title" style={{ fontSize: 24 }}>Kateqoriyalar</h2>
            <div className="evden-cat-chips">
              {CATEGORY_DATA.map((c) => {
                const Icon = c.icon;
                return (
                  <button key={c.name} className="evden-cat-chip" onClick={() => navigate('/kategoriler')}>
                    {Icon && <Icon size={16} />}
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Xidmətlər feed */}
        <section className="evden-section evden-section-muted" id="services-section">
          <div className="evden-section-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <h2 className="evden-section-title" style={{ fontSize: 24, marginBottom: 0 }}>Son xidmətlər</h2>
              <Link to="/kategoriler" style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Hamısını gör →</Link>
            </div>
            {servicesGrid}
          </div>
        </section>
      </div>
    );
  }

  // ============================================
  //   QONAQ (giriş yapmamış) — Tanıtım landing (PDF)
  // ============================================
  return (
    <div className="evden-page">

      {/* PAGE 1 — HERO */}
      <section className="evden-hero">
        <div className="evden-hero-inner">
          <EvdenLogo size={104} style={{ color: 'var(--accent)' }} />
          <h1 className="evden-hero-title">EVDƏN</h1>
          <p className="evden-hero-tagline">Evdən başlayan xidmət bazarı</p>
          <p className="evden-hero-sub">
            İşini evdən tap, xidmətini evdən sifariş et — hər şey bir tətbiqdə.
          </p>
          <div className="evden-hero-cta">
            <button className="btn-evden-cta evden-hero-btn" onClick={() => navigate('/qeydiyyat')}>
              Qeydiyyatdan keç
            </button>
            <button className="evden-hero-btn-ghost" onClick={() => navigate('/giris')}>
              Daxil ol
            </button>
          </div>
        </div>
      </section>

      {/* PAGE 3 — EVDƏN nədir? (4 feature) */}
      <section className="evden-section">
        <div className="evden-section-inner">
          <h2 className="evden-section-title">EVDƏN nədir?</h2>
          <p className="evden-section-lead">
            <strong>Peşəkarları və müştəriləri birləşdirən xidmət bazarı.</strong>
            <br/>
            İşini evdən tap, xidmətini evdən sifariş et — hər şey bir tətbiqdə.
          </p>
          <div className="evden-features-grid">
            {FEATURES.map((f) => <EvdenCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* PAGE 4 — Platformanın modulları (8 module) */}
      <section className="evden-section evden-section-muted">
        <div className="evden-section-inner">
          <h2 className="evden-section-title">Platformanın modulları</h2>
          <div className="evden-modules-grid">
            {MODULES.map((m) => <EvdenCard key={m.title} {...m} />)}
          </div>
        </div>
      </section>

      {/* PAGE 5 — İstifadəçi axını (6 step) */}
      <section className="evden-section">
        <div className="evden-section-inner">
          <h2 className="evden-section-title">İstifadəçi axını</h2>
          <div className="evden-flow">
            {FLOW.map((s, i) => (
              <FlowStep key={s.n} {...s} isLast={i === FLOW.length - 1} />
            ))}
          </div>
          <p className="evden-flow-note">
            Bütün axın bir tətbiqdə — qeydiyyatdan reytinqə qədər istifadəçi heç vaxt platformadan çıxmır.
          </p>
        </div>
      </section>

      {/* Xidmətlər (functional preview) */}
      <section className="evden-section evden-section-muted" id="services-section">
        <div className="evden-section-inner">
          <h2 className="evden-section-title">Xidmətlər</h2>
          <p className="evden-section-lead">Platformadakı son elanlar.</p>
          {servicesGrid}
          {featured.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <button className="btn-evden-cta evden-hero-btn" onClick={() => navigate('/qeydiyyat')} style={{ borderRadius: 12 }}>
                Qeydiyyatdan keç və sifariş ver →
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}

export default Home;
