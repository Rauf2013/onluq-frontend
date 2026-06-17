import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initNative } from './native/capacitor.js'
import { API_URL } from './api.js'
import { disconnectSocket } from './socket.js'

// ─── Qlobal 401 interceptor + access token refresh ───
// Access token qısa ömürlüdür (15 dəq). Bitəndə server 401 qaytarır:
//  1) refresh token ilə yeni access alınır,
//  2) orijinal sorğu yeni token ilə təkrarlanır.
// Refresh də alınmasa (refresh 30g bitib) sessiya təmizlənir, girişə yönləndirilir.
const _origFetch = window.fetch.bind(window);

const _clearSession = () => {
  localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); sessionStorage.removeItem('refreshToken');
};

// Eyni anda çox 401 olsa belə tək refresh sorğusu (dedupe)
let _refreshing = null;
async function _tryRefresh() {
  const rt = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  if (!rt) return null;
  try {
    const r = await _origFetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d && d.token) {
      const store = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
      store.setItem('token', d.token);
      return d.token;
    }
  } catch { /* ignore */ }
  return null;
}

window.fetch = async (...args) => {
  let res = await _origFetch(...args);
  try {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const isApi = API_URL && url.includes(API_URL);
    const isAuthCall = url.includes('/api/auth/refresh') || url.includes('/api/login');
    const hadToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (res.status === 401 && hadToken && isApi && !isAuthCall) {
      if (!_refreshing) _refreshing = _tryRefresh().finally(() => { _refreshing = null; });
      const newToken = await _refreshing;
      if (newToken) {
        // Orijinal sorğunu yeni token ilə təkrarla
        if (typeof args[0] === 'string') {
          const opts = { ...(args[1] || {}) };
          opts.headers = { ...(opts.headers || {}), Authorization: `Bearer ${newToken}` };
          res = await _origFetch(args[0], opts);
        } else if (args[0] instanceof Request) {
          const h = new Headers(args[0].headers);
          h.set('Authorization', `Bearer ${newToken}`);
          res = await _origFetch(new Request(args[0], { headers: h }));
        }
        return res;
      }
      // Refresh alınmadı → sessiyanı təmizlə, girişə yönləndir
      _clearSession();
      try { disconnectSocket(); } catch { /* ignore */ }
      if (!location.pathname.startsWith('/giris')) {
        location.href = '/giris?expired=1';
      }
    }
  } catch { /* ignore */ }
  return res;
};

initNative();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
