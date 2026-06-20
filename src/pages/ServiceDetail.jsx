import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Star, Clock, User, MessageSquare, ShoppingCart, Image as ImageIcon, ChevronRight, ChevronLeft, RefreshCw, Check, ChevronDown, ChevronUp, Award, Reply, Trash2, X as XIcon, Calendar, ShoppingBag, CheckCircle, XCircle, Eye, Activity, Package, BarChart3 } from 'lucide-react';
import { PACKAGE_TIERS, levelColor } from '../constants/seller';
import { azFullDate } from '../utils/azDate';

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [activePkg, setActivePkg] = useState('bronze');
  const [activeTab, setActiveTab] = useState('about');
  const [openFaq, setOpenFaq] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/services/${id}`);
        const data = await response.json();
        if (response.ok) {
          setService(data);
          setActiveImg(0);
          const tiers = (data.packages || []).map((p) => p.tier);
          if (tiers.length && !tiers.includes('bronze')) setActivePkg(tiers[0]);
          else setActivePkg('bronze');
        } else {
          toast.error('Xidmət tapılmadı.');
          navigate('/');
        }
      } catch {
        toast.error('Bağlantı xətası.');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, navigate]);

  const loadReviews = async () => {
    try {
      const r = await fetch(`${API_URL}/api/services/${id}/reviews`);
      const d = await r.json();
      if (r.ok) setReviews(d);
    } catch {}
    setReviewsLoaded(true);
  };

  useEffect(() => {
    if (activeTab === 'reviews' && !reviewsLoaded) loadReviews();
  }, [activeTab, reviewsLoaded]);

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>Yüklənir...</div>;
  if (!service) return <div style={{ textAlign: 'center', padding: 100 }}>Xidmət tapılmadı.</div>;

  const gallery = (service.images && service.images.length ? service.images : [service.image]).filter(Boolean);
  const packages = service.packages || [];
  const selectedPkg = packages.find((p) => p.tier === activePkg) || packages[0] || null;
  const sellerLvl = service.author?.level || 'Yeni Satıcı';
  const lc = levelColor(sellerLvl);

  const handleContactSeller = () => {
    if (!currentUser) {
      toast.info('Mesaj yazmaq üçün giriş etməlisiniz.');
      return navigate('/giris');
    }
    const partnerId = service.author?._id || service.authorId;
    const partnerName = service.author?.fullName || service.authorName || 'Satıcı';
    if (currentUser.id === partnerId) return toast.warning('Öz elanınıza mesaj göndərə bilməzsiniz!');
    navigate('/mesajlar', { state: { partnerId, partnerName } });
  };

  const handleOrder = () => {
    if (!currentUser) {
      toast.info('Sifariş vermək üçün giriş etməlisiniz.');
      return navigate('/giris');
    }
    const partnerId = service.author?._id || service.authorId;
    if (currentUser.id === partnerId) return toast.warning('Öz xidmətinizi sifariş edə bilməzsiniz!');
    navigate(`/odeme/${service._id}`, { state: { packageTier: activePkg } });
  };

  const prevImg = () => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % gallery.length);

  const isAuthor = currentUser && (service.author?._id === currentUser.id || service.authorId === currentUser.id);

  const submitReply = async (reviewId) => {
    if (!replyText.trim()) return toast.warning('Cavab boş ola bilməz.');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const t = toast.loading('Göndərilir...');
    try {
      const r = await fetch(`${API_URL}/api/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim() }),
      });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: 'Cavab göndərildi', type: 'success', isLoading: false, autoClose: 1800 });
        setReviews((prev) => prev.map((x) => (x._id === reviewId ? d.review : x)));
        setReplyingTo(null);
        setReplyText('');
      } else {
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2000 });
      }
    } catch {
      toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2000 });
    }
  };

  const deleteReply = async (reviewId) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const r = await fetch(`${API_URL}/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (r.ok) {
        setReviews((prev) => prev.map((x) => (x._id === reviewId ? { ...x, sellerReply: { text: '', createdAt: null } } : x)));
        toast.success('Cavab silindi');
      }
    } catch {}
  };

  return (
    <div className="main-content" style={{ maxWidth: 1200, margin: '40px auto', padding: '0 5%' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 14, marginBottom: 20 }}>
        <Link to="/" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 700 }}>Ana Səhifə</Link>
        <ChevronRight size={14} />
        <span>{service.category}</span>
      </div>

      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        <div style={{ flex: '1 1 60%', minWidth: 300 }}>
          <h1 style={{ fontSize: 30, color: 'var(--text-primary)', margin: '0 0 18px 0', lineHeight: 1.3, fontWeight: 800 }}>
            {service.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="var(--text-tertiary)" />
              </div>
              <Link to={service.author?._id ? `/profil/${service.author._id}` : '#'} style={{ color: 'var(--text-primary)', fontWeight: 700, textDecoration: 'none' }}>
                {service.author?.fullName || 'Satıcı'}
              </Link>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: lc.bg, color: lc.fg, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              <Award size={13} /> {sellerLvl}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)', fontWeight: 700 }}>
              <Star size={18} fill="#fbbf24" color="#fbbf24" />
              {service.rating || '0.0'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({service.reviewsCount || 0} rəy)</span>
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', height: 450, borderRadius: 16, background: 'var(--bg-page)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
            {gallery[activeImg] ? (
              <img src={gallery[activeImg]} alt={service.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={60} color="var(--border-strong)" />
              </div>
            )}
            {gallery.length > 1 && (
              <>
                <button onClick={prevImg} aria-label="Əvvəlki" style={navBtn('left')}><ChevronLeft size={22} /></button>
                <button onClick={nextImg} aria-label="Sonrakı" style={navBtn('right')}><ChevronRight size={22} /></button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 30, overflowX: 'auto', paddingBottom: 4 }}>
              {gallery.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{ flex: '0 0 90px', height: 70, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === activeImg ? '#14224F' : 'var(--border)'}`, cursor: 'pointer', padding: 0, background: 'transparent' }}>
                  <img src={src} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          <div className="sd-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <TabBtn active={activeTab === 'about'} onClick={() => setActiveTab('about')}>Açıqlama</TabBtn>
            {service.faq?.length > 0 && (
              <TabBtn active={activeTab === 'faq'} onClick={() => setActiveTab('faq')}>FAQ ({service.faq.length})</TabBtn>
            )}
            <TabBtn active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>Rəylər ({service.reviewsCount || 0})</TabBtn>
          </div>

          {activeTab === 'about' && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.8, whiteSpace: 'pre-wrap', background: 'var(--bg-surface)', padding: 28, borderRadius: 16, border: '1px solid var(--border)' }}>
              {service.description}
            </div>
          )}

          {activeTab === 'faq' && (
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {service.faq.map((f, i) => (
                <div key={i} style={{ borderBottom: i === service.faq.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 22px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
                    <span>{f.question}</span>
                    {openFaq === i ? <ChevronUp size={18} color="var(--text-tertiary)" /> : <ChevronDown size={18} color="var(--text-tertiary)" />}
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '0 22px 18px 22px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {f.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="sd-reviews" style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', padding: 22 }}>
              {!reviewsLoaded ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 30 }}>Rəylər yüklənir...</div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 30 }}>
                  <Star size={32} color="var(--border-strong)" style={{ marginBottom: 10 }} />
                  <p style={{ margin: 0, fontSize: 15 }}>Hələ heç bir rəy yoxdur. Bu xidməti sifariş edib tamamladıqdan sonra ilk rəyi sən yaza bilərsən!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 22, fontWeight: 900, color: 'var(--text-primary)' }}>
                      <Star size={22} fill="#fbbf24" color="#fbbf24" /> {service.rating || '0.0'}
                    </div>
                    <span style={{ color: 'var(--text-tertiary)' }}>· {reviews.length} rəy</span>
                  </div>
                  {reviews.map((rv) => (
                    <div key={rv._id} className="review-item" style={{ display: 'flex', gap: 12, paddingBottom: 18, borderBottom: '1px solid var(--border-soft)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-muted)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {rv.reviewerId?.avatar ? <img src={rv.reviewerId.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="#64748b" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{rv.reviewerId?.fullName || 'İstifadəçi'}</strong>
                          <span style={{ display: 'flex', gap: 2 }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < rv.rating ? '#fbbf24' : 'none'} color={i < rv.rating ? '#fbbf24' : 'var(--border-strong)'} />
                            ))}
                          </span>
                        </div>
                        <p style={{ margin: '6px 0 8px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{rv.comment}</p>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{azFullDate(rv.createdAt)}</div>

                        {rv.sellerReply?.text ? (
                          <div style={{ marginTop: 10, padding: 12, background: 'var(--bg-page)', borderRadius: 10, borderLeft: '3px solid #14224F' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <strong style={{ fontSize: 13, color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <Reply size={13} /> Satıcının cavabı
                              </strong>
                              {isAuthor && (
                                <button onClick={() => deleteReply(rv._id)} aria-label="Cavabı sil" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{rv.sellerReply.text}</p>
                            {rv.sellerReply.createdAt && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{new Date(rv.sellerReply.createdAt).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            )}
                          </div>
                        ) : isAuthor ? (
                          replyingTo === rv._id ? (
                            <div style={{ marginTop: 10 }}>
                              <textarea autoFocus value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Müştəriyə cavabını yaz..." className="auth-input" style={{ width: '100%', minHeight: 80, padding: 10, fontSize: 14, fontFamily: 'inherit' }} maxLength={1000} />
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="btn-modal-cancel" style={{ padding: '8px 14px' }}>Ləğv</button>
                                <button onClick={() => submitReply(rv._id)} style={{ background: '#14224F', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Cavabı göndər</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => { setReplyingTo(rv._id); setReplyText(''); }} style={{ marginTop: 8, background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--brand)', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Reply size={13} /> Cavabla
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {currentUser && !isAuthor && reviewsLoaded && (
                <div style={{ marginTop: 18, padding: 14, background: 'var(--bg-page)', borderRadius: 10, fontSize: 13, color: 'var(--text-tertiary)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <ShoppingCart size={16} color="#14224F" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>Yalnız bu xidməti sifariş edib tamamladıqdan sonra rəy yaza bilərsən. <Link to="/sifarislerim" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Sifarişlərimə bax →</Link></span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: '1 1 30%', minWidth: 320, position: 'sticky', top: 100 }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {packages.length > 0 ? (
              <>
                {packages.length > 1 && (
                  <div style={{ padding: '12px 16px 0', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    Paket seçin — hər birinin qiyməti, müddəti və daxil olan xidmətləri fərqlidir
                  </div>
                )}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                  {PACKAGE_TIERS.filter((t) => packages.find((p) => p.tier === t.tier)).map((t) => (
                    <button key={t.tier} onClick={() => setActivePkg(t.tier)}
                      style={{ flex: 1, padding: '14px 8px', background: activePkg === t.tier ? t.bg : 'transparent', color: activePkg === t.tier ? t.color : 'var(--text-tertiary)', border: 'none', borderBottom: `3px solid ${activePkg === t.tier ? t.color : 'transparent'}`, fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: '0.2s' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {selectedPkg && (
                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16 }}>{selectedPkg.title || 'Paket'}</span>
                      <span style={{ fontSize: 30, color: 'var(--brand)', fontWeight: 900 }}>{selectedPkg.price} ₼</span>
                    </div>
                    {selectedPkg.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6, margin: '4px 0 18px 0' }}>{selectedPkg.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 18, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={16} color="#14224F" /> {selectedPkg.deliveryDays} gün
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <RefreshCw size={16} color="#14224F" /> {selectedPkg.revisions} revizyon
                      </span>
                    </div>
                    {selectedPkg.features?.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedPkg.features.map((f, i) => (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
                            <Check size={16} color="#14224F" style={{ flexShrink: 0, marginTop: 2 }} /> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button onClick={handleOrder} style={orderBtn} onMouseOver={(e) => e.currentTarget.style.background = '#0C1733'} onMouseOut={(e) => e.currentTarget.style.background = '#14224F'}>
                      <ShoppingCart size={20} /> Bu paketi sifariş et ({selectedPkg.price} ₼)
                    </button>
                    <button onClick={handleContactSeller} style={contactBtn}>
                      <MessageSquare size={20} /> Satıcı ilə əlaqə
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <span style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 700 }}>Qiymət</span>
                  <span style={{ fontSize: 30, color: 'var(--brand)', fontWeight: 900 }}>{service.price} ₼</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
                  <Clock size={18} color="#14224F" /> {service.deliveryDays} gün
                </div>
                <button onClick={handleOrder} style={orderBtn}>
                  <ShoppingCart size={20} /> İndi sifariş et
                </button>
                <button onClick={handleContactSeller} style={contactBtn}>
                  <MessageSquare size={20} /> Satıcı ilə əlaqə
                </button>
              </div>
            )}
          </div>

          {/* Real-time xidmət statistikası kartı */}
          {service.stats && (() => {
            const s = service.stats;
            const fmtAgo = (d) => {
              if (!d) return '—';
              const diff = (Date.now() - new Date(d).getTime()) / 60000;
              if (diff < 1) return 'İndi';
              if (diff < 60) return `${Math.floor(diff)} dəq əvvəl`;
              if (diff < 60 * 24) return `${Math.floor(diff / 60)} saat əvvəl`;
              if (diff < 60 * 24 * 30) return `${Math.floor(diff / 60 / 24)} gün əvvəl`;
              return azFullDate(d);
            };
            const fmtResp = (m) => {
              if (m === null || m === undefined) return 'Məlumat yoxdur';
              if (m < 60) return `~${m} dəq`;
              const h = Math.round(m / 60);
              if (h < 24) return `~${h} saat`;
              return `~${Math.round(h / 24)} gün`;
            };
            const rows = [
              { label: 'İlan tarixi',         val: fmtAgo(service.createdAt),               icon: Calendar,    color: '#6366f1' },
              { label: 'Cəmi sifariş',        val: s.ordersTotal,                           icon: ShoppingBag, color: '#f59e0b' },
              { label: 'Tamamlanmış',         val: s.ordersCompleted,                       icon: CheckCircle, color: 'var(--brand)' },
              { label: 'Ləğv edilmiş',        val: s.ordersCanceled,                        icon: XCircle,     color: '#ef4444' },
              { label: 'Son baxış',           val: `${service.views || 0} dəfə`,            icon: Eye,         color: '#8b5cf6' },
              { label: 'Ort. cavab müddəti',  val: fmtResp(s.authorResponseMinutes),        icon: Clock,       color: '#06b6d4' },
              { label: 'Son aktivlik',        val: fmtAgo(s.authorLastActive),              icon: Activity,    color: 'var(--brand)' },
              { label: 'Son təslim',          val: fmtAgo(s.lastDeliveredAt),               icon: Package,     color: '#3b82f6' },
            ];
            return (
              <div style={{ marginTop: 14, background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #14224F 0%, #0C1733 100%)', color: 'white', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
                  <BarChart3 size={16} /> Statistika
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {rows.map((r, i) => {
                    const Icon = r.icon;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--border-soft)', fontSize: 13, transition: 'background 0.15s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-page)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ color: 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: `${r.color}15`, color: r.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={14} />
                          </span>
                          {r.label}
                        </span>
                        <strong style={{ color: 'var(--text-primary)', textAlign: 'right', fontSize: 13 }}>{r.val}</strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {service.related?.length > 0 && (
        <div style={{ marginTop: 60 }}>
          <h2 style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 20, fontWeight: 800 }}>Əlaqəli xidmətlər</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {service.related.map((s) => {
              const startPrice = s.packages?.length ? Math.min(...s.packages.map((p) => p.price)) : s.price;
              const fastest = s.packages?.length ? Math.min(...s.packages.map((p) => p.deliveryDays)) : s.deliveryDays;
              return (
                <Link key={s._id} to={`/xidmet/${s._id}`} style={{ textDecoration: 'none', color: 'inherit', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 140, background: 'var(--bg-muted)' }}>
                    {s.image ? <img src={s.image} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                  </div>
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>{s.title.length > 60 ? s.title.slice(0, 60) + '...' : s.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {fastest} gün</span>
                      <span style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 14 }}>{startPrice} ₼-dən</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtn = (side) => ({
  position: 'absolute',
  top: '50%',
  [side]: 12,
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.5)',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: 40,
  height: 40,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const orderBtn = {
  width: '100%', background: '#14224F', color: 'white', border: 'none', padding: 14, borderRadius: 12,
  fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: 10, marginBottom: 10, transition: '0.2s',
};

const contactBtn = {
  width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)',
  border: '2px solid var(--border)', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
};

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '12px 18px', background: 'transparent', border: 'none',
    borderBottom: `2px solid ${active ? '#14224F' : 'transparent'}`,
    color: active ? 'var(--brand)' : 'var(--text-tertiary)', fontWeight: 700,
    cursor: 'pointer', fontSize: 15,
  }}>{children}</button>
);

export default ServiceDetail;
