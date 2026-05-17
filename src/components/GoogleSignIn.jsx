import React, { useEffect, useRef } from 'react';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function GoogleSignIn({ rememberMe = true, onSuccess }) {
  const btnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID) return;
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
            const store = rememberMe ? localStorage : sessionStorage;
            store.setItem('token', d.token);
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
