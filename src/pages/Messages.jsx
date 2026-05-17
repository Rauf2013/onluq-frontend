import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, Send, Paperclip, Smile, MoreVertical, Check, CheckCheck, User, AlertCircle, Trash2, Image as ImageIcon, FileText, Tag, X, ShoppingCart, Download, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';
import { PACKAGE_TIERS } from '../constants/seller';

const EMOJIS = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤔','😏','😴','🤩','🥳','😢','😭','😡','😱','🤯','🙏','👍','👎','👏','🙌','💪','🤝','👌','✌️','🔥','💯','⭐','✨','❤️','💔','🎉','🎊','💰','💸','💎','🚀','✅','❌','⚡','🌟','📌','📎','📷','📁'];

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [myServices, setMyServices] = useState([]);
  const [offerForm, setOfferForm] = useState({ serviceId: '', tier: 'bronze' });
  const [partnerTyping, setPartnerTyping] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const activeChatRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); 

  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser ? currentUser.id : null;
  
  const partnerIdFromState = location.state ? location.state.partnerId : null;
  const partnerNameFromState = location.state ? location.state.partnerName : null;

  const socketRef = useRef(null);

  useEffect(() => {
    if (location.state && location.state.partnerId) {
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (userId) {
      socketRef.current = io(API_URL);
      
      socketRef.current.emit("user_connected", userId);

      socketRef.current.on("receive_message", (data) => {
        fetchConversations(true); 
        
        if (activeChatRef.current && (activeChatRef.current.partnerId === data.senderId || data.senderId === userId)) {
          fetchMessagesForChat(activeChatRef.current.partnerId, true);
        }
      });

      socketRef.current.on("online_users_updated", () => {
        fetchConversations(true);
      });

      socketRef.current.on("typing_indicator", ({ from, isTyping }) => {
        if (activeChatRef.current && activeChatRef.current.partnerId === from) {
          setPartnerTyping(!!isTyping);
        }
      });
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  const fetchMessagesForChat = async (partnerId, isSilent = false) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/messages/mark-read/${partnerId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetch(`${API_URL}/api/notifications/chat/${partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});

      const response = await fetch(`${API_URL}/api/messages/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        const safeMessages = data.map(msg => ({
          _id: String(msg._id || Math.random()),
          text: msg.text || '',
          senderId: msg.senderId || 'unknown',
          time: msg.time || '',
          status: msg.status || 'delivered' 
        }));
        setMessages(safeMessages);
      } else {
        if(!isSilent) setMessages([]);
      }
    } catch (error) {
      if (!isSilent) toast.error('Mesajlar yüklənə bilmədi.');
    }
  };

  const fetchConversations = async (isSilent = false) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      let convos = Array.isArray(data) ? data : [];

      convos = convos.map(chat => ({
        _id: String(chat._id || Math.random()), 
        partnerId: chat.partnerId || 'unknown',
        partnerName: chat.partnerName || 'Bilinməyən İstifadəçi',
        lastMessage: chat.lastMessage || 'Mesaj yoxdur',
        time: chat.time || '',
        unread: chat.unread || 0,
        isOnline: chat.isOnline || false, 
        partnerAvatar: chat.partnerAvatar || null
      }));

      if (partnerIdFromState) {
        const existingChat = convos.find(c => c.partnerId === partnerIdFromState);
        if (existingChat) {
          if (!isSilent && !activeChatRef.current) {
            setActiveChat(existingChat);
            fetchMessagesForChat(partnerIdFromState);
          }
        } else {
          const newConvo = {
            _id: 'temp_' + partnerIdFromState,
            partnerId: partnerIdFromState,
            partnerName: partnerNameFromState || 'Yeni Söhbət',
            lastMessage: 'Söhbətə başlayın...',
            unread: 0,
            isOnline: true,
            time: 'İndi'
          };
          convos = [newConvo, ...convos];
          if (!isSilent && !activeChatRef.current) {
            setActiveChat(newConvo);
            setMessages([]); 
          }
        }
      }

      setConversations(convos);
      
      if (activeChatRef.current) {
        const updatedChat = convos.find(c => c.partnerId === activeChatRef.current.partnerId);
        if (updatedChat && updatedChat.isOnline !== activeChatRef.current.isOnline) {
          setActiveChat(prev => ({ ...prev, isOnline: updatedChat.isOnline }));
        }
      }
    } catch (error) {
      if (!isSilent) toast.error('Söhbətlər yüklənərkən xəta baş verdi.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate('/giris');
      return;
    }
    fetchConversations(false);
  }, [userId, navigate, partnerIdFromState, partnerNameFromState]);

  const handleSelectChat = (chat) => {
    if (!chat) return;
    setActiveChat(chat);
    
    if (String(chat._id).startsWith('temp_') || chat.partnerId === 'unknown') {
      setMessages([]); 
    } else {
      fetchMessagesForChat(chat.partnerId);
    }
  };

  useEffect(() => {
    // Yalnız mesaj qutusunun içində aşağı sürüş, bütün səhifəni sürüşdürmə
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendPayload = async (payload) => {
    if (!activeChat) return false;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeChat.partnerId, ...payload })
      });
      if (response.ok) {
        fetchMessagesForChat(activeChat.partnerId);
        fetchConversations(true);
        fetch(`${API_URL}/api/notifications`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: activeChat.partnerId, message: `${currentUser?.fullName ?? 'İstifadəçi'} sizə yeni mesaj göndərdi.` })
        }).catch(() => {});
        return true;
      }
      toast.error('Mesaj göndərilə bilmədi.');
    } catch {
      toast.error('Bağlantı xətası.');
    }
    return false;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const text = newMessage;
    setNewMessage('');
    if (socketRef.current) socketRef.current.emit('typing', { to: activeChat.partnerId, from: userId, isTyping: false });
    await sendPayload({ text, type: 'text' });
  };

  const handleTyping = (val) => {
    setNewMessage(val);
    if (!activeChat || !socketRef.current) return;
    socketRef.current.emit('typing', { to: activeChat.partnerId, from: userId, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { to: activeChat.partnerId, from: userId, isTyping: false });
    }, 1500);
  };

  const handleFileUpload = (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Fayl 5MB-dan kiçik olmalıdır.'); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendPayload({
        type: kind,
        text: kind === 'image' ? '' : file.name,
        meta: { url: reader.result, fileName: file.name, size: file.size }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const openOfferModal = async () => {
    setShowAttachMenu(false);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/services/my-services`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        if (!data.length) { toast.info('Təklif göndərmək üçün ən azı bir xidmətiniz olmalıdır.'); return; }
        setMyServices(data);
        setOfferForm({ serviceId: data[0]._id, tier: data[0].packages?.[0]?.tier || 'bronze' });
        setShowOfferModal(true);
      } else { toast.error('Xidmətlər yüklənə bilmədi.'); }
    } catch { toast.error('Bağlantı xətası.'); }
  };

  const sendOffer = async () => {
    const svc = myServices.find((s) => s._id === offerForm.serviceId);
    if (!svc) return;
    const pkg = (svc.packages || []).find((p) => p.tier === offerForm.tier) || svc.packages?.[0];
    if (!pkg) { toast.error('Bu xidmətdə paket yoxdur.'); return; }
    setShowOfferModal(false);
    await sendPayload({
      type: 'offer',
      text: `${pkg.title || 'Paket'} təklifi`,
      meta: {
        serviceId: svc._id,
        serviceTitle: svc.title,
        serviceImage: svc.image,
        tier: pkg.tier,
        packageTitle: pkg.title,
        price: pkg.price,
        deliveryDays: pkg.deliveryDays,
        revisions: pkg.revisions,
      }
    });
  };

  const acceptOffer = (meta) => {
    if (!meta?.serviceId) return;
    navigate(`/odeme/${meta.serviceId}`, { state: { packageTier: meta.tier || 'bronze' } });
  };

  const handleDeleteConversation = () => {
    if (!activeChat) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteConversation = async () => {
    setIsDeleteModalOpen(false);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/messages/${activeChat.partnerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Söhbət silindi.');
        setActiveChat(null);
        setMessages([]);
        fetchConversations(true);
      } else {
        toast.error('Söhbət silinə bilmədi.');
      }
    } catch (err) {
      toast.error('Bağlantı xətası.');
    }
  };

  const renderTicks = (status) => {
    if (status === 'error') return <AlertCircle size={16} color="#ef4444" />; 
    if (status === 'read') return <CheckCheck size={16} color="#3b82f6" />; 
    if (status === 'delivered') return <CheckCheck size={16} color="#94a3b8" />; 
    return <Check size={16} color="#94a3b8" />; 
  };

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}>Mesajlar yüklənir...</div>;

  return (
    <div className={`main-content msg-layout ${activeChat ? 'has-active' : ''}`} style={{ height: 'calc(100vh - 100px)', display: 'flex', gap: '20px', paddingBottom: '20px', overflow: 'hidden' }}>

      <div className="msg-sidebar" style={{ width: '350px', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)' }}>
          <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: 'var(--text-primary)', fontWeight: '800' }}>Mesajlar</h2>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Söhbətlərdə axtar..." style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '10px', border: '1px solid var(--border-strong)', outline: 'none', background: 'var(--bg-surface)' }} />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Heç bir söhbət tapılmadı.</div>
          ) : (
            conversations.map(chat => (
              <div 
                key={chat._id} 
                onClick={() => handleSelectChat(chat)}
                style={{ display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid var(--border-soft)', cursor: 'pointer', background: activeChat?.partnerId === chat.partnerId ? 'var(--brand-soft)' : 'var(--bg-surface)', transition: '0.2s' }}
                onMouseOver={(e) => { if(activeChat?.partnerId !== chat.partnerId) e.currentTarget.style.background = 'var(--bg-hover)' }}
                onMouseOut={(e) => { if(activeChat?.partnerId !== chat.partnerId) e.currentTarget.style.background = 'var(--bg-surface)' }}
              >
                <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px', flexShrink: 0 }}>
                  {chat.partnerAvatar ? <img src={chat.partnerAvatar} alt="avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}/> : <User size={24} color="#64748b" />}
                  {chat.isOnline && <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', background: '#10b981', border: '2px solid white', borderRadius: '50%' }}></div>}
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: activeChat?.partnerId === chat.partnerId ? 'bold' : '600' }}>{chat.partnerName}</h4>
                    <span style={{ fontSize: '12px', color: chat.unread > 0 ? '#10b981' : '#94a3b8', fontWeight: chat.unread > 0 ? 'bold' : 'normal' }}>{chat.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.lastMessage}
                    </p>
                    {chat.unread > 0 && <span style={{ background: '#10b981', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', marginLeft: '10px' }}>{chat.unread}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="msg-main" style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
        
        {activeChat ? (
          <>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="msg-back-btn" onClick={() => setActiveChat(null)} aria-label="Geri" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'none', color: 'var(--text-primary)' }}>
                  <ArrowLeft size={22} />
                </button>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#64748b" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{activeChat.partnerName}</h3>
                  <span style={{ fontSize: '13px', color: partnerTyping ? '#10b981' : (activeChat.isOnline ? '#10b981' : '#94a3b8'), fontWeight: '500', fontStyle: partnerTyping ? 'italic' : 'normal' }}>
                    {partnerTyping ? 'yazır...' : (activeChat.isOnline ? 'Onlayn' : 'Oflayn')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button
                  onClick={handleDeleteConversation} 
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', transition: '0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#fca5a5'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
                >
                  <Trash2 size={16} /> Sil
                </button>
                <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'} onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  <MoreVertical size={22} />
                </button>
              </div>
            </div>

            <div ref={messagesContainerRef} style={{ flex: 1, background: 'var(--bg-page)', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>İlk mesajı sən göndər!</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === userId;
                  const bubble = {
                    maxWidth: '70%',
                    background: isMe ? '#10b981' : 'var(--bg-surface)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                  };
                  const meta = msg.meta || {};
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={bubble}>
                        {msg.type === 'image' && meta.url && (
                          <img src={meta.url} alt={meta.fileName || 'image'} style={{ maxWidth: 280, maxHeight: 280, borderRadius: 10, marginBottom: msg.text ? 8 : 0, cursor: 'pointer' }} onClick={() => window.open(meta.url, '_blank')} />
                        )}
                        {msg.type === 'file' && meta.url && (
                          <a href={meta.url} download={meta.fileName} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--bg-muted)', borderRadius: 10, color: 'inherit', textDecoration: 'none', marginBottom: msg.text ? 8 : 0 }}>
                            <FileText size={22} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.fileName || 'Sənəd'}</div>
                              {meta.size && <div style={{ fontSize: 11, opacity: 0.7 }}>{Math.round(meta.size / 1024)} KB</div>}
                            </div>
                            <Download size={16} />
                          </a>
                        )}
                        {msg.type === 'offer' && (
                          <div style={{ background: isMe ? 'rgba(255,255,255,0.15)' : 'var(--bg-muted)', borderRadius: 12, padding: 14, marginBottom: 8, minWidth: 250 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
                              <Tag size={14} /> XÜSUSİ TƏKLİF
                            </div>
                            {meta.serviceImage && <img src={meta.serviceImage} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />}
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{meta.serviceTitle}</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>{meta.packageTitle} · {meta.deliveryDays} gün · {meta.revisions} revizyon</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${isMe ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`, paddingTop: 8 }}>
                              <span style={{ fontSize: 18, fontWeight: 800 }}>{meta.price} ₼</span>
                              {!isMe && (
                                <button onClick={() => acceptOffer(meta)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <ShoppingCart size={13} /> Qəbul et
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {msg.text && <span style={{ fontSize: '15px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{msg.text}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '5px' }}>
                          <span style={{ fontSize: '11px', color: isMe ? '#d1fae5' : 'var(--text-muted)' }}>{msg.time}</span>
                          {isMe && renderTicks(msg.status)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ position: 'relative', padding: '15px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {showEmoji && (
                <div style={{ position: 'absolute', bottom: '100%', left: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, width: 300, boxSizing: 'border-box', zIndex: 50 }}>
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => { setNewMessage((m) => m + e); setShowEmoji(false); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, padding: 2, borderRadius: 6, lineHeight: 1, minWidth: 0 }}
                      onMouseOver={(ev) => ev.currentTarget.style.background = 'var(--bg-muted)'}
                      onMouseOut={(ev) => ev.currentTarget.style.background = 'transparent'}>{e}</button>
                  ))}
                </div>
              )}
              {showAttachMenu && (
                <div style={{ position: 'absolute', bottom: '100%', left: 50, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, zIndex: 50, display: 'flex', flexDirection: 'column' }}>
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={attachItem}><ImageIcon size={18} color="#10b981" /> Şəkil</button>
                  <button type="button" onClick={() => docInputRef.current?.click()} style={attachItem}><FileText size={18} color="#3b82f6" /> Sənəd</button>
                  <button type="button" onClick={openOfferModal} style={attachItem}><Tag size={18} color="#f59e0b" /> Xüsusi Təklif</button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} style={{ display: 'none' }} />
              <input ref={docInputRef} type="file" onChange={(e) => handleFileUpload(e, 'file')} style={{ display: 'none' }} />

              <button type="button" onClick={() => { setShowEmoji((v) => !v); setShowAttachMenu(false); }} aria-label="Emoji" style={iconBtn(showEmoji)}><Smile size={22} /></button>
              <button type="button" onClick={() => { setShowAttachMenu((v) => !v); setShowEmoji(false); }} aria-label="Əlavə et" style={iconBtn(showAttachMenu)}><Paperclip size={22} /></button>

              <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Bir mesaj yazın..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  style={{ flex: 1, background: 'var(--bg-muted)', border: 'none', padding: '12px 20px', borderRadius: '24px', fontSize: '15px', outline: 'none' }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  style={{ background: newMessage.trim() ? '#10b981' : 'var(--border-strong)', color: 'white', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: newMessage.trim() ? 'pointer' : 'not-allowed', transition: '0.2s', paddingLeft: '4px' }}
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--bg-muted)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Send size={40} color="#94a3b8" style={{ marginLeft: '-5px' }} />
            </div>
            <h2 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>Mesajlarınız</h2>
            <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>Başlamaq üçün sol tərəfdən bir söhbət seçin.</p>
          </div>
        )}

      </div>

      <div className={`custom-modal-overlay ${showOfferModal ? 'active' : ''}`} onClick={() => setShowOfferModal(false)}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Xüsusi təklif göndər</h3>
            <button onClick={() => setShowOfferModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
          </div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Xidmət</label>
          <select value={offerForm.serviceId} onChange={(e) => {
            const s = myServices.find((x) => x._id === e.target.value);
            setOfferForm({ serviceId: e.target.value, tier: s?.packages?.[0]?.tier || 'bronze' });
          }} className="auth-input" style={{ width: '100%', padding: 10, marginBottom: 14 }}>
            {myServices.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
          </select>

          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Paket</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {(myServices.find((s) => s._id === offerForm.serviceId)?.packages || []).map((p) => {
              const tm = PACKAGE_TIERS.find((t) => t.tier === p.tier);
              const active = offerForm.tier === p.tier;
              return (
                <button key={p.tier} type="button" onClick={() => setOfferForm((f) => ({ ...f, tier: p.tier }))}
                  style={{ flex: 1, padding: '10px 8px', background: active ? tm?.bg : 'var(--bg-muted)', color: active ? tm?.color : 'var(--text-secondary)', border: `2px solid ${active ? tm?.color : 'transparent'}`, borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {tm?.label || p.tier}<br /><span style={{ fontSize: 12, opacity: 0.85 }}>{p.price} ₼</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-modal-cancel" onClick={() => setShowOfferModal(false)}>Ləğv et</button>
            <button className="btn-modal-confirm" onClick={sendOffer}>Təklifi göndər</button>
          </div>
        </div>
      </div>

      <div className={`custom-modal-overlay ${isDeleteModalOpen ? 'active' : ''}`} onClick={() => setIsDeleteModalOpen(false)}>
        <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-icon" style={{ width: 80, height: 80, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
            <Trash2 size={40} />
          </div>
          <h3>Söhbəti silmək istədiyinizə əminsiniz?</h3>
          <p>Bu söhbət və içindəki bütün mesajlar həmişəlik silinəcək. Bu əməliyyat geri qaytarıla bilməz.</p>
          <div className="modal-actions">
            <button className="btn-modal-cancel" onClick={() => setIsDeleteModalOpen(false)}>Ləğv et</button>
            <button className="btn-modal-danger" onClick={confirmDeleteConversation}>Bəli, sil</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBtn = (active) => ({
  background: active ? 'var(--bg-muted)' : 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: active ? '#10b981' : 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 8,
});

const attachItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: 'transparent',
  border: 'none',
  padding: '10px 14px',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontWeight: 600,
  textAlign: 'left',
  borderRadius: 8,
  width: '100%',
};

export default Messages;
