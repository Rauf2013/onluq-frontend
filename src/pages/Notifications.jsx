import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Bell, Check, Trash2, Package, MessageSquare, UserPlus, Info } from 'lucide-react';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('hamisi'); // hamisi | oxunmamis
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const fetchNotifications = async () => {
    if (!currentUser) {
      navigate('/giris');
      return;
    }
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setNotifications(data);
    } catch (e) {
      toast.error('Bildirişlər gətirilə bilmədi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Bütün bildirişlər oxundu olaraq işarələndi.');
    } catch (e) {
      toast.error('Xəta baş verdi.');
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      toast.error('Silinmədi.');
    }
  };

  const handleClick = (n) => {
    const isOrder = n.type === 'order' || /sifariş|təhvil|təsdiqlə|düzəliş/i.test(n.message);
    const isMessage = n.type === 'message' || /mesaj/i.test(n.message);
    const isFollow = n.type === 'follow' || /izləm/i.test(n.message);

    if (isOrder) {
      navigate('/sifarislerim');
    } else if (isMessage) {
      const partnerId = n.senderId ? (n.senderId._id || n.senderId) : null;
      const partnerName = n.senderId ? (n.senderId.fullName || 'Bilinməyən') : 'Bilinməyən';
      navigate('/mesajlar', { state: { partnerId, partnerName } });
    } else if (isFollow) {
      const senderId = n.senderId ? (n.senderId._id || n.senderId) : null;
      if (senderId) navigate(`/profil/${senderId}`);
    }
  };

  const getIcon = (n) => {
    const isOrder = n.type === 'order' || /sifariş|təhvil|təsdiqlə|düzəliş/i.test(n.message);
    const isMessage = n.type === 'message' || /mesaj/i.test(n.message);
    const isFollow = n.type === 'follow' || /izləm/i.test(n.message);
    if (isOrder) return <Package size={20} color="#10b981" />;
    if (isMessage) return <MessageSquare size={20} color="#3b82f6" />;
    if (isFollow) return <UserPlus size={20} color="#f59e0b" />;
    return <Info size={20} color="var(--text-muted)" />;
  };

  const filtered = notifications.filter(n => filter === 'hamisi' ? true : !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Yüklənir...</div>;

  return (
    <div className="main-content" style={{ minHeight: '70vh', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={28} color="#10b981" /> Bildirişlər
          {unreadCount > 0 && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: '14px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>
              {unreadCount} yeni
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={16} /> Hamısını Oxundu Et
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setFilter('hamisi')} style={{ background: filter === 'hamisi' ? 'var(--text-primary)' : 'var(--bg-muted)', color: filter === 'hamisi' ? 'white' : 'var(--text-secondary)', border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
          Hamısı ({notifications.length})
        </button>
        <button onClick={() => setFilter('oxunmamis')} style={{ background: filter === 'oxunmamis' ? 'var(--text-primary)' : 'var(--bg-muted)', color: filter === 'oxunmamis' ? 'white' : 'var(--text-secondary)', border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
          Oxunmamış ({unreadCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="no-results-box" style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
          <Bell size={40} color="var(--border-strong)" style={{ marginBottom: '15px' }} />
          <p>Heç bir bildiriş yoxdur.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(n => (
            <div
              key={n._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '15px',
                background: n.isRead ? 'white' : '#f0fdf4',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid ' + (n.isRead ? 'var(--border)' : '#bbf7d0'),
                transition: '0.2s'
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{getIcon(n)}</div>
              <div onClick={() => handleClick(n)} style={{ flex: 1, cursor: 'pointer' }}>
                <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: n.isRead ? '500' : '700' }}>
                  {n.message}
                </p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  {new Date(n.createdAt).toLocaleString('az-AZ')}
                </span>
              </div>
              <button
                onClick={() => handleDelete(n._id)}
                title="Sil"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
