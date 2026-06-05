import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import EvdenLogo from './EvdenLogo';

function Footer() {
  const location = useLocation();
  const hidePaths = ['/giris', '/qeydiyyat', '/mesajlar', '/sifreni-unutdun'];
  if (hidePaths.includes(location.pathname) || location.pathname.startsWith('/sifre-yenile/')) {
    return null;
  }

  return (
    <footer style={{
      background: '#14224F',
      color: '#fff',
      padding: '48px 5% 28px',
      borderTop: '4px solid #FFED00',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        textAlign: 'center',
      }}>
        <div style={{ color: '#FFED00', display: 'flex', justifyContent: 'center' }}>
          <EvdenLogo size={56} />
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 4, color: '#fff' }}>EVDƏN</div>
        <div style={{ color: '#FFED00', fontSize: 15, fontWeight: 600 }}>
          Evdən başlayan xidmət bazarı
        </div>
        <div style={{
          display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center',
          marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.75)',
        }}>
          <Link to="/kategoriler" style={{ color: 'inherit', textDecoration: 'none' }}>Kateqoriyalar</Link>
          <Link to="/beyin-yedeyi" style={{ color: 'inherit', textDecoration: 'none' }}>Beyin yedəyi</Link>
          <a href="mailto:destek@evden.az" style={{ color: 'inherit', textDecoration: 'none' }}>destek@evden.az</a>
        </div>
        <div style={{
          marginTop: 14, paddingTop: 18,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: 13, color: 'rgba(255,255,255,0.55)',
          width: '100%',
        }}>
          © {new Date().getFullYear()} EVDƏN. Bütün hüquqlar qorunur.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
