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
    <div ref={ref} style={{ position: 'absolute', top: 18, left: 18, zIndex: 3500 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fbbf24', padding: '4px 8px 4px 9px', borderRadius: 6, boxShadow: '0 3px 8px rgba(0,0,0,0.25)' }}>
        <span style={{ color: 'white', fontSize: 11, fontWeight: 900, letterSpacing: 0.6 }}>BETA</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '0 2px' }}>—</span>
        <button onClick={() => setOpen((v) => !v)} title="Beta haqqında" aria-label="Beta haqqında"
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <HelpCircle size={15} />
        </button>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 38, left: 0, background: 'white', color: '#334155', padding: 14, borderRadius: 10, width: 290, boxShadow: '0 10px 24px rgba(0,0,0,0.25)', fontSize: 12.5, lineHeight: 1.55, maxHeight: 260, overflowY: 'auto', border: '1px solid #e2e8f0' }}>
          {variant === 'guest' ? guestText : fullText}
        </div>
      )}
    </div>
  );
}

export default BetaInfo;
