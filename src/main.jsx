import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initNative } from './native/capacitor.js'
import { API_URL } from './api.js'
import { disconnectSocket } from './socket.js'

// ─── Qlobal 401 interceptor ───
// JWT-nin müddəti bitsə və ya token etibarsız olsa, server 401 qaytarır.
// Bu wrapper bütün API sorğularını izləyir: 401-də sessiyanı təmizləyib girişə yönləndirir.
// (Login/register zamanı token olmadığı üçün guard ilə tetiklənmir.)
const _origFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const res = await _origFetch(...args);
  try {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    const hadToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (res.status === 401 && hadToken && API_URL && url.includes(API_URL)) {
      localStorage.removeItem('token'); localStorage.removeItem('user');
      sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
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
