import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Briefcase, Plus, Trash2, Tag, ImageIcon, AlertTriangle, TrendingUp, DollarSign, Eye, Package, Star, BarChart3, Award } from 'lucide-react';

function MyServices() {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const fetchStats = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/stats/my-services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {}
  };

  const fetchMyServices = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return navigate('/giris');

    try {
      const response = await fetch(`${API_URL}/api/services/my-services`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setServices(data);
      }
    } catch (error) {
      toast.error("Xidmətlər yüklənərkən xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyServices();
    fetchStats();
  }, []);

  // Silme butonuna basılınca sadece modalı açar
  const handleDeleteClick = (serviceId) => {
    setServiceToDelete(serviceId);
    setIsDeleteModalOpen(true);
  };

  // Modaldaki "Bəli" butonuna basılınca çalışacak asıl silme fonksiyonu
  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const loadToast = toast.loading("Silinir...");

    try {
      const response = await fetch(`${API_URL}/api/services/${serviceToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.update(loadToast, { render: "Xidmət uğurla silindi.", type: "success", isLoading: false, autoClose: 3000 });
        fetchMyServices(); 
      } else {
        const data = await response.json();
        toast.update(loadToast, { render: data.message || "Silinmə zamanı xəta.", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(loadToast, { render: "Bağlantı xətası.", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}>Yüklənir...</div>;

  const maxMonthlyRevenue = stats ? Math.max(1, ...stats.monthly.map(m => m.revenue)) : 1;

  return (
    <div className="main-content" style={{ minHeight: '70vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Briefcase size={28} color="#0f172a" /> Mənim Xidmətlərim
        </h2>
        <Link to="/yeni-xidmet" className="btn-publish" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <Plus size={18} /> Yeni Xidmət
        </Link>
      </div>

      {/* ============= STATİSTİKA DASHBOARD ============= */}
      {stats && (
        <div style={{ marginBottom: '40px' }}>
          {/* Üst sayğaclar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'linear-gradient(135deg, #14224F 0%, #0C1733 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>Ümumi Gəlir</span>
                <DollarSign size={24} style={{ opacity: 0.9 }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900' }}>{stats.totals.totalRevenue.toFixed(2)} AZN</h3>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Tamamlanmış Satış</span>
                <Package size={24} color="#3b82f6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>{stats.totals.totalSales}</h3>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Ümumi Baxış</span>
                <Eye size={24} color="#f59e0b" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>{stats.totals.totalViews}</h3>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>Aktiv Xidmət</span>
                <Briefcase size={24} color="#8b5cf6" />
              </div>
              <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)' }}>{stats.totals.activeServices}</h3>
            </div>
          </div>

          {/* Aylıq gəlir grafiki + Ən çox baxılan */}
          <div className="ms-income-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                <BarChart3 size={22} color="#14224F" /> Son 6 ayın gəliri
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '180px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                {stats.monthly.map((m, idx) => {
                  const heightPct = (m.revenue / maxMonthlyRevenue) * 100;
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{m.revenue > 0 ? m.revenue.toFixed(0) : ''}</span>
                      <div
                        title={`${m.label}: ${m.revenue} AZN, ${m.sales} satış`}
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          minHeight: m.revenue > 0 ? '4px' : '0',
                          background: 'linear-gradient(180deg, #14224F 0%, #0C1733 100%)',
                          borderRadius: '8px 8px 0 0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                {stats.monthly.map((m, idx) => (
                  <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '600' }}>{m.label}</div>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(245,158,11,0.2)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 15px 0', fontSize: '16px' }}>
                <Award size={20} /> Ən Çox Baxılan
              </h3>
              {stats.mostViewed ? (
                <>
                  <p style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '700', lineHeight: '1.4' }}>
                    {stats.mostViewed.title}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.85 }}>Baxış</div>
                      <div style={{ fontSize: '24px', fontWeight: '900' }}>{stats.mostViewed.views}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.85 }}>Satış</div>
                      <div style={{ fontSize: '24px', fontWeight: '900' }}>{stats.mostViewed.sales}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.85 }}>Reytinq</div>
                      <div style={{ fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={20} fill="white" /> {stats.mostViewed.rating}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, opacity: 0.85 }}>Hələ baxış yoxdur.</p>
              )}
            </div>
          </div>

          {/* Hər xidmət üzrə detallı cədvəl */}
          {stats.perService.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.04)', marginBottom: '20px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', fontSize: '18px', color: 'var(--text-primary)' }}>
                <TrendingUp size={22} color="#14224F" /> Xidmət Üzrə Performans
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Xidmət</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Baxış</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Satış</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Reytinq</th>
                      <th style={{ padding: '12px 8px', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Gəlir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.perService.map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                        <td style={{ padding: '14px 8px', color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' }}>
                          <Link to={`/xidmet/${s._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{s.title}</Link>
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{s.views}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{s.sales}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} fill="#f59e0b" color="#f59e0b" /> {s.rating}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', color: '#14224F', fontWeight: '900', fontSize: '15px' }}>{s.revenue} AZN</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {services.length === 0 ? (
        <div className="no-results-box" style={{padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed #cbd5e1', color: 'var(--text-tertiary)'}}>
          Hələ heç bir xidmət əlavə etməmisiniz.
        </div>
      ) : (
        <div className="my-services-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {services.map(service => (
            <div key={service._id} className="my-service-card" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div className="service-img-preview" style={{ width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', marginRight: '20px', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {service.image ? (
                  <img src={service.image} alt={service.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon size={32} color="#cbd5e1" />
                )}
              </div>
              <div className="service-details" style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--text-primary)' }}>{service.title}</h3>
                <div style={{ display: 'flex', gap: '15px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Tag size={14} /> Kateqoriya: {service.category}</span>
                  <span style={{ fontWeight: 'bold', color: '#14224F' }}>Qiymət: {service.price} AZN</span>
                </div>
              </div>
              <div className="service-actions">
                {/* YENİ: Sil butonuna basınca artık tarayıcı promt'u değil, kendi özel modalımız açılır */}
                <button 
                  onClick={() => handleDeleteClick(service._id)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                >
                  <Trash2 size={16} /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YENİ: SİLME İŞLEMİ İÇİN ÖZEL MODAL TASARIMI */}
      <div className={`custom-modal-overlay ${isDeleteModalOpen ? 'active' : ''}`} onClick={() => setIsDeleteModalOpen(false)}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '400px' }}>
          
          <div className="modal-icon" style={{ width: '80px', height: '80px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
            <AlertTriangle size={40} />
          </div>
          
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Xidməti silmək istədiyinizə əminsiniz?</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
            Bu xidmət tamamilə silinəcək və geri qaytarılması mümkün olmayacaq. Davam etmək istədiyinizdən əminsiniz?
          </p>
          
          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              className="btn-modal-cancel" 
              onClick={() => setIsDeleteModalOpen(false)}
              style={{ flex: 1, padding: '12px' }}
            >
              Ləğv Et
            </button>
            <button 
              onClick={confirmDelete}
              style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Bəli, Sil
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default MyServices;
