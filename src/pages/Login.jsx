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
  
  // "Məni xatırla" üçün xüsusi state
  const [rememberMe, setRememberMe] = useState(false);

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

      if (response.ok) {
        // "Məni xatırla" seçilibsə kalıcı hafızaya (localStorage), seçilməyibsə keçici hafızaya (sessionStorage) yazırıq
        if (rememberMe) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('token', data.token);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }

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

          <div className="form-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              /> Məni xatırla
            </label>
            <Link to="/sifreni-unutdun" className="forgot-password">Şifrəni unutmusan?</Link>
          </div>

          <button type="submit" className="auth-btn">Daxil Ol</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>və ya</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <GoogleSignIn rememberMe={rememberMe} />

        <div className="auth-footer">
          Hesabınız yoxdur? <Link to="/qeydiyyat" className="auth-link">Qeydiyyatdan keçin</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
