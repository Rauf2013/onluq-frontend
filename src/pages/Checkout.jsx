import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, Lock, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { PACKAGE_TIERS } from '../constants/seller';

const formatCardNumber = (raw) =>
  raw.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedTier = location.state?.packageTier || 'bronze';
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`${API_URL}/api/services/${id}`);
        const data = await response.json();
        if (response.ok) {
          setService(data);
        } else {
          toast.error('Xidmət tapılmadı.');
          navigate('/');
        }
      } catch (error) {
        toast.error('Bağlantı xətası.');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, navigate]);

  const validate = () => {
    const next = {};
    if (card.name.trim().split(/\s+/).length < 2) {
      next.name = 'Ad və soyadı tam yazın.';
    }
    const digits = card.number.replace(/\s/g, '');
    if (!/^\d{16}$/.test(digits)) {
      next.number = 'Kart nömrəsi 16 rəqəm olmalıdır.';
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) {
      next.expiry = 'Tarix AA/İİ formatında olmalıdır.';
    }
    if (!/^\d{3,4}$/.test(card.cvv)) {
      next.cvv = 'CVV 3 və ya 4 rəqəm olmalıdır.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsProcessing(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service._id,
          packageTier: chosenPkg ? chosenPkg.tier : requestedTier,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#14224F" />
            Ödəniş uğurla tamamlandı! Pul Havuza köçürüldü.
          </div>
        );
        navigate('/sifarislerim');
      } else {
        toast.error(data.message || 'Xəta baş verdi.');
        setIsProcessing(false);
      }
    } catch (error) {
      toast.error('Bağlantı xətası.');
      setIsProcessing(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>Yüklənir...</div>;
  if (!service) return null;

  const errStyle = { color: 'var(--danger)', fontSize: 12, marginTop: 4 };

  const packages = service.packages || [];
  const chosenPkg = packages.find((p) => p.tier === requestedTier) || packages[0] || null;
  const tierMeta = PACKAGE_TIERS.find((t) => t.tier === (chosenPkg?.tier || 'bronze'));
  const totalPrice = chosenPkg ? chosenPkg.price : service.price;
  const totalDays = chosenPkg ? chosenPkg.deliveryDays : service.deliveryDays;

  return (
    <div className="main-content" style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', maxWidth: '500px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <CreditCard size={28} color="#14224F" /> Təhlükəsiz Ödəniş
        </h2>

        <div style={{ background: 'var(--bg-muted)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Sifariş Detayı:</h4>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>{service.title}</h3>
          {chosenPkg && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{ background: tierMeta?.bg, color: tierMeta?.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                {tierMeta?.label} {chosenPkg.title ? `— ${chosenPkg.title}` : ''}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', fontSize: 13 }}>
                <Clock size={13} /> {chosenPkg.deliveryDays} gün
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)', fontSize: 13 }}>
                <RefreshCw size={13} /> {chosenPkg.revisions} revizyon
              </span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-tertiary)' }}>Toplam Məbləğ:</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--brand)' }}>{totalPrice} AZN</span>
          </div>
        </div>

        <form onSubmit={handlePayment} noValidate>
          <div className="form-group">
            <label htmlFor="cc-name">Kartın Üzərindəki Ad</label>
            <input
              id="cc-name"
              type="text"
              className="auth-input"
              placeholder="Ad Soyad"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              autoComplete="cc-name"
              required
            />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="cc-number">Kart Nömrəsi</label>
            <input
              id="cc-number"
              type="text"
              inputMode="numeric"
              className="auth-input"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={card.number}
              onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
              autoComplete="cc-number"
              required
            />
            {errors.number && <div style={errStyle}>{errors.number}</div>}
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="cc-exp">Bitmə Tarixi</label>
              <input
                id="cc-exp"
                type="text"
                inputMode="numeric"
                className="auth-input"
                placeholder="AA/İİ"
                maxLength={5}
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                autoComplete="cc-exp"
                required
              />
              {errors.expiry && <div style={errStyle}>{errors.expiry}</div>}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="cc-csc">CVV</label>
              <input
                id="cc-csc"
                type="text"
                inputMode="numeric"
                className="auth-input"
                placeholder="123"
                maxLength={4}
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                autoComplete="cc-csc"
                required
              />
              {errors.cvv && <div style={errStyle}>{errors.cvv}</div>}
            </div>
          </div>

          <button
            type="submit"
            className="btn-publish"
            style={{ width: '100%', marginTop: '20px', fontSize: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: isProcessing ? 0.7 : 1 }}
            disabled={isProcessing}
          >
            {isProcessing ? 'Ödəniş İşlənir...' : `Təsdiqlə və Ödə (${totalPrice} AZN)`}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Lock size={12} /> Bütün ödənişlər 256-bit SSL ilə qorunur.
        </p>
      </div>
    </div>
  );
}

export default Checkout;
