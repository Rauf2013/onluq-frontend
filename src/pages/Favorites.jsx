import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart } from 'lucide-react';
import ServiceCard from '../components/ServiceCard';

function Favorites() {
  const [favoriteServices, setFavoriteServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const favKey = currentUser ? `favorites_${currentUser.id}` : null;

      if (!favKey) {
        setFavoriteServices([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/services`);
      const allServices = await response.json();

      const favIds = JSON.parse(localStorage.getItem(favKey)) || [];
      const filtered = allServices.filter(service => favIds.includes(service._id));
      setFavoriteServices(filtered);
    } catch (error) {
      toast.error('Sevimliləri yükləmək mümkün olmadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();

    // Səhifəyə daxil olduqda "görüldü" siyahısını yenilə (badge sıfırlansın)
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    if (currentUser) {
      const favKey = `favorites_${currentUser.id}`;
      const seenKey = `favorites_seen_${currentUser.id}`;
      const favs = JSON.parse(localStorage.getItem(favKey)) || [];
      localStorage.setItem(seenKey, JSON.stringify(favs));
      window.dispatchEvent(new Event('favoritesSeen'));
    }

    window.addEventListener('favoritesUpdated', fetchFavorites);
    return () => window.removeEventListener('favoritesUpdated', fetchFavorites);
  }, []);

  return (
    <div className="main-content" style={{ minHeight: '60vh' }}>
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Heart size={28} fill="#ef4444" color="#ef4444" /> Mənim Sevimlilərim
      </h2>
      
      {loading ? (
        <p>Yüklənir...</p>
      ) : favoriteServices.length > 0 ? (
        <div className="services-grid">
          {favoriteServices.map((service) => {
            const startPrice = service.packages?.length ? Math.min(...service.packages.map((p) => p.price)) : service.price;
            const fastest = service.packages?.length ? Math.min(...service.packages.map((p) => p.deliveryDays)) : service.deliveryDays;
            return (
              <ServiceCard
                key={service._id}
                id={service._id}
                title={service.title}
                author={service.author?.fullName || service.authorName}
                price={startPrice}
                rating={service.rating || 'Yoxdur'}
                image={service.image}
                deliveryDays={fastest}
                level={service.author?.level}
              />
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '24px', color: 'var(--text-primary)', marginBottom: '15px' }}>Hələ heç bir xidməti bəyənməmisiniz.</h3>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '25px' }}>Platformadakı xidmətləri gəzin və bəyəndiklərinizi ürək ikonuna basaraq bura əlavə edin.</p>
          <Link to="/" className="btn-register" style={{ textDecoration: 'none', padding: '12px 24px' }}>
            Xidmətləri Kəşf Et
          </Link>
        </div>
      )}
    </div>
  );
}

export default Favorites;
