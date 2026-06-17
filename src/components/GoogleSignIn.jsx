import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isNative, firebaseGoogleSignIn } from '../native/capacitor';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleSignIn({ rememberMe = true, onSuccess }) {
  const btnRef = useRef(null);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  // Web Google SDK init — Hook KOŞULSUZ çağrılmalıdır (react-hooks/rules-of-hooks).
  // Əvvəl bu useEffect `if (isNative) return`-dən SONRA idi → şərti hook → səhv.
  // İndi yuxarıdadır, native-də guard ilə erkən çıxır.
  useEffect(() => {
    if (isNative || !CLIENT_ID) return;
    let tries = 0;
    const init = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        if (tries++ < 30) return setTimeout(init, 200);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp) => {
          const t = toast.loading('Google ilə daxil olunur...');
          try {
            const r = await fetch(`${API_URL}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: resp.credential }),
            });
            const d = await r.json();
            if (!r.ok) {
              toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2500 });
              return;
            }
            const store = localStorage;
            store.setItem('token', d.token);
            if (d.refreshToken) store.setItem('refreshToken', d.refreshToken);
            store.setItem('user', JSON.stringify(d.user));
            toast.update(t, { render: `Xoş gəldiniz, ${d.user.fullName}!`, type: 'success', isLoading: false, autoClose: 1500 });
            if (onSuccess) onSuccess(d.user);
            setTimeout(() => { navigate('/'); window.location.reload(); }, 800);
          } catch (e) {
            toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2500 });
          }
        },
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline', size: 'large', width: btnRef.current.offsetWidth || 320, text: 'continue_with', shape: 'rectangular',
        });
      }
    };
    init();
  }, [rememberMe, onSuccess, navigate]);

  // Native (Capacitor) — Capgo Social Login plugin ile native dialog ac
  if (isNative) {
    const handleNativeSignIn = async () => {
      if (busy) return;
      setBusy(true);
      const t = toast.loading('Google ilə daxil olunur...');
      try {
        // Firebase Authentication ilə Google giriş — ən etibarlı yol.
        const { idToken } = await firebaseGoogleSignIn();
        const r = await fetch(`${API_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const d = await r.json();
        if (!r.ok) {
          toast.update(t, { render: d.message || `Xəta (HTTP ${r.status})`, type: 'error', isLoading: false, autoClose: 2500 });
          setBusy(false);
          return;
        }
        const store = localStorage;
        store.setItem('token', d.token);
        if (d.refreshToken) store.setItem('refreshToken', d.refreshToken);
        store.setItem('user', JSON.stringify(d.user));
        toast.update(t, { render: `Xoş gəldin, ${d.user.fullName}!`, type: 'success', isLoading: false, autoClose: 1500 });
        if (onSuccess) onSuccess(d.user);
        setTimeout(() => { navigate('/'); window.location.reload(); }, 800);
      } catch (e) {
        const msg = e?.message || 'Naməlum xəta';
        toast.update(t, { render: `Google xətası: ${msg}`, type: 'error', isLoading: false, autoClose: 3500 });
        setBusy(false);
      }
    };

    return (
      <button
        type="button"
        onClick={handleNativeSignIn}
        disabled={busy}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '12px 16px', background: 'var(--bg-surface)', color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)', borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.7 : 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.7 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 43.5c5.4 0 10.2-2 13.8-5.3l-6.4-5.4C29.4 34.6 26.8 35.5 24 35.5c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.5 39.1 16.2 43.5 24 43.5z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.7l6.4 5.4C41.4 36 43.5 30.5 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
        </svg>
        {busy ? 'Daxil olunur...' : 'Google ilə davam et'}
      </button>
    );
  }

  if (!CLIENT_ID) {
    return (
      <div style={{ padding: 12, background: 'var(--bg-muted)', border: '1px dashed var(--border-strong)', borderRadius: 8, color: 'var(--text-tertiary)', fontSize: 12, textAlign: 'center' }}>
        Google girişi konfiqurasiya edilməyib (VITE_GOOGLE_CLIENT_ID).
      </div>
    );
  }
  return <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />;
}

export default GoogleSignIn;
