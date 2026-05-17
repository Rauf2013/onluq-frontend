import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { toast } from 'react-toastify';
import { Package, CheckCircle, UploadCloud, RefreshCw, Star, ExternalLink, AlertTriangle, User, Clock, Check, X, MessageSquare, Briefcase } from 'lucide-react';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('aktiv'); 

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // Modal Kontrolleri
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryData, setDeliveryData] = useState({ orderId: null, note: '', url: '' });

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionData, setRevisionData] = useState({ orderId: null, note: '' });

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedApproveId, setSelectedApproveId] = useState(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ orderId: null, serviceId: null, rating: 5, comment: '' });

  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const fetchOrders = async (isSilent = false) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/orders/my-orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data);
      }
    } catch (error) {
      if (!isSilent) toast.error("Bağlantı xətası.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeliver = async () => {
    if (!deliveryData.note.trim() || !deliveryData.url.trim()) {
      toast.error('Zəhmət olmasa açıqlama və linki daxil edin');
      return;
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/orders/${deliveryData.orderId}/deliver`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryNote: deliveryData.note,
          deliveryUrl: deliveryData.url
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("İş uğurla təhvil verildi!");
        // Sipariş listesini güncelle
        fetchOrders(true);
        // Modalı kapat
        setIsDeliveryModalOpen(false);
        // DeliveryData'yı sıfırla
        setDeliveryData({ orderId: null, note: '', url: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || "Təhvil vermə xətası.");
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    }
  };

  const handleRevise = async () => {
    if (!revisionData.note.trim()) {
      toast.error('Zəhmət olmasa düzəliş səbəbini yazın.');
      return;
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/orders/${revisionData.orderId}/revision`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          revisionNote: revisionData.note
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Düzəliş istəyi uğurla göndərildi!");
        // Sipariş listesini güncelle
        fetchOrders(true);
        // Modalı kapat
        setIsRevisionModalOpen(false);
        // RevisionData'yı sıfırla
        setRevisionData({ orderId: null, note: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || "Düzəliş istəyi xətası.");
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    }
  };

  const handleApprove = async () => {
    if (!selectedApproveId) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/orders/${selectedApproveId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Sifariş uğurla təsdiqləndi!");
        // Sipariş listesini güncelle
        fetchOrders(true);
        // Modalı kapat
        setIsApproveModalOpen(false);
        // selectedApproveId'yi sıfırla
        setSelectedApproveId(null);
      } else {
        const error = await response.json();
        toast.error(error.message || "Təsdiqləmə xətası.");
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    }
  };

  const handleReview = async () => {
    if (!reviewData.comment.trim()) {
      toast.warning("Zəhmət olmasa bir rəy yazın!", { theme: "colored" });
      return;
    }
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      toast.warning("Düzgün bir reytinq seçin (1-5).", { theme: "colored" });
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/orders/${reviewData.orderId}/review`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewData.rating,
          comment: reviewData.comment
        })
      });
      
      if (response.ok) {
        toast.success("Rəyiniz uğurla əlavə edildi!");
        setIsReviewModalOpen(false);
        fetchOrders(true);
        // ReviewData'yı sıfırla
        setReviewData({ orderId: null, serviceId: null, rating: 5, comment: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || "Rəy əlavə edilə bilmədi.");
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    }
  };

  const handleDeleteOrderClick = (orderId) => {
    setOrderToDelete(orderId);
    setIsDeleteOrderModalOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setOrders(prev => prev.filter(o => o._id !== orderToDelete));
        toast.success("Sifariş siyahıdan silindi.");
      } else {
        toast.error("Sifariş silinə bilmədi.");
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    } finally {
      setIsDeleteOrderModalOpen(false);
      setOrderToDelete(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Havuzda (Gözləyir)': return { color: '#f59e0b', bg: '#fef3c7', icon: <Clock size={14} /> };
      case 'Təhvil Verildi': return { color: '#3b82f6', bg: '#dbeafe', icon: <UploadCloud size={14} /> };
      case 'Düzəliş Gözləyir': return { color: '#f97316', bg: '#ffedd5', icon: <RefreshCw size={14} /> };
      case 'Tamamlandı': return { color: '#10b981', bg: '#d1fae5', icon: <CheckCircle size={14} /> };
      case 'Ləğv Edildi': return { color: '#ef4444', bg: '#fee2e2', icon: <AlertTriangle size={14} /> };
      default: return { color: 'var(--text-tertiary)', bg: '#f1f5f9', icon: <Package size={14} /> };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'aktiv') return order.status !== 'Tamamlandı' && order.status !== 'Ləğv Edildi';
    return order.status === 'Tamamlandı' || order.status === 'Ləğv Edildi';
  });

  if (loading) return <div style={{textAlign: 'center', padding: '100px', color: 'var(--text-tertiary)'}}>Sifarişlər yüklənir...</div>;

  return (
    <div className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', minHeight: '80vh' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#10b981', padding: '12px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}>
          <Package size={28} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)', fontWeight: '800' }}>Sifarişlərim</h1>
          <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '15px' }}>Aldığınız və satdığınız bütün xidmətləri buradan idarə edin.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' }}>
        <button 
          onClick={() => setActiveTab('aktiv')}
          style={{ background: activeTab === 'aktiv' ? '#0f172a' : 'transparent', color: activeTab === 'aktiv' ? 'white' : '#64748b', border: 'none', padding: '10px 24px', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={18} /> Aktiv Sifarişlər
        </button>
        <button 
          onClick={() => setActiveTab('keçmiş')}
          style={{ background: activeTab === 'keçmiş' ? '#0f172a' : 'transparent', color: activeTab === 'keçmiş' ? 'white' : '#64748b', border: 'none', padding: '10px 24px', borderRadius: '30px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CheckCircle size={18} /> Keçmiş Sifarişlər
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '20px', padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--bg-page)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#cbd5e1' }}>
            <Briefcase size={40} />
          </div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '10px' }}>Burada hələ ki heç nə yoxdur</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '15px' }}>Seçdiyiniz kateqoriyaya aid sifariş tapılmadı.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filteredOrders.map((order) => {
            const isSeller = currentUser && order.sellerId?._id === currentUser.id;
            const isBuyer = currentUser && order.buyerId?._id === currentUser.id;
            const badge = getStatusBadge(order.status);
            
            return (
              <div key={order._id} style={{ background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '20px', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#cbd5e1'} onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-soft)', paddingBottom: '15px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>SİFARİŞ #{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {badge.icon} {order.status}
                    </span>

                    {(order.status === 'Tamamlandı' || order.status === 'Ləğv Edildi') && (
                      <button 
                        onClick={() => handleDeleteOrderClick(order._id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', borderRadius: '50%', transition: '0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        title="Sifarişi Siyahıdan Sil"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: order.serviceId ? '#0f172a' : '#94a3b8', fontWeight: '700', textDecoration: order.serviceId ? 'none' : 'line-through' }}>
                      {order.serviceId?.title || 'Silinmiş Xidmət'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--bg-page)', padding: '4px 10px', borderRadius: '8px' }}>
                        <User size={14} color="#10b981" /> 
                        <span style={{ fontWeight: '600' }}>{isSeller ? `Alıcı: ${order.buyerId?.fullName}` : `Satıcı: ${order.sellerId?.fullName}`}</span>
                      </div>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981' }}>
                    {order.price} AZN
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  
                  {isSeller && (order.status === 'Havuzda (Gözləyir)' || order.status === 'Düzəliş Gözləyir') && (
                    <button onClick={() => { setDeliveryData({ orderId: order._id, note: '', url: '' }); setIsDeliveryModalOpen(true); }} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                      <UploadCloud size={16} /> İşi Təhvil Ver
                    </button>
                  )}

                  {isBuyer && order.status === 'Təhvil Verildi' && (
                    <>
                      <button onClick={() => { setSelectedApproveId(order._id); setIsApproveModalOpen(true); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <CheckCircle size={16} /> Təsdiqlə
                      </button>
                      <button onClick={() => { setRevisionData({ orderId: order._id, note: '' }); setIsRevisionModalOpen(true); }} style={{ background: '#f97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                        <RefreshCw size={16} /> Düzəliş İstə
                      </button>
                    </>
                  )}

                  {isBuyer && order.status === 'Tamamlandı' && !order.isReviewed && order.serviceId && (
                    <button onClick={() => { setReviewData({ orderId: order._id, serviceId: order.serviceId._id, rating: 5, comment: '' }); setIsReviewModalOpen(true); }} style={{ background: '#fbbf24', color: '#78350f', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                      <Star size={16} fill="#78350f" /> Rəy Bildir
                    </button>
                  )}
                  
                  {order.status === 'Tamamlandı' && order.isReviewed && isBuyer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#d1fae5', padding: '8px 15px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} fill={star <= (order.review?.rating || 0) ? "#fbbf24" : "#cbd5e1"} color={star <= (order.review?.rating || 0) ? "#fbbf24" : "#cbd5e1"} />
                        ))}
                      </div>
                      <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                        {order.review?.comment ? `"${order.review.comment.substring(0, 30)}${order.review.comment.length > 30 ? '...' : ''}"` : 'Rəy bildirilib.'}
                      </span>
                    </div>
                  )}
                </div>
                
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODALLAR ================= */}
      
      {/* 1. Təhvil Vermə Modalı */}
      {isDeliveryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UploadCloud color="#3b82f6" /> İşi Təhvil Ver
            </h3>
            <textarea placeholder="Alıcıya mesajınız (Məs: Sifarişiniz hazırdır...)" style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '12px', border: 'none', background: 'var(--bg-muted)', marginBottom: '15px', outline: 'none', fontSize: '14px', resize: 'vertical' }} value={deliveryData.note} onChange={(e) => setDeliveryData({...deliveryData, note: e.target.value})} />
            <input type="text" placeholder="Fayl Linki (Google Drive, WeTransfer və s.)" style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: 'var(--bg-muted)', marginBottom: '25px', outline: 'none', fontSize: '14px' }} value={deliveryData.url} onChange={(e) => setDeliveryData({...deliveryData, url: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsDeliveryModalOpen(false)}>Ləğv Et</button>
              <button style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleDeliver}>Təhvil Ver</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Düzəliş Modalı */}
      {isRevisionModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw color="#f97316" /> Düzəliş İstə
            </h3>
            <textarea placeholder="Nələrin dəyişməsini istəyirsiniz? Detallı yazın..." style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', border: 'none', background: 'var(--bg-muted)', marginBottom: '25px', outline: 'none', fontSize: '14px', resize: 'vertical' }} value={revisionData.note} onChange={(e) => setRevisionData({...revisionData, note: e.target.value})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsRevisionModalOpen(false)}>Ləğv Et</button>
              <button style={{ flex: 1, background: '#f97316', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleRevise}>Göndər</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Təsdiq Modalı */}
      {isApproveModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '70px', height: '70px', background: '#d1fae5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
              <CheckCircle size={35} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '20px' }}>Sifarişi Təsdiqlə</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              Bu əməliyyatdan sonra ödəniş satıcının hesabına köçürüləcək. İşi tam və qüsursuz təhvil aldığınıza əminsiniz?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsApproveModalOpen(false)}>Ləğv Et</button>
              <button style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleApprove}>Bəli, Təsdiqlə</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Dəyərləndirmə Modalı */}
      {isReviewModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Star fill="#fbbf24" color="#fbbf24" /> Satıcını Dəyərləndir
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} style={{ cursor: 'pointer', transition: '0.2s', transform: star <= reviewData.rating ? 'scale(1.1)' : 'scale(1)' }} onClick={() => setReviewData({...reviewData, rating: star})}>
                  <Star size={40} fill={star <= reviewData.rating ? "#fbbf24" : "none"} color={star <= reviewData.rating ? "#fbbf24" : "#cbd5e1"} />
                </span>
              ))}
            </div>

            <textarea placeholder="Satıcı və xidmət barədə təcrübənizi bölüşün..." style={{ width: '100%', minHeight: '120px', padding: '15px', borderRadius: '12px', border: 'none', background: 'var(--bg-muted)', marginBottom: '25px', outline: 'none', fontSize: '14px', resize: 'vertical' }} value={reviewData.comment} onChange={(e) => setReviewData({...reviewData, comment: e.target.value})} />
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsReviewModalOpen(false)}>Ləğv Et</button>
              <button style={{ flex: 1, background: '#0f172a', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleReview}>Göndər</button>
            </div>
          </div>
        </div>
      )}

      {/* YENİ: 5. Sifariş Silmə (X) Modalı */}
      {isDeleteOrderModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '70px', height: '70px', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
              <AlertTriangle size={35} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '20px' }}>Sifarişi Sil</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>
              Bu sifarişi siyahınızdan həmişəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ flex: 1, background: 'var(--bg-muted)', color: 'var(--text-secondary)', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setIsDeleteOrderModalOpen(false)}>Ləğv Et</button>
              <button style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={confirmDeleteOrder}>Bəli, Sil</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Orders;
