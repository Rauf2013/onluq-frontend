import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Star, ImageIcon, User, Search, Clock, Award } from 'lucide-react';
import { CATEGORY_DATA } from '../constants/categories';
import { levelColor } from '../constants/seller';

function Categories() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Bütün Xidmətlər');
  const [levelFilter, setLevelFilter] = useState('all');

  const categories = ['Bütün Xidmətlər', ...CATEGORY_DATA.map((c) => c.name)];

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
        toast.error("Xəta baş verdi.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const toggleFavorite = (e, serviceId) => {
    e.preventDefault();
    const isFav = favorites.includes(serviceId);
    if (isFav) {
      setFavorites(favorites.filter(id => id !== serviceId));
      toast.info("Xidmət sevimlilərdən çıxarıldı.");
    } else {
      setFavorites([...favorites, serviceId]);
      toast.success("Xidmət sevimlilərə əlavə edildi!");
    }
  };

  const filteredServices = services.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = levelFilter === 'all' || (s.author?.level === levelFilter);
    let matchCat = true;
    if (activeCategory !== 'Bütün Xidmətlər') {
      if (!s.category) matchCat = false;
      else {
        const dbCat = s.category.trim();
        const main = CATEGORY_DATA.find((c) => c.name === activeCategory);
        matchCat = main ? (dbCat === main.name || main.subcategories.includes(dbCat)) : (dbCat === activeCategory);
      }
    }
    return matchSearch && matchCat && matchLevel;
  });

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}>Yüklənir...</div>;

  return (
    <div className="main-content" style={{ minHeight: '70vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Xidmətlər və Kateqoriyalar</h2>
        <div style={{ position: 'relative', width: '300px' }}>
          <input 
            type="text" 
            className="auth-input" 
            placeholder="Xidmət axtar..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ width: '100%', paddingLeft: '40px', marginBottom: 0 }} 
          />
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '15px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ background: activeCategory === cat ? '#10b981' : 'var(--bg-muted)', color: activeCategory === cat ? 'white' : 'var(--text-secondary)', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap', transition: '0.2s' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, marginRight: 4 }}>Satıcı səviyyəsi:</span>
        {[
          { v: 'all',           l: 'Hamısı' },
          { v: 'Yeni Satıcı',   l: 'Yeni' },
          { v: 'Onaylı Satıcı', l: 'Onaylı' },
          { v: 'Pro Satıcı',    l: 'Pro' },
          { v: 'Süper Satıcı',  l: 'Süper' },
        ].map((o) => (
          <button
            key={o.v}
            onClick={() => setLevelFilter(o.v)}
            style={{ background: levelFilter === o.v ? '#0f172a' : 'var(--bg-surface)', color: levelFilter === o.v ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 999, cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', transition: '0.2s' }}
          >
            {o.l}
          </button>
        ))}
      </div>

      {filteredServices.length === 0 ? (
        <div className="no-results-box" style={{padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-tertiary)'}}>Axtarışa uyğun xidmət tapılmadı.</div>
      ) : (
        <div className="services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
          {filteredServices.map(service => {
            const isFav = favorites.includes(service._id);
            const startPrice = service.packages?.length ? Math.min(...service.packages.map((p) => p.price)) : service.price;
            const fastest = service.packages?.length ? Math.min(...service.packages.map((p) => p.deliveryDays)) : service.deliveryDays;
            const lvl = service.author?.level;
            const lc = levelColor(lvl || 'Yeni Satıcı');
            return (
              <div key={service._id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', transition: 'transform 0.2s' }}>

                <button
                  onClick={(e) => toggleFavorite(e, service._id)}
                  aria-label={isFav ? 'Sevimlilərdən çıxar' : 'Sevimliyə əlavə et'}
                  style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, background: 'var(--bg-surface)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: '0.2s' }}
                >
                  <Heart size={18} color={isFav ? "#ef4444" : "var(--text-muted)"} fill={isFav ? "#ef4444" : "none"} />
                </button>

                <Link to={`/xidmet/${service._id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ width: '100%', height: '200px', background: 'var(--bg-muted)', position: 'relative' }}>
                    {service.image ? (
                      <img src={service.image} alt={service.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}><ImageIcon size={40} color="var(--border-strong)" /></div>
                    )}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                        <Star size={16} fill="#fbbf24" color="#fbbf24" /> {service.rating || "0.0"} <span style={{color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '13px'}}>({service.reviewsCount || 0})</span>
                      </div>
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
  );
}

export default Categories;
