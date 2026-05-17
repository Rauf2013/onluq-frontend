import React, { useState } from 'react';
import { API_URL } from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Şifrə yenilənir...");

    try {
      const response = await fetch(`${API_URL}/api/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (response.ok) {
        toast.update(loadingToast, { render: data.message, type: "success", isLoading: false, autoClose: 3000 });
        setTimeout(() => navigate('/giris'), 2000);
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
        <h2 className="auth-title">Yeni Şifrə Təyin Edin</h2>
        <p className="auth-subtitle">Hesabınız üçün yeni və güclü bir şifrə yazın.</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Yeni Şifrə</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" placeholder="Ən az 8 simvol" required minLength="8"/>
          </div>
          <button type="submit" className="auth-btn">Şifrəni Yenilə</button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
