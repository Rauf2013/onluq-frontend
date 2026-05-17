import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

const linkStyle = { color: 'var(--text-muted)', textDecoration: 'none', transition: '0.2s', cursor: 'pointer' };
const onHoverIn = (e) => { e.target.style.color = '#10b981'; };
const onHoverOut = (e) => { e.target.style.color = '#94a3b8'; };

function Footer() {
  const location = useLocation();

  const hidePaths = ['/giris', '/qeydiyyat', '/mesajlar', '/sifreni-unutdun'];
  if (hidePaths.includes(location.pathname) || location.pathname.startsWith('/sifre-yenile/')) {
    return null;
  }

  return (
    <footer style={{ background: '#0f172a', color: '#f8fafc', paddingTop: '60px', paddingBottom: '20px', marginTop: '60px', borderTop: '4px solid #10b981' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '40px' }}>

        <div>
          <h2 style={{ color: '#10b981', fontSize: '28px', fontWeight: '900', margin: '0 0 20px 0', letterSpacing: '-1px' }}>Onluq.</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '15px' }}>
            Azərbaycanın ən böyük frilanser platforması. İstedadlı mütəxəssisləri və böyük layihələri bir araya gətiririk. İşinizi peşəkarlara etibar edin.
          </p>
        </div>

        <div>
          <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>Kateqoriyalar</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><Link to="/kategoriler" style={linkStyle} onMouseOver={onHoverIn} onMouseOut={onHoverOut}>Qrafik və Dizayn</Link></li>
            <li><Link to="/kategoriler" style={linkStyle} onMouseOver={onHoverIn} onMouseOut={onHoverOut}>Proqramlaşdırma</Link></li>
            <li><Link to="/kategoriler" style={linkStyle} onMouseOver={onHoverIn} onMouseOut={onHoverOut}>Yazı və Tərcümə</Link></li>
            <li><Link to="/kategoriler" style={linkStyle} onMouseOver={onHoverIn} onMouseOut={onHoverOut}>Video və Montaj</Link></li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>Haqqımızda</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><span style={{ ...linkStyle, opacity: 0.6 }} title="Tezliklə">Biz Kimik?</span></li>
            <li><span style={{ ...linkStyle, opacity: 0.6 }} title="Tezliklə">Necə İşləyir?</span></li>
            <li><span style={{ ...linkStyle, opacity: 0.6 }} title="Tezliklə">Məxfilik Siyasəti</span></li>
            <li><span style={{ ...linkStyle, opacity: 0.6 }} title="Tezliklə">İstifadə Şərtləri</span></li>
          </ul>
        </div>

        <div>
          <h3 style={{ color: 'white', fontSize: '18px', marginBottom: '20px' }}>Dəstək və Əlaqə</h3>
          <a href="mailto:destek@onluq.az" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', marginBottom: '15px', textDecoration: 'none' }}>
            <Mail size={18} color="#10b981" /> destek@onluq.az
          </a>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'var(--text-muted)', transition: '0.2s' }} onMouseOver={onHoverIn} onMouseOut={onHoverOut}><Facebook size={24} /></a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'var(--text-muted)', transition: '0.2s' }} onMouseOver={onHoverIn} onMouseOut={onHoverOut}><Instagram size={24} /></a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter" style={{ color: 'var(--text-muted)', transition: '0.2s' }} onMouseOver={onHoverIn} onMouseOut={onHoverOut}><Twitter size={24} /></a>
            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ color: 'var(--text-muted)', transition: '0.2s' }} onMouseOver={onHoverIn} onMouseOut={onHoverOut}><Linkedin size={24} /></a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #1e293b', paddingTop: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Onluq.az - Bütün hüquqlar qorunur.</p>
      </div>
    </footer>
  );
}

export default Footer;
