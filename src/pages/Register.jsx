import React, { useState } from 'react';
import { API_URL } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import GoogleSignIn from '../components/GoogleSignIn';

function Register() {
  const navigate = useNavigate();
  
  // 1. Formdan gələcək məlumatları tutmaq üçün State yaradırıq
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  // 2. İnputlara yazı yazıldıqca State-i yeniləyən funksiya
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. Qeydiyyat düyməsinə basıldıqda çalışacaq əsas funksiya
  const handleSubmit = async (e) => {
    e.preventDefault(); // Səhifənin yenilənməsinin qarşısını alırıq
    
    // Ekranda qəşəng bir "yüklənir" animasiyası göstəririk
    const loadingToast = toast.loading("Qeydiyyat aparılır, zəhmət olmasa gözləyin...");

    try {
      // Backend-ə (Node.js) məlumatları POST metodu ilə göndəririk
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Əgər qeydiyyat uğurlu oldusa
        toast.update(loadingToast, { 
          render: "Qeydiyyat uğurla tamamlandı! İndi giriş edə bilərsiniz. ", 
          type: "success", 
          isLoading: false, 
          autoClose: 3000 
        });
        
        // 1.5 saniyə sonra istifadəçini Giriş səhifəsinə avtomatik yönləndiririk
        setTimeout(() => {
          navigate('/giris');
        }, 1500);

      } else {
        // Əgər e-poçt artıq varsa və ya başqa xəta çıxarsa
        toast.update(loadingToast, { 
          render: data.message || "Xəta baş verdi!", 
          type: "error", 
          isLoading: false, 
          autoClose: 3000 
        });
      }
    } catch (error) {
      console.error("Bağlantı xətası:", error);
      // Server bağlı olanda və ya internet kəsiləndə
      toast.update(loadingToast, { 
        render: "Serverlə əlaqə qurula bilmədi. Backend-in işlədiyinə əmin olun.", 
        type: "error", 
        isLoading: false, 
        autoClose: 3000 
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Aramıza Xoş Gəldiniz!</h2>
        <p className="auth-subtitle">Platformaya qoşulmaq üçün məlumatlarınızı daxil edin.</p>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-fullname">Ad və Soyad</label>
            <input
              id="reg-fullname"
              type="text"
              name="fullName"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
              className="auth-input"
              placeholder="Məsələn: Elvin Məmmədov"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">E-poçt</label>
            <input
              id="reg-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="elvin@mail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Şifrə</label>
            <input
              id="reg-password"
              type="password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="auth-input"
              placeholder="Ən az 8 simvol"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-btn">Qeydiyyatdan Keç</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span>və ya</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <GoogleSignIn rememberMe={true} />

        <div className="auth-footer">
          Artıq hesabınız var? <Link to="/giris" className="auth-link">Giriş edin</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
