import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Heart, Star, User, Clock, Award } from 'lucide-react';
import { levelColor } from '../constants/seller';

function ServiceCard({ id, title, author, price, rating, image, deliveryDays, level }) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const isAuthenticated = !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const favKey = currentUser ? `favorites_${currentUser.id}` : null;

  useEffect(() => {
    if (!favKey) { setIsFavorite(false); return; }
    const favs = JSON.parse(localStorage.getItem(favKey)) || [];
    setIsFavorite(favs.includes(id));
  }, [id, favKey]);

  const handleCardClick = () => navigate(`/xidmet/${id || 1}`);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated || !favKey) {
      toast.warning('Sevimlilərə əlavə etmək üçün əvvəlcə giriş etməlisiniz!', { theme: 'colored' });
      return;
    }
    let favs = JSON.parse(localStorage.getItem(favKey)) || [];
    if (isFavorite) {
      favs = favs.filter((favId) => favId !== id);
      setIsFavorite(false);
      toast.info('Xidmət sevimlilərdən çıxarıldı.', { autoClose: 1500 });
    } else {
      favs.push(id);
      setIsFavorite(true);
      toast.success('Xidmət sevimlilərə əlavə edildi!', { autoClose: 1500 });
    }
    localStorage.setItem(favKey, JSON.stringify(favs));
    window.dispatchEvent(new Event('favoritesUpdated'));
  };

  const lc = levelColor(level || 'Yeni Satıcı');

  return (
    <div className="service-card" onClick={handleCardClick}>
      <div className="card-image-placeholder" style={{ position: 'relative' }}>
        {image ? <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="img-fallback">Şəkil</div>}

        {deliveryDays && (
          <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(15, 23, 42, 0.85)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {deliveryDays} gün
          </span>
        )}

        <button onClick={handleFavoriteClick} className="favorite-btn" title={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'} aria-label={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Heart size={18} color={isFavorite ? '#ef4444' : 'var(--text-muted)'} fill={isFavorite ? '#ef4444' : 'none'} />
        </button>
      </div>

      <div className="card-content">
        <div className="card-author" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div className="author-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="var(--text-secondary)" />
          </div>
          <span>{author}</span>
          {level && (
            <span style={{ background: lc.bg, color: lc.fg, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Award size={11} /> {level}
            </span>
          )}
        </div>
        <h3 className="card-title">{title}</h3>
        <div className="card-footer">
          <div className="card-rating" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={16} fill="#f59e0b" color="#f59e0b" /> {rating}
          </div>
          <div className="card-price">Başlayan qiymətlərlə <strong>{price} AZN</strong></div>
        </div>
      </div>
    </div>
  );
}

export default ServiceCard;
