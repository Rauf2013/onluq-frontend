import React, { useState } from 'react';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PlusCircle, UploadCloud, X, HelpCircle, Trash2, Plus } from 'lucide-react';
import { CATEGORY_DATA } from '../constants/categories';
import { PACKAGE_TIERS } from '../constants/seller';

const blankPackages = () => ({
  bronze: { tier: 'bronze', title: 'Bronz Paket',  description: 'Əsas xidmət', price: '', deliveryDays: '', revisions: 1, features: ['', '', ''] },
  silver: { tier: 'silver', title: 'Gümüş Paket',  description: 'Daha geniş xidmət', price: '', deliveryDays: '', revisions: 2, features: ['', '', ''] },
  gold:   { tier: 'gold',   title: 'Qızıl Paket',  description: 'Tam paket', price: '', deliveryDays: '', revisions: 3, features: ['', '', ''] },
});

function CreateService() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const [title, setTitle] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [packages, setPackages] = useState(blankPackages());
  const [activeTab, setActiveTab] = useState('bronze');
  const [faq, setFaq] = useState([{ question: '', answer: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = CATEGORY_DATA.find((c) => c.name === mainCategory);
  const subs = selected ? selected.subcategories : [];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 6) {
      return toast.error('Maksimum 6 şəkil yükləyə bilərsiniz.');
    }
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return toast.error(`${file.name}: 5MB-dan kiçik olmalıdır.`);
      const reader = new FileReader();
      reader.onloadend = () => setImages((prev) => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const updatePkg = (tier, field, value) => {
    setPackages((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  };
  const updateFeature = (tier, idx, value) => {
    setPackages((prev) => {
      const features = [...prev[tier].features];
      features[idx] = value;
      return { ...prev, [tier]: { ...prev[tier], features } };
    });
  };
  const addFeature = (tier) => updatePkg(tier, 'features', [...packages[tier].features, '']);
  const removeFeature = (tier, idx) => updatePkg(tier, 'features', packages[tier].features.filter((_, i) => i !== idx));

  const updateFaq = (i, field, value) => setFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  const addFaq = () => setFaq((prev) => [...prev, { question: '', answer: '' }]);
  const removeFaq = (i) => setFaq((prev) => prev.filter((_, idx) => idx !== i));

  const validatePackages = () => {
    for (const t of ['bronze', 'silver', 'gold']) {
      const p = packages[t];
      if (t === 'bronze' || p.price || p.deliveryDays) {
        if (!p.price || Number(p.price) < 5) return `${t.toUpperCase()}: qiymət ən az 5 AZN olmalıdır.`;
        if (!p.deliveryDays || Number(p.deliveryDays) < 1) return `${t.toUpperCase()}: təhvil müddəti ən az 1 gün olmalıdır.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subCategory) return toast.warning('Alt kateqoriyanı seçin.');
    const err = validatePackages();
    if (err) return toast.error(err);

    const pkgList = ['bronze', 'silver', 'gold']
      .map((t) => packages[t])
      .filter((p) => p.price && p.deliveryDays)
      .map((p) => ({
        ...p,
        price: Number(p.price),
        deliveryDays: Number(p.deliveryDays),
        revisions: Number(p.revisions) || 0,
        features: p.features.filter((f) => f.trim()),
      }));

    setIsSubmitting(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/services`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category: subCategory,
          description,
          image: images[0],
          images,
          packages: pkgList,
          faq: faq.filter((f) => f.question.trim() && f.answer.trim()),
        }),
      });
      if (response.ok) {
        toast.success('Xidmət uğurla yaradıldı!');
        navigate('/xidmetlerim');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Xəta baş verdi.');
      }
    } catch {
      toast.error('Bağlantı xətası.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    navigate('/giris');
    return null;
  }

  const card = { background: 'var(--bg-surface)', padding: 30, borderRadius: 16, border: '1px solid var(--border)', marginBottom: 25 };
  const labelStyle = { fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'block', fontSize: 14 };

  return (
    <div className="main-content" style={{ maxWidth: 900, margin: '40px auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', marginBottom: 20, fontSize: 26 }}>
        <PlusCircle size={28} color="#10b981" /> Yeni Xidmət Yarat
      </h2>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div className="form-group">
            <label style={labelStyle}>Başlıq</label>
            <input type="text" className="auth-input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} placeholder="Məs: Peşəkar loqo dizaynı hazırlayıram" style={{ width: '100%', padding: 12 }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 15 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={labelStyle}>Ana kateqoriya</label>
              <select className="auth-input" value={mainCategory} onChange={(e) => { setMainCategory(e.target.value); setSubCategory(''); }} required style={{ width: '100%', padding: 12 }}>
                <option value="">Seçin...</option>
                {CATEGORY_DATA.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={labelStyle}>Alt kateqoriya</label>
              <select className="auth-input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} required disabled={!mainCategory} style={{ width: '100%', padding: 12 }}>
                <option value="">Seçin...</option>
                {subs.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 15 }}>
            <label style={labelStyle}>Xidmət haqqında ətraflı məlumat</label>
            <textarea className="auth-input" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ width: '100%', padding: 12, minHeight: 130 }} />
          </div>
        </div>

        <div style={card}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 15, fontSize: 18 }}>Şəkil galereyası (maks. 6)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 12 }}>
            {images.map((src, i) => (
              <div key={i} style={{ position: 'relative', height: 110, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={src} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
                {i === 0 && <span style={{ position: 'absolute', bottom: 6, left: 6, background: '#10b981', color: 'white', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Əsas</span>}
              </div>
            ))}
            {images.length < 6 && (
              <label style={{ height: 110, border: '2px dashed var(--border-strong)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexDirection: 'column', gap: 4 }}>
                <UploadCloud size={24} /><span style={{ fontSize: 12 }}>Şəkil əlavə et</span>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>İlk şəkil əsas (kapak) olur. Hər şəkil 5MB-dan kiçik olmalıdır.</div>
        </div>

        <div style={card}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 15, fontSize: 18 }}>Paketlər (Bronz məcburi)</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
            {PACKAGE_TIERS.map((t) => (
              <button key={t.tier} type="button" onClick={() => setActiveTab(t.tier)}
                style={{ padding: '10px 20px', border: 'none', background: 'transparent', borderBottom: `2px solid ${activeTab === t.tier ? t.color : 'transparent'}`, color: activeTab === t.tier ? t.color : 'var(--text-tertiary)', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}>
                {t.label}
              </button>
            ))}
          </div>

          {PACKAGE_TIERS.map((t) => {
            if (activeTab !== t.tier) return null;
            const p = packages[t.tier];
            return (
              <div key={t.tier}>
                <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label style={labelStyle}>Paket başlığı</label>
                    <input type="text" className="auth-input" value={p.title} onChange={(e) => updatePkg(t.tier, 'title', e.target.value)} maxLength={40} style={{ width: '100%', padding: 10 }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={labelStyle}>Qiymət (AZN)</label>
                    <input type="number" className="auth-input" value={p.price} onChange={(e) => updatePkg(t.tier, 'price', e.target.value)} min={5} required={t.tier === 'bronze'} style={{ width: '100%', padding: 10 }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={labelStyle}>Müddət (gün)</label>
                    <input type="number" className="auth-input" value={p.deliveryDays} onChange={(e) => updatePkg(t.tier, 'deliveryDays', e.target.value)} min={1} required={t.tier === 'bronze'} style={{ width: '100%', padding: 10 }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={labelStyle}>Revizyon</label>
                    <input type="number" className="auth-input" value={p.revisions} onChange={(e) => updatePkg(t.tier, 'revisions', e.target.value)} min={0} style={{ width: '100%', padding: 10 }} />
                  </div>
                </div>
                <div className="form-group">
                  <label style={labelStyle}>Qısa açıqlama</label>
                  <textarea className="auth-input" value={p.description} onChange={(e) => updatePkg(t.tier, 'description', e.target.value)} maxLength={400} style={{ width: '100%', padding: 10, minHeight: 70 }} />
                </div>
                <div className="form-group" style={{ marginTop: 10 }}>
                  <label style={labelStyle}>Daxil olanlar</label>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input type="text" className="auth-input" value={f} onChange={(e) => updateFeature(t.tier, i, e.target.value)} placeholder="Məs: 3 logo variantı" style={{ flex: 1, padding: 10 }} />
                      <button type="button" onClick={() => removeFeature(t.tier, i)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-tertiary)', cursor: 'pointer', width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addFeature(t.tier)} style={{ background: 'transparent', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={14} /> Maddə əlavə et
                  </button>
                </div>
                {t.tier !== 'bronze' && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>İstəsəniz boş buraxa bilərsiniz — yalnız Bronz məcburidir.</div>}
              </div>
            );
          })}
        </div>

        <div style={card}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 15, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HelpCircle size={20} color="#10b981" /> Tez-tez verilən suallar (FAQ)
          </h3>
          {faq.map((f, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 12, background: 'var(--bg-page)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <input type="text" className="auth-input" value={f.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} placeholder="Sual" style={{ width: '100%', padding: 10, marginBottom: 8 }} />
              <textarea className="auth-input" value={f.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} placeholder="Cavab" style={{ width: '100%', padding: 10, minHeight: 60 }} />
              {faq.length > 1 && (
                <button type="button" onClick={() => removeFaq(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Trash2 size={14} /> Sil
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addFaq} style={{ background: 'transparent', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Sual əlavə et
          </button>
        </div>

        <button type="submit" disabled={isSubmitting} style={{ background: '#10b981', color: 'white', border: 'none', padding: 16, borderRadius: 12, fontSize: 17, fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, width: '100%' }}>
          {isSubmitting ? 'Yaradılır...' : 'Xidməti Yayımla'}
        </button>
      </form>
    </div>
  );
}

export default CreateService;
