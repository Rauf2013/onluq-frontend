import { io } from 'socket.io-client';
import { API_URL } from './api';

// Tək paylaşılan socket — bütün app boyu eyni bağlantı.
// Belə istifadəçi HƏR səhifədə online olur (təkcə Mesajlar-da yox).
let socket = null;

const currentToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export function getSocket() {
  if (!currentToken()) return null;
  if (!socket) {
    socket = io(API_URL, {
      // auth FUNKSIYA-dır: hər (yenidən) qoşulmada TƏZƏ token oxunur.
      // (Access token 15 dəq-dir; sabit token-lə socket vaxtı keçəndə yenidən qoşula bilmir → zəng gəlmir.)
      auth: (cb) => cb({ token: currentToken() }),
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      transports: ['websocket', 'polling'],
    });
    // Token vaxtı keçib auth fail olarsa: yenilə və yenidən qoş
    socket.on('connect_error', (err) => {
      try { console.log('[EVDENCALL] socket connect_error:', err && err.message); } catch {}
    });
    socket.on('connect', () => { try { console.log('[EVDENCALL] socket connected', socket.id); } catch {} });
  }
  // Hər çağırışda qoşulu olduğundan əmin ol (qopubsa yenidən qoş)
  if (socket && socket.disconnected) { try { socket.connect(); } catch {} }
  return socket;
}

export function disconnectSocket() {
  if (socket) { try { socket.disconnect(); } catch {} socket = null; }
}
