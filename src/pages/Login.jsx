import React, { useState } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import GoogleSignIn from '../components/GoogleSignIn';

function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const loadingToast = toast.loading("Giriş edilir, zəhmət olmasa gözləyin...");

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      // Email təsdiqlənməyibsə (#1) — təsdiq səhifəsinə yönləndir
      if (response.status === 403 && data.needVerify) {
        toast.update(loadingToast, { render: 'Email təsdiqlənməyib. Təsdiq kodu göndərildi.', type: 'info', isLoading: false, autoClose: 2500 });
        setTimeout(() => navigate('/email-tesdiq', { state: { email: data.email || formData.email } }), 1000);
        return;
      }

      if (response.ok) {
        // Həmişə kalıcı saxla (localStorage) — istifadəçi özü çıxış edənə qədər giriş qalır
        localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        toast.update(loadingToast, { 
          render: `Xoş gəldiniz, ${data.user.fullName}! `, 
          type: "success", 
          isLoading: false, 
          autoClose: 2000 
        });
        
        // 1 saniyə sonra ana səhifəyə yönləndir
        setTimeout(() => {
          navigate('/');
          // Naviqasiya barının yenilənməsi üçün səhifəni tam yükləyirik
          window.location.reload(); 
        }, 1000);

      } else {
        toast.update(loadingToast, { 
          render: data.message || "Giriş xətası!", 
          type: "error", 
          isLoading: false, 
          autoClose: 3000 
        });
      }
    } catch (error) {
      console.error("Bağlantı xətası:", error);
      toast.update(loadingToast, { 
        render: "Serverlə əlaqə qurula bilmədi.", 
        type: "error", 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Yenidən Xoş Gəldiniz!</h2>
        <p className="auth-subtitle">Hesabınıza daxil olaraq işlərinizi idarə edin.</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">E-poçt</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="E-poçt ünvanınız"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Şifrə</label>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Şifrəniz"
              required
            />
          </div>

          <div className="form-options" style={{ justifyContent: 'flex-end' }}>
            <Link to="/sifreni-unutdun" className="forgot-password">Şifrəni unutmusan?</Link>
          </div>

          <button type="submit" className="auth-btn">Daxil Ol</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>və ya</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <GoogleSignIn />

        <div className="auth-footer">
          Hesabınız yoxdur? <Link to="/qeydiyyat" className="auth-link">Qeydiyyatdan keçin</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
