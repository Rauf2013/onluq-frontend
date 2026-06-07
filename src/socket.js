import { io } from 'socket.io-client';
import { API_URL } from './api';

// Tək paylaşılan socket — bütün app boyu eyni bağlantı.
// Belə istifadəçi HƏR səhifədə online olur (təkcə Mesajlar-da yox).
let socket = null;

export function getSocket() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  if (!socket) {
    socket = io(API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { try { socket.disconnect(); } catch {} socket = null; }
}
