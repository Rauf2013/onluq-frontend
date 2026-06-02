import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Brain, AlertTriangle, Lightbulb, BookOpen, GitBranch, Tag, Send } from 'lucide-react';
import { CATEGORY_DATA } from '../constants/categories';

const LEVELS = [
  { v: 'Yeni Satıcı', l: 'Hamı görsün (Yeni Satıcı)' },
  { v: 'Onaylı Satıcı', l: 'Onaylı Satıcı və yuxarı' },
  { v: 'Pro Satıcı', l: 'Pro Satıcı və yuxarı' },
  { v: 'Süper Satıcı', l: 'Yalnız Süper Satıcılar' },
];

function BrainNoteCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  // Sifariş səhifəsindən "Beyin yedəyi əlavə et" düyməsi ilə gəlirsə, ön-doldur
  const presetOrder = location.state?.order || null;

  const [form, setForm] = useState({
    title: '',
    category: presetOrder?.serviceId?.category || '',
    challenge: '',
    solution: '',
    resources: '',
    alternatives: '',
    tags: '',
    requiredLevel: 'Yeni Satıcı',
    orderId: presetOrder?._id || null,
    serviceId: presetOrder?.serviceId?._id || null,
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.warning('Başlıq yaz.');
    if (!form.category.trim()) return toast.warning('Kateqoriya seç.');
    if (!form.challenge.trim()) return toast.warning('Problem təsvirini yaz.');
    if (!form.solution.trim()) return toast.warning('Həll təsvirini yaz.');

    setSubmitting(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const t = toast.loading('Yedək göndərilir...');
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
      const r = await fetch(`${API_URL}/api/brain-notes`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        toast.update(t, { render: 'Beyin yedəyi yaradıldı!', type: 'success', isLoading: false, autoClose: 1800 });
        navigate(`/beyin-yedeyi/${d.note._id}`);
      } else {
        toast.update(t, { render: d.message || 'Xəta', type: 'error', isLoading: false, autoClose: 2200 });
      }
    } catch {
      toast.update(t, { render: 'Bağlantı xətası', type: 'error', isLoading: false, autoClose: 2200 });
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ icon: Icon, label, hint, children, required }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
        <Icon size={16} color="#6366f1" /> {label}{required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {hint && <p style={{ margin: '0 0 8px', color: 'var(--text-tertiary)', fontSize: 12, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );

  return (
    <div className="main-content brain-create-page" style={{ maxWidth: 800, margin: '30px auto', padding: '0 16px' }}>
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', borderRadius: 18, padding: 28, marginBottom: 24, boxShadow: '0 10px 30px rgba(99,102,241,0.25)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Brain size={28} />
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Beyin yedəyi yaz</h1>
        </div>
        <p style={{ margin: 0, opacity: 0.9, fontSize: 14, lineHeight: 1.6 }}>
          Bu işdə qarşılaşdığın problemləri və həll yollarını qeyd et — başqaları eyni problemlə qarşılaşanda saatlarla vaxt qənaət edəcəklər.
        </p>
      </div>

      {presetOrder && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: 12, marginBottom: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong>"{presetOrder.serviceId?.title}"</strong> sifarişi ilə əlaqəlidir. Kateqoriya avtomatik dolduruldu.
        </div>
      )}

      <form onSubmit={submit} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>

        <Field icon={Brain} label="Başlıq" required hint="Qısa, axtarılabilən bir cümlə. Məs: 'React 18-də CORS xətası loginlə'">
          <input value={form.title} onChange={(e) => update('title', e.target.value)} className="auth-input" maxLength={140} style={{ width: '100%', marginBottom: 0 }} />
        </Field>

        <Field icon={Tag} label="Kateqoriya" required>
          <select value={form.category} onChange={(e) => update('category', e.target.value)} className="auth-input" style={{ width: '100%', marginBottom: 0 }}>
            <option value="">— Seç —</option>
            {CATEGORY_DATA.map((c) => (
              <optgroup key={c.name} label={c.name}>
                <option value={c.name}>{c.name} (ümumi)</option>
                {c.subcategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field icon={AlertTriangle} label="Qarşılaşdığın ən böyük problem nə idi?" required hint="Konkret yaz. Hansı kontekstdə, nə baş verdi?">
          <textarea value={form.challenge} onChange={(e) => update('challenge', e.target.value)} className="auth-input" maxLength={2000} rows={4} style={{ width: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>{form.challenge.length}/2000</div>
        </Field>

        <Field icon={Lightbulb} label="Onu necə həll etdin?" required hint="Addım-addım təsvir et. Kod parçası, komanda, parametr — hər şey yararlıdır.">
          <textarea value={form.solution} onChange={(e) => update('solution', e.target.value)} className="auth-input" maxLength={5000} rows={6} style={{ width: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>{form.solution.length}/5000</div>
        </Field>

        <Field icon={BookOpen} label="Hansı kaynakları istifadə etdin?" hint="Linklər, dokumantasiya, Stack Overflow cavabları, kitablar, kurslar...">
          <textarea value={form.resources} onChange={(e) => update('resources', e.target.value)} className="auth-input" maxLength={2000} rows={3} style={{ width: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>

        <Field icon={GitBranch} label="Başqa hansı yolları sınadın?" hint="İşləməyən yanaşmalar da dəyərlidir — başqaları o yolda vaxt itirməsin.">
          <textarea value={form.alternatives} onChange={(e) => update('alternatives', e.target.value)} className="auth-input" maxLength={2000} rows={3} style={{ width: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit' }} />
        </Field>

        <Field icon={Tag} label="Etiketlər" hint="Vergüllə ayır. Məs: react, cors, jwt">
          <input value={form.tags} onChange={(e) => update('tags', e.target.value)} className="auth-input" placeholder="react, debugging, performance" style={{ width: '100%', marginBottom: 0 }} />
        </Field>

        <Field icon={Brain} label="Kim görsün?" hint="Səviyyə filteri. Default-da hamı görür.">
          <select value={form.requiredLevel} onChange={(e) => update('requiredLevel', e.target.value)} className="auth-input" style={{ width: '100%', marginBottom: 0 }}>
            {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="button" onClick={() => navigate(-1)} className="btn-modal-cancel" style={{ flex: 1, padding: 12 }}>Ləğv et</button>
          <button type="submit" disabled={submitting}
            style={{ flex: 2, padding: 12, background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: submitting ? 0.7 : 1 }}>
            <Send size={16} /> {submitting ? 'Göndərilir...' : 'Beyin yedəyini paylaş'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BrainNoteCreate;
