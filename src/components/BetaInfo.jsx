import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react';

// variant: 'full' (loginli) | 'guest' (qonaq)
function BetaInfo({ variant = 'full' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const guestText = (
    <>
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>BETA — Test versiyası</p>
      <p style={{ margin: 0 }}>AI hələ test mərhələsindədir, bəzən səhv edə bilər. Qeydiyyatdan keçmədiyin üçün bəzi funksiyalar (söhbət xatirəsi, bilik bazası, geniş cavab, daha çox sorğu) məhduddur. Tam erişim üçün <strong>qeydiyyatdan keç</strong>.</p>
    </>
  );

  const fullText = (
    <>
      <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f172a' }}>BETA — Test mərhələsi</p>
      <p style={{ margin: '0 0 8px' }}>Bu AI köməkçi hələ təcrübə mərhələsindədir, bəzən səhv cavab verə, mövzunu çaşa, və ya yavaşlaya bilər. Xüsusi məhdudiyyətlər:</p>
      <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>
        <li>Cavabları kor-koranə qəbul etmə — vacib qərarlardan əvvəl mənbədən yoxla</li>
        <li>Bilik bazası genişləndikcə daha dəqiq cavab verəcək</li>
        <li>Bəzən kontekst itə bilər — söhbəti təmizlə</li>
        <li>Texniki suala daha yaxşı cavab verir, ümumi söhbətdə bəzən qaba ola bilər</li>
      </ul>
      <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>Səhv cavab gördükdə bizə bildir — geri bildirim sayəsində yaxşılaşır.</p>
    </>
  );

  return (
    <div ref={ref} style={{ position: 'absolute', top: 14, left: 14, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ background: '#fbbf24', color: 'white', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900, transform: 'rotate(-8deg)', letterSpacing: 0.6, boxShadow: '0 2px 4px rgba(0,0,0,0.25)', display: 'inline-block' }}>BETA</span>
        <button onClick={() => setOpen((v) => !v)} title="Beta haqqında" aria-label="Beta haqqında"
          style={{ background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '50%', width: 22, height: 22, color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}>
          <HelpCircle size={14} />
        </button>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 34, left: 0, background: 'white', color: '#334155', padding: 14, borderRadius: 10, width: 290, boxShadow: '0 10px 24px rgba(0,0,0,0.25)', fontSize: 12.5, lineHeight: 1.55, maxHeight: 260, overflowY: 'auto' }}>
          {variant === 'guest' ? guestText : fullText}
        </div>
      )}
    </div>
  );
}

export default BetaInfo;
