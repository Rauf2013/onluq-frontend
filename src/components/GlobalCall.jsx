import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CallSystem from './CallSystem';
import { getSocket } from '../socket';

// QLOBAL zəng qatı — bütün app boyu mount olunur ki, gələn zəng İSTƏNİLƏN səhifədə tutulsun
// (əvvəl CallSystem yalnız Mesajlar səhifəsində idi → zəng yalnız orada gəlirdi). Çıxan zəng
// 'evden:startCall' window event-i ilə başladılır (Mesajlardakı zəng düymələrindən).
export default function GlobalCall() {
  const callRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [myId, setMyId] = useState(null);
  const location = useLocation();

  // İstifadəçi giriş edibsə paylaşılan socket-i al (hər səhifədə qoşulu qalır)
  useEffect(() => {
    const readUser = () => {
      try { const s = localStorage.getItem('user') || sessionStorage.getItem('user'); return s ? JSON.parse(s) : null; }
      catch { return null; }
    };
    const sync = () => {
      const u = readUser();
      if (u && u.id) { setMyId(u.id); setSocket(getSocket()); }
      else { setMyId(null); setSocket(null); }
    };
    sync();
    window.addEventListener('userUpdated', sync);
    return () => window.removeEventListener('userUpdated', sync);
  }, [location.pathname]);

  // Çıxan zəng başlatma (Mesajlardakı düymələr bu event-i göndərir)
  useEffect(() => {
    const onStart = (e) => {
      const d = (e && e.detail) || {};
      if (callRef.current && d.partnerId) {
        callRef.current.startCall(d.kind || 'audio', d.partnerId, d.partnerName);
      }
    };
    window.addEventListener('evden:startCall', onStart);
    return () => window.removeEventListener('evden:startCall', onStart);
  }, []);

  if (!myId || !socket) return null;
  return <CallSystem ref={callRef} socket={socket} myId={myId} />;
}
