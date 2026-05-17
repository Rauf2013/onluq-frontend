import React from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      background: 'var(--bg-page)'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 480,
        background: 'var(--bg-surface)',
        padding: '60px 40px',
        borderRadius: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ fontSize: 96, fontWeight: 800, color: 'var(--brand)', lineHeight: 1, marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ fontSize: 26, color: 'var(--text-primary)', marginBottom: 12 }}>
          Səhifə tapılmadı
        </h1>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 30, lineHeight: 1.6 }}>
          Axtardığınız səhifə mövcud deyil və ya köçürülüb. Aşağıdakı linklərdən birini istifadə edə bilərsiniz.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: 'var(--brand)', color: 'white',
            textDecoration: 'none', borderRadius: 10, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}>
            <HomeIcon size={18} /> Ana Səhifə
          </Link>
          <Link to="/kategoriler" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: 'var(--bg-surface)',
            color: 'var(--text-primary)', textDecoration: 'none',
            borderRadius: 10, fontWeight: 700, border: '1px solid var(--border)'
          }}>
            <Compass size={18} /> Kateqoriyalar
          </Link>
        </div>
      </div>
    </div>
  );
}
