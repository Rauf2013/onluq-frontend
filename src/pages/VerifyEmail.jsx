import React, { useState } from 'react';
import { API_URL } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MailCheck } from 'lucide-react';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (!email) { navigate('/giris'); return null; }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return toast.warning('6 rəqəmli kodu daxil edin.');
    setBusy(true);
    const t = toast.loading('Yoxlanılır...');
    try {
      const r = await fetch(`${API_URL}/api/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });
      const d = await r.json();
      if (r.ok && d.token) {
        localStorage.setItem('token', d.token);
        if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
        if (d.user) localStorage.setItem('user', JSON.stringify(d.user));
        toast.update(t, { render: 'Email təsdiqləndi! Xoş gəldiniz.', type: 'success', isLoading: false, autoClose: 1800 });
        setTimeout(() => { navigate('/'); window.location.reload(); }, 1000);
      } else {
        toast.update(t, { render: d.message || 'Kod yanlışdır.', type: 'error', isLoading: false, autoClose: 2500 });
        setBusy(false);
      }
    } catch {
      toast.update(t, { render: 'Bağlantı xətası.', type: 'error', isLoading: false, autoClose: 2500 });
      setBusy(false);
    }
  };

  const handleResend = async () => {
    const t = toast.loading('Kod göndərilir...');
    try {
      await fetch(`${API_URL}/api/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      toast.update(t, { render: 'Yeni kod göndərildi.', type: 'success', isLoading: false, autoClose: 2000 });
    } catch {
      toast.update(t, { render: 'Xəta baş verdi.', type: 'error', isLoading: false, autoClose: 2000 });
    }
  };

  return (
    <div className="main-content" style={{ minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'var(--bg-surface)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <MailCheck size={42} color="#14224F" style={{ marginBottom: 12 }} />
        <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Email təsdiqi</h2>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: '0 0 24px' }}>
          <b>{email}</b> ünvanına 6 rəqəmli təsdiq kodu göndərdik. Kodu daxil edin.
        </p>
        <form onSubmit={handleVerify}>
          <input
            className="auth-input"
            inputMode="numeric"
            maxLength={6}
            placeholder="------"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: 24, fontWeight: 700 }}
            autoFocus
          />
          <button type="submit" className="btn-evden-cta" disabled={busy}
            style={{ width: '100%', marginTop: 16, padding: 12, border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Yoxlanılır...' : 'Təsdiqlə'}
          </button>
        </form>
        <button onClick={handleResend}
          style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--brand)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
          Kod gəlmədi? Yenidən göndər
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;
