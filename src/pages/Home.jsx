import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Star, ImageIcon, User, Search, ShieldCheck, Zap, Award, ChevronDown, Grid, Clock, ShoppingCart, CheckCircle, TrendingUp, Users, Briefcase, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { levelColor } from '../constants/seller';
import { CATEGORY_DATA } from '../constants/categories';

export { CATEGORY_DATA };

function Home() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Bütün Xidmətlər');
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const closeTimerRef = useRef(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const TESTIMONIALS = [
    { name: 'Aysel M.', role: 'Sahibkar', text: 'Loqo dizaynımı 2 günə hazırladılar, əla nəticə! Onluq sayəsində peşəkar mütəxəssis tapdım.', rating: 5 },
    { name: 'Rəşad H.', role: 'Marketinq mütəxəssisi', text: 'Sosial media kampaniyamı buradan sifariş etdim. Sürətli və təhlükəsiz ödəniş sistemi var.', rating: 5 },
    { name: 'Nigar Ə.', role: 'Kiçik biznes sahibi', text: 'Veb saytımı çox uyğun qiymətə hazırlatdım. Komandadan razıyam, hamıya tövsiyə edirəm!', rating: 5 },
    { name: 'Elvin Q.', role: 'Startup qurucusu', text: 'Tərcümə işlərimi həmişə Onluqdan götürürəm. Keyfiyyət və zamanında təslim — mükəmməl!', rating: 4 },
  ];

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const openMenu = (name) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setHoveredMenu(name);
  };

  const scheduleClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setHoveredMenu(null), 180);
  };

  const navigate = useNavigate();
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
        const response = await fetch(`${API_URL}/api/services`);
        const data = await response.json();
        if (response.ok) setServices(data);
      } catch (error) {
        toast.error("Xidmətlər yüklənərkən xəta baş verdi.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const toggleFavorite = (e, serviceId) => {
    e.preventDefault(); 
    if (!currentUser) {
      toast.info("Sevimliyə əlavə etmək üçün giriş etməlisiniz.");
      navigate('/giris');
      return;
    }
    const isFav = favorites.includes(serviceId);
    if (isFav) {
      setFavorites(favorites.filter(id => id !== serviceId));
      toast.info("Xidmət sevimlilərdən çıxarıldı.");
    } else {
      setFavorites([...favorites, serviceId]);
      toast.success("Xidmət sevimlilərə əlavə edildi!");
    }
  };

  const filteredServices = services.filter(s => {
    const searchMatch = searchTerm === '' || s.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'Bütün Xidmətlər') return searchMatch;
    if (!s.category) return false;

    const dbCat = s.category.trim(); 
    const selectedMainCat = CATEGORY_DATA.find(c => c.name === activeCategory);
    
    if (selectedMainCat) {
      return searchMatch && selectedMainCat.subcategories.includes(dbCat);
    }
    return searchMatch && dbCat === activeCategory;
  });

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}>Yüklənir...</div>;

  return (
    <div style={{ width: '100%', background: 'var(--bg-page)', minHeight: '100vh' }}>
      
      {/* ========================================== */}
      {/* MEGA MENÜ — desktop only (native'de gizli, alt tab "Kateqoriya" var) */}
      {/* ========================================== */}
      <div className="home-mega-menu" style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', position: 'relative', zIndex: 100, padding: '10px 5%' }}>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          <div onClick={() => setActiveCategory('Bütün Xidmətlər')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 15px', cursor: 'pointer', background: activeCategory === 'Bütün Xidmətlər' ? '#f0fdf4' : 'transparent', color: activeCategory === 'Bütün Xidmətlər' ? '#10b981' : 'var(--text-secondary)', fontWeight: 'bold', borderRadius: '8px', transition: '0.2s' }}>
            <Grid size={18} /> Bütün Xidmətlər
          </div>

          {CATEGORY_DATA.map((category, index) => {
            const IconComponent = category.icon;
            const isMainActive = activeCategory === category.name || category.subcategories.includes(activeCategory);
            
            const alignRight = index >= 3;

            return (
              <div
                key={category.name}
                onMouseEnter={() => openMenu(category.name)}
                onMouseLeave={scheduleClose}
                style={{ 
                  position: 'relative', 
                  zIndex: hoveredMenu === category.name ? 50 : 1,
                  padding: '10px 15px', 
                  cursor: 'pointer', 
                  background: isMainActive ? '#f0fdf4' : 'transparent', 
                  color: isMainActive ? '#10b981' : 'var(--text-secondary)', 
                  fontWeight: '600', 
                  borderRadius: '8px', 
                  transition: '0.2s', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px' 
                }}
              >
                <IconComponent size={18} />
                <span onClick={() => setActiveCategory(category.name)}>{category.name}</span>
                <ChevronDown size={14} style={{ transform: hoveredMenu === category.name ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                
                {hoveredMenu === category.name && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: alignRight ? 'auto' : '50%',
                    right: alignRight ? '0' : 'auto',
                    transform: alignRight ? 'none' : 'translateX(-50%)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
                    minWidth: '500px',
                    padding: '20px',
                    paddingTop: '30px',  // Boşluq əvəzinə daxili padding — hover sahəsi qırılmır
                    marginTop: '0',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px'
                  }}>
                    
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      left: alignRight ? 'auto' : '50%',
                      right: alignRight ? '20px' : 'auto',
                      transform: alignRight ? 'rotate(45deg)' : 'translateX(-50%) rotate(45deg)',
                      width: '12px',
                      height: '12px',
                      background: 'var(--bg-surface)',
                      borderTop: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)'
                    }}></div>

                    {category.subcategories.map(subCat => (
                      <div 
                        key={subCat}
                        onClick={(e) => { e.stopPropagation(); setActiveCategory(subCat); setHoveredMenu(null); }}
                        style={{ padding: '12px 15px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: activeCategory === subCat ? 'bold' : 'normal', background: activeCategory === subCat ? 'var(--brand-soft)' : 'var(--bg-elevated)', borderRadius: '8px', transition: '0.2s' }}
                        onMouseOver={(e) => { e.target.style.background = 'var(--brand-soft)'; e.target.style.color = '#10b981'; }}
                        onMouseOut={(e) => { e.target.style.background = activeCategory === subCat ? 'var(--brand-soft)' : 'var(--bg-elevated)'; e.target.style.color = 'var(--text-primary)'; }}
                      >
                        {subCat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================== */}
      {/* LOGİN OLMAMIŞ İSTİFADƏÇİ EKRANI (LANDİNG)   */}
      {/* ========================================== */}
      {!currentUser && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '80px 5%', position: 'relative' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <h1 style={{ color: 'white', fontSize: '56px', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px', letterSpacing: '-1px' }}>
                Xəyallarındakı layihəni <span style={{ color: '#10b981' }}>peşəkarlara</span> etibar et.
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '20px', marginBottom: '40px', lineHeight: '1.6' }}>
                Onluq ilə minlərlə frilanser arasından sənə ən uyğun olanı tap, işini sürətli və güvənlə həll et.
              </p>
              <div className="hero-search-bar" style={{ display: 'flex', background: 'var(--bg-surface)', padding: '8px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <Search size={24} color="var(--text-muted)" style={{ margin: 'auto 15px' }} />
                <input type="text" placeholder="Nəyə ehtiyacınız var? (Məs: Loqo, Veb sayt...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, border: 'none', fontSize: '18px', outline: 'none', minWidth: 0, background: 'transparent' }} />
                <button onClick={() => document.getElementById('services-section').scrollIntoView({ behavior: 'smooth' })} style={{ background: '#10b981', color: 'white', border: 'none', padding: '15px 30px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', flexShrink: 0 }}>Axtar</button>
              </div>
            </div>
          </div>

          {/* === NECƏ İŞLƏYİR? === */}
          <div className="home-section" style={{ background: 'var(--bg-surface)', padding: '70px 5%' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h2 className="home-section-title" style={{ textAlign: 'center', fontSize: '36px', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '900' }}>Necə işləyir?</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '16px', marginBottom: '50px' }}>3 sadə addımda istədiyini al</p>
              <div className="how-it-works-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', position: 'relative' }}>
                {[
                  { n: 1, icon: Search, title: 'Axtar', desc: 'Minlərlə xidmət arasından sənə uyğun olanı tap.' },
                  { n: 2, icon: ShoppingCart, title: 'Sifariş ver', desc: 'Paketi seç, təhlükəsiz ödəniş et və işə başlat.' },
                  { n: 3, icon: CheckCircle, title: 'İşini al', desc: 'Tamamlanan işi yoxla, təsdiqlə və rəy bildir.' },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.n} className="hiw-step" style={{ background: 'var(--bg-page)', padding: '36px 24px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)', position: 'relative', animation: `hiwFadeIn 0.6s ease ${i * 0.15}s both` }}>
                      <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', width: 36, height: 36, background: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>{s.n}</div>
                      <div style={{ width: 72, height: 72, background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '12px auto 18px' }}>
                        <Icon size={32} color="#10b981" />
                      </div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>{s.title}</h3>
                      <p style={{ color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* === STATİSTİKA BANDI === */}
          <div className="home-stats-band" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '50px 5%' }}>
            <div className="home-stats-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
              {[
                { icon: Users, num: '5,000+', label: 'Frilanser' },
                { icon: Briefcase, num: '12,000+', label: 'Tamamlanmış sifariş' },
                { icon: Grid, num: `${CATEGORY_DATA.length}+`, label: 'Kateqoriya' },
                { icon: Star, num: '4.8/5', label: 'Orta reytinq' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} style={{ textAlign: 'center', color: 'white' }}>
                    <Icon size={32} style={{ marginBottom: 10, opacity: 0.9 }} />
                    <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{s.num}</div>
                    <div style={{ fontSize: 14, opacity: 0.9, marginTop: 6 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* === MÜŞTƏRİ RƏYLƏRİ === */}
          <div className="home-section" style={{ background: 'var(--bg-surface)', padding: '70px 5%' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <h2 className="home-section-title" style={{ textAlign: 'center', fontSize: '36px', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: '900' }}>Müştərilərimiz nə deyir?</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '16px', marginBottom: '40px' }}>Onluq icmasından həqiqi rəylər</p>
              <div style={{ position: 'relative', background: 'var(--bg-page)', borderRadius: 20, border: '1px solid var(--border)', padding: '40px 50px', minHeight: 220, overflow: 'hidden' }}>
                <Quote size={40} color="#10b981" style={{ opacity: 0.15, position: 'absolute', top: 20, left: 24 }} />
                <div key={testimonialIdx} style={{ animation: 'fadeSlide 0.5s ease' }}>
                  <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic', margin: '0 0 20px', textAlign: 'center' }}>
                    "{TESTIMONIALS[testimonialIdx].text}"
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < TESTIMONIALS[testimonialIdx].rating ? '#fbbf24' : 'none'} color={i < TESTIMONIALS[testimonialIdx].rating ? '#fbbf24' : 'var(--border-strong)'} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{TESTIMONIALS[testimonialIdx].name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{TESTIMONIALS[testimonialIdx].role}</div>
                  </div>
                </div>
                <button onClick={() => setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)} aria-label="Əvvəlki" className="testimonial-nav" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)} aria-label="Növbəti" className="testimonial-nav" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                {TESTIMONIALS.map((_, i) => (
                  <button key={i} onClick={() => setTestimonialIdx(i)} aria-label={`Rəy ${i + 1}`} style={{ width: i === testimonialIdx ? 24 : 8, height: 8, borderRadius: 4, background: i === testimonialIdx ? '#10b981' : 'var(--border-strong)', border: 'none', cursor: 'pointer', transition: '0.3s' }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* LOGİN OLMUŞ İSTİFADƏÇİ EKRANI (DASHBOARD) */}
      {/* ========================================== */}
      {currentUser && (
        <div style={{ maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 5%' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '24px', padding: '50px 40px', marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '36px', color: 'white', fontWeight: '800', textAlign: 'center' }}>
              Yenidən xoş gəldin, {currentUser?.fullName?.split(' ')[0] ?? 'İstifadəçi'}!
            </h1>
            <p style={{ margin: '0 0 35px 0', color: '#d1fae5', fontSize: '18px', textAlign: 'center' }}>Bu gün hansı layihəni həyata keçirmək istəyirsən?</p>
            <div style={{ width: '100%', maxWidth: '700px', display: 'flex', background: 'var(--bg-surface)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', background: 'var(--bg-surface)' }}><Search size={24} color="var(--text-muted)" /></div>
              <input type="text" placeholder="Axtarış edin..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '22px 15px 22px 0', border: 'none', fontSize: '16px', outline: 'none', color: 'var(--text-primary)' }} />
            </div>
          </div>
        </div>
      )}

      {/* === POPULYAR XİDMƏTLƏR CAROUSEL === */}
      {services.length > 0 && (
        <div className="home-section" style={{ background: 'var(--bg-page)', padding: '60px 5%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
              <h2 className="home-section-title" style={{ fontSize: 28, color: 'var(--text-primary)', margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={26} color="#10b981" /> Trend xidmətlər
              </h2>
              <Link to="/kategoriler" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>Hamısını gör →</Link>
            </div>
            <div className="trend-carousel" style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 14, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
              {[...services].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8).map((s) => {
                const startPrice = s.packages?.length ? Math.min(...s.packages.map((p) => p.price)) : s.price;
                return (
                  <Link key={s._id} to={`/xidmet/${s._id}`} className="trend-card" style={{ flex: '0 0 260px', scrollSnapAlign: 'start', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', textDecoration: 'none', color: 'inherit', transition: '0.2s' }}>
                    <div style={{ width: '100%', height: 150, background: 'var(--bg-muted)' }}>
                      {s.image ? <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={32} color="var(--border-strong)" /></div>}
                    </div>
                    <div style={{ padding: 14 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4, minHeight: 40 }}>{s.title.length > 55 ? s.title.substring(0, 55) + '...' : s.title}</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>
                          <Star size={14} fill="#fbbf24" color="#fbbf24" /> {s.rating || '0.0'}
                        </span>
                        <span style={{ fontWeight: 800, color: '#10b981', fontSize: 14 }}>{startPrice} ₼-dən</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* === NİYƏ ONLUQ (yalnız login olmamışlara) === */}
      {!currentUser && (
      <div className="home-section why-onluq" style={{ background: 'var(--bg-surface)', padding: '70px 5%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className="home-section-title" style={{ textAlign: 'center', fontSize: '36px', color: 'var(--text-primary)', marginBottom: '50px', fontWeight: '900' }}>Niyə Onluq Seçməlisən?</h2>
          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {[
              { icon: ShieldCheck, title: 'Təhlükəsiz Ödəniş', desc: 'Siz işi təsdiqləyənə qədər pulunuz Onluq havuzunda güvəndə qalır.' },
              { icon: Zap, title: 'Sürətli Təslim', desc: 'Təcrübəli frilanserlər tərəfindən ən qısa müddətdə işinizi təhvil alın.' },
              { icon: Award, title: 'Yüksək Keyfiyyət', desc: 'Portfolioları incələyərək ən peşəkar mütəxəssisi asanlıqla tapın.' },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="why-card" style={{ background: 'var(--bg-page)', padding: '40px 30px', borderRadius: '20px', textAlign: 'center', border: '1px solid var(--border)', transition: 'transform 0.25s, box-shadow 0.25s' }}>
                  <div style={{ width: '80px', height: '80px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                    <Icon size={40} color="#10b981" />
                  </div>
                  <h3 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '15px', fontWeight: 800 }}>{c.title}</h3>
                  <p style={{ color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* ========================================== */}
      {/* İLANLAR VİTRİNİ */}
      {/* ========================================== */}
      <div id="services-section" style={{ maxWidth: '1200px', margin: '0 auto 80px auto', padding: '0 5%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid var(--border)', paddingBottom: '15px' }}>
          <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', margin: 0, fontWeight: '800' }}>
            {activeCategory === 'Bütün Xidmətlər' ? 'Ən Yeni Elanlar' : `${activeCategory} Nəticələri`} ({filteredServices.length})
          </h2>
        </div>

        {filteredServices.length === 0 ? (
          <div className="no-results-box" style={{padding: '60px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-strong)', color: 'var(--text-tertiary)', fontSize: '18px'}}>
            Bu kateqoriyada və ya axtarışa uyğun xidmət tapılmadı.
          </div>
        ) : (
          <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
            {filteredServices.map(service => {
              const isFav = favorites.includes(service._id);
              const startPrice = service.packages?.length ? Math.min(...service.packages.map((p) => p.price)) : service.price;
              const fastest = service.packages?.length ? Math.min(...service.packages.map((p) => p.deliveryDays)) : service.deliveryDays;
              const lvl = service.author?.level;
              const lc = levelColor(lvl || 'Yeni Satıcı');
              return (
                <div key={service._id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', transition: 'transform 0.2s' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>

                  <button onClick={(e) => toggleFavorite(e, service._id)} aria-label="Sevimliyə əlavə et" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'var(--bg-surface)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Heart size={18} color={isFav ? "#ef4444" : "var(--text-muted)"} fill={isFav ? "#ef4444" : "none"} />
                  </button>

                  <Link to={`/xidmet/${service._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ width: '100%', height: '200px', background: 'var(--bg-muted)', position: 'relative' }}>
                      {service.image ? <img src={service.image} alt={service.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><ImageIcon size={40} color="var(--border-strong)" /></div>}
                      {fastest && (
                        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15, 23, 42, 0.85)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> {fastest} gün
                        </span>
                      )}
                    </div>

                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{service.title.length > 50 ? service.title.substring(0, 50) + '...' : service.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <User size={14} /> {service.author?.fullName || service.authorName || 'Müəllif'}
                        {lvl && (
                          <span style={{ background: lc.bg, color: lc.fg, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Award size={11} /> {lvl}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 'bold' }}><Star size={16} fill="#fbbf24" color="#fbbf24" /> {service.rating || "0.0"} <span style={{color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '13px'}}>({service.reviewsCount || 0})</span></div>
                        <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '15px' }}>{startPrice} ₼-dən</span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default Home;
