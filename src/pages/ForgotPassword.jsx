import React, { useState } from 'react';
import { API_URL } from '../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("E-poçt göndərilir...");

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.update(loadingToast, { render: data.message, type: "success", isLoading: false, autoClose: 4000 });
      } else {
        toast.update(loadingToast, { render: data.message, type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(loadingToast, { render: "Bağlantı xətası.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Şifrəni Unutmusan?</h2>
        <p className="auth-subtitle">E-poçt ünvanınızı yazın, sizə yeniləmə linki göndərək.</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-poçt</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" placeholder="E-poçt ünvanınız" required />
          </div>
          <button type="submit" className="auth-btn">Linki Göndər</button>
        </form>
        
        <div className="auth-footer">
          <Link to="/giris" className="auth-link">Giriş səhifəsinə qayıt</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
