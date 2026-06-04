import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, CheckCircle, XCircle, Users, Briefcase, ShoppingBag, Wallet, TrendingUp, Search, UserPlus, UserMinus, Trash2, Star, BarChart3, Power, Lock, AlertTriangle } from 'lucide-react';

const BASE_TABS = [
  { id: 'overview', label: 'Xülasə', icon: BarChart3 },
  { id: 'users', label: 'İstifadəçilər', icon: Users },
  { id: 'services', label: 'Xidmətlər', icon: Briefcase },
  { id: 'orders', label: 'Sifarişlər', icon: ShoppingBag },
  { id: 'withdrawals', label: 'Ödənişlər', icon: Wallet },
];
const SYS_TAB = { id: 'system', label: 'Sistem', icon: Power };

function AdminPanel() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersQ, setUsersQ] = useState('');
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);

  const me = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const isSys = !!me._s;
  const TABS = isSys ? [...BASE_TABS, SYS_TAB] : BASE_TABS;
  const [siteClosed, setSiteClosed] = useState(false);

  const apiHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  const fetchStats = async () => {
    const r = await fetch(`${API_URL}/api/admin/stats`, { headers: apiHeaders() });
    if (r.ok) setStats(await r.json());
    else if (r.status === 403) { toast.error('Yetkisiz giriş.'); navigate('/'); }
  };

  const fetchUsers = async (page = 1, q = '') => {
    const r = await fetch(`${API_URL}/api/admin/users?page=${page}&q=${encodeURIComponent(q)}`, { headers: apiHeaders() });
    if (r.ok) {
      const d = await r.json();
      setUsers(d.items); setUsersTotal(d.total); setUsersPage(d.page);
    }
  };

  const fetchServices = async () => {
    const r = await fetch(`${API_URL}/api/admin/services`, { headers: apiHeaders() });
    if (r.ok) setServices(await r.json());
  };

  const fetchOrders = async () => {
    const r = await fetch(`${API_URL}/api/admin/orders`, { headers: apiHeaders() });
    if (r.ok) setOrders(await r.json());
  };

  const fetchWithdrawals = async () => {
    const r = await fetch(`${API_URL}/api/admin/withdrawals`, { headers: apiHeaders() });
    if (r.ok) setWithdrawals(await r.json());
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    })();
  }, []);

  const fetchSiteStatus = async () => {
    try {
      const r = await fetch(`${API_URL}/api/site/status`);
      const d = await r.json();
      setSiteClosed(!!d.closed);
    } catch {}
  };

  const toggleSite = async (close) => {
    const t = toast.loading(close ? 'Sayt bağlanılır...' : 'Sayt açılır...');
    try {
      const r = await fetch(`${API_URL}/api/site/toggle`, {
        method: 'PUT', headers: apiHeaders(), body: JSON.stringify({ closed: close }),
      });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: close ? 'Sayt bağlandı' : 'Sayt açıldı', type: 'success', isLoading: false, autoClose: 1800 });
        setSiteClosed(!!d.closed);
      } else {
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch {
      toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 });
    }
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers(usersPage, usersQ);
    else if (tab === 'services') fetchServices();
    else if (tab === 'orders') fetchOrders();
    else if (tab === 'withdrawals') fetchWithdrawals();
    else if (tab === 'overview') fetchStats();
    else if (tab === 'system') fetchSiteStatus();
  }, [tab]);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    const t = toast.loading(newRole === 'admin' ? 'Admin edilir...' : 'Adminlik silinir...');
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${u._id}/role`, {
        method: 'PUT', headers: apiHeaders(), body: JSON.stringify({ role: newRole }),
      });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: newRole === 'admin' ? 'Admin edildi' : 'Adminlik silindi', type: 'success', isLoading: false, autoClose: 1800 });
        setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role: newRole } : x)));
      } else {
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch { toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 }); }
  };

  const deleteUser = async (u) => {
    const t = toast.loading('Silinir...');
    try {
      const r = await fetch(`${API_URL}/api/admin/users/${u._id}`, { method: 'DELETE', headers: apiHeaders() });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: 'İstifadəçi silindi', type: 'success', isLoading: false, autoClose: 1800 });
        setUsers((prev) => prev.filter((x) => x._id !== u._id));
        setUsersTotal((n) => n - 1);
      } else {
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch { toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 }); }
  };

  const deleteService = async (s) => {
    const t = toast.loading('Silinir...');
    try {
      const r = await fetch(`${API_URL}/api/services/${s._id}`, { method: 'DELETE', headers: apiHeaders() });
      if (r.ok) {
        toast.update(t, { render: 'Xidmət silindi', type: 'success', isLoading: false, autoClose: 1800 });
        setServices((prev) => prev.filter((x) => x._id !== s._id));
      } else {
        const d = await r.json();
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch { toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 }); }
  };

  const updateWithdrawal = async (id, status) => {
    const t = toast.loading('İşlənir...');
    try {
      const r = await fetch(`${API_URL}/api/admin/withdrawals/${id}`, {
        method: 'PUT', headers: apiHeaders(), body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: d.message, type: 'success', isLoading: false, autoClose: 2200 });
        setWithdrawals((prev) => prev.map((w) => (w._id === id ? { ...w, status } : w)));
      } else {
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch { toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 }); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>Yüklənir...</div>;

  const StatCard = ({ icon: Icon, label, value, sub, color = '#10b981' }) => (
    <div className="admin-stat-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  );

  return (
    <div className="main-content admin-panel" style={{ minHeight: '70vh', maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <h2 className="section-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
          <ShieldCheck size={26} /> Admin Paneli
        </h2>
        <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Giriş edib: <strong style={{ color: 'var(--text-primary)' }}>{me.fullName}</strong></span>
      </div>

      {/* Sekmeler */}
      <div className="admin-tabs" style={{ display: 'flex', gap: 6, marginBottom: 22, borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flexShrink: 0, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: `3px solid ${tab === t.id ? '#ef4444' : 'transparent'}`, color: tab === t.id ? '#ef4444' : 'var(--text-secondary)', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', transition: '0.2s' }}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* XÜLASƏ */}
      {tab === 'overview' && stats && (
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard icon={Users} label="İstifadəçi" value={stats.users} sub={`${stats.admins} admin`} color="#3b82f6" />
          <StatCard icon={Briefcase} label="Xidmət" value={stats.services} color="#10b981" />
          <StatCard icon={ShoppingBag} label="Sifariş" value={stats.orders} sub={`${stats.completedOrders} tamamlanıb`} color="#f59e0b" />
          <StatCard icon={TrendingUp} label="Ümumi gəlir" value={`${stats.totalRevenue} ₼`} color="#8b5cf6" />
          <StatCard icon={Wallet} label="Ödəniş tələbi" value={stats.withdrawals} sub={`${stats.pendingWithdrawals} gözləyir`} color="#ef4444" />
        </div>
      )}

      {/* İSTİFADƏÇİLƏR */}
      {tab === 'users' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 16, maxWidth: 420 }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={usersQ} onChange={(e) => { setUsersQ(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(1, usersQ); }}
              placeholder="Ad, email ilə axtar..." className="auth-input"
              style={{ width: '100%', paddingLeft: 38, marginBottom: 0 }} />
          </div>
          <div className="admin-table-wrap" style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead style={{ background: 'var(--bg-page)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-primary)', fontSize: 13 }}>İstifadəçi</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-primary)', fontSize: 13 }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-primary)', fontSize: 13 }}>Rol</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-primary)', fontSize: 13 }}>Balans</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-primary)', fontSize: 13 }}>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isMe = u._id === me.id;
                  const isAdmin = u.role === 'admin';
                  return (
                    <tr key={u._id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <Link to={`/profil/${u._id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', textDecoration: 'none' }}>
                          <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-muted)', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                            {u.avatar ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.fullName || '?').slice(0, 1).toUpperCase()}
                          </span>
                          <strong style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {u.fullName}
                            {isMe && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(sən)</span>}
                            {u.suspicious && (
                              <span title={u.suspicionReason || 'Şübhəli hesab'} style={{ background: '#fef3c7', color: '#b45309', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={10} /> ŞÜBHƏLİ
                              </span>
                            )}
                          </strong>
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: isAdmin ? '#fee2e2' : 'var(--bg-muted)', color: isAdmin ? '#ef4444' : 'var(--text-secondary)', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                          {isAdmin ? 'Admin' : 'İstifadəçi'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981', fontWeight: 700, fontSize: 13 }}>{u.balance || 0} ₼</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button onClick={() => setConfirmAction({ kind: 'role', user: u, label: isAdmin ? 'Adminlikdən çıxar?' : 'Admin etmək?', desc: isAdmin ? `${u.fullName} adlı istifadəçinin adminliyi silinəcək.` : `${u.fullName} admin olacaq və bütün admin paneline çıxışı olacaq.`, confirmLabel: isAdmin ? 'Adminliyi sil' : 'Admin et', danger: false, run: () => toggleRole(u) })}
                            disabled={isMe && isAdmin}
                            style={{ background: isAdmin ? 'var(--bg-muted)' : '#10b981', color: isAdmin ? 'var(--text-secondary)' : 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: isMe && isAdmin ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: isMe && isAdmin ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {isAdmin ? <><UserMinus size={12} /> Adminliyi sil</> : <><UserPlus size={12} /> Admin et</>}
                          </button>
                          <button onClick={() => setConfirmAction({ kind: 'delete', user: u, label: 'İstifadəçini silmək?', desc: `${u.fullName} hesabı və bütün məlumatları silinəcək. Bu əməliyyat geri alına bilməz.`, confirmLabel: 'Sil', danger: true, run: () => deleteUser(u) })}
                            disabled={isMe}
                            style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 6, cursor: isMe ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: isMe ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={12} /> Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-tertiary)' }}>
            <span>Cəmi {usersTotal} istifadəçi</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => fetchUsers(usersPage - 1, usersQ)} disabled={usersPage <= 1} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', opacity: usersPage <= 1 ? 0.5 : 1 }}>‹</button>
              <span style={{ padding: '6px 12px' }}>Səh. {usersPage}</span>
              <button onClick={() => fetchUsers(usersPage + 1, usersQ)} disabled={usersPage * 30 >= usersTotal} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', opacity: usersPage * 30 >= usersTotal ? 0.5 : 1 }}>›</button>
            </div>
          </div>
        </div>
      )}

      {/* XİDMƏTLƏR */}
      {tab === 'services' && (
        <div className="admin-table-wrap" style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead style={{ background: 'var(--bg-page)' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Başlıq</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Müəllif</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Kateqoriya</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text-primary)' }}>Reytinq</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text-primary)' }}>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s._id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/xidmet/${s._id}`} style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>{(s.title || '').slice(0, 60)}</Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>{s.author?.fullName || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>{s.category || '—'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} fill="#fbbf24" color="#fbbf24" /> {s.rating || '0.0'} ({s.reviewsCount || 0})
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button onClick={() => setConfirmAction({ kind: 'service', label: 'Xidməti silmək?', desc: `"${s.title}" xidməti silinəcək. Bu əməliyyat geri alına bilməz.`, confirmLabel: 'Sil', danger: true, run: () => deleteService(s) })}
                      style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={12} /> Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SİFARİŞLƏR */}
      {tab === 'orders' && (
        <div className="admin-table-wrap" style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead style={{ background: 'var(--bg-page)' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Tarix</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Alıcı</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Xidmət</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text-primary)' }}>Məbləğ</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const c = o.status === 'Tamamlandı' ? '#10b981' : o.status === 'Ləğv edildi' ? '#ef4444' : '#f59e0b';
                return (
                  <tr key={o._id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>{new Date(o.createdAt).toLocaleDateString('az-AZ')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{o.buyerId?.fullName || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-primary)' }}>{(o.serviceId?.title || '—').slice(0, 50)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#10b981', fontWeight: 700 }}>{o.amount} ₼</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${c}20`, color: c, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{o.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ÖDƏNİŞ TƏLƏBLƏRİ */}
      {tab === 'withdrawals' && (
        <div className="admin-table-wrap" style={{ background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead style={{ background: 'var(--bg-page)' }}>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Tarix</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>İstifadəçi</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>IBAN</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text-primary)' }}>Məbləğ</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: 'var(--text-primary)' }}>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const c = w.status === 'Tamamlandı' ? '#10b981' : w.status === 'Rədd Edildi' ? '#ef4444' : '#f59e0b';
                return (
                  <tr key={w._id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-tertiary)' }}>{new Date(w.createdAt).toLocaleDateString('az-AZ')}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{w.userId?.fullName || '—'}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{w.userId?.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all', maxWidth: 200 }}>{w.iban}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, color: '#10b981', fontWeight: 700 }}>{w.amount} ₼</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${c}20`, color: c, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{w.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {w.status === 'Gözləyir' ? (
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button onClick={() => updateWithdrawal(w._id, 'Tamamlandı')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> Ödə
                          </button>
                          <button onClick={() => updateWithdrawal(w._id, 'Rədd Edildi')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <XCircle size={12} /> Rədd
                          </button>
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Bitib</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SİSTEM (yalnız master) */}
      {tab === 'system' && isSys && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Power size={18} color={siteClosed ? '#ef4444' : '#10b981'} /> Saytın vəziyyəti
            </h3>
            <p style={{ margin: '0 0 18px', color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1.6 }}>
              Saytı bağlasan, sənin xaricindəki bütün istifadəçilər <strong>"Bu site admin tərəfindən bağlandı"</strong> səhifəsini görəcək. Sən bütün funksiyaları normal istifadə edə bilərsən.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: siteClosed ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${siteClosed ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: 10, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: siteClosed ? '#ef4444' : '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {siteClosed ? <Lock size={22} /> : <CheckCircle size={22} />}
              </div>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: 15 }}>
                  Hazırda sayt: {siteClosed ? 'BAĞLI' : 'AÇIQ'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  {siteClosed ? 'İstifadəçilər saytı görə bilmir' : 'İstifadəçilər saytı normal istifadə edir'}
                </div>
              </div>
            </div>

            {siteClosed ? (
              <button onClick={() => setConfirmAction({ label: 'Saytı yenidən aç?', desc: 'İstifadəçilər saytı yenidən normal istifadə edə biləcək.', confirmLabel: 'Saytı aç', danger: false, run: () => toggleSite(false) })}
                style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 22px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Power size={16} /> Saytı yenidən aç
              </button>
            ) : (
              <button onClick={() => setConfirmAction({ label: 'Saytı bağlamaq?', desc: 'Bütün istifadəçilər saytı görə bilməyəcək. Yalnız sən normal istifadə edə biləcəksən.', confirmLabel: 'Saytı bağla', danger: true, run: () => toggleSite(true) })}
                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 22px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <Lock size={16} /> Saytı bağla
              </button>
            )}
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Bilgi:</strong> Bu vəziyyət MongoDB-də saxlanılır. Server restart-da da yadda qalır. Saytı bağlasan da sən səhifələri normal görəcəksən.
          </div>
        </div>
      )}

      {/* TƏSDİQ MODAL */}
      {confirmAction && (
        <div className="custom-modal-overlay active" onClick={() => setConfirmAction(null)}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon" style={{ width: 80, height: 80, background: confirmAction.danger ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: confirmAction.danger ? '#ef4444' : '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {confirmAction.danger ? <Trash2 size={32} /> : <ShieldCheck size={32} />}
            </div>
            <h3 style={{ margin: '0 0 8px', textAlign: 'center', fontSize: 20, color: 'var(--text-primary)', fontWeight: 800 }}>{confirmAction.label}</h3>
            <p style={{ margin: '0 0 18px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1.6 }}>{confirmAction.desc}</p>
            <div className="modal-actions">
              <button className="btn-modal-cancel" onClick={() => setConfirmAction(null)}>Ləğv et</button>
              <button className={confirmAction.danger ? 'btn-modal-danger' : 'btn-modal-confirm'}
                onClick={() => { const fn = confirmAction.run; setConfirmAction(null); fn(); }}>
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
