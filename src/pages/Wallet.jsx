import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, CreditCard, ArrowDownCircle, ArrowUpCircle, PlusCircle, Lock, CheckCircle, XCircle, Clock } from 'lucide-react';

const QUICK_AMOUNTS = [10, 25, 50, 100];

const formatCardNumber = (raw) =>
  raw.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');

const formatExpiry = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pul çəkmə formu
  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Balans artırma (top-up) formu
  const [topupAmount, setTopupAmount] = useState('');
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [isToppingUp, setIsToppingUp] = useState(false);

  const navigate = useNavigate();

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchWalletData = async () => {
    const token = getToken();
    if (!token) return navigate('/giris');

    try {
      const [userRes, withdrawRes, topupRes] = await Promise.all([
        fetch(`${API_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/withdrawals/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/wallet/topups/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setBalance(userData.balance || 0);
      }
      if (withdrawRes.ok) setWithdrawals(await withdrawRes.json());
      if (topupRes.ok) setTopups(await topupRes.json());
    } catch (error) {
      toast.error("Bağlantı xətası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    const numAmount = Number(topupAmount);
    if (!numAmount || numAmount < 1) return toast.warning("Minimum yükləmə 1 AZN-dir.");
    if (numAmount > 10000) return toast.warning("Maksimum yükləmə 10000 AZN-dir.");
    if (card.name.trim().split(/\s+/).length < 2) return toast.warning("Kart sahibinin ad və soyadını tam yazın.");
    if (!/^\d{16}$/.test(card.number.replace(/\s/g, ''))) return toast.warning("Kart nömrəsi 16 rəqəm olmalıdır.");
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return toast.warning("Bitmə tarixi AA/İİ formatında olmalıdır.");
    if (!/^\d{3,4}$/.test(card.cvv)) return toast.warning("CVV 3 və ya 4 rəqəm olmalıdır.");

    setIsToppingUp(true);
    const token = getToken();
    const loadToast = toast.loading("Ödəniş işlənir...");

    try {
      const response = await fetch(`${API_URL}/api/wallet/topup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, cardNumber: card.number.replace(/\s/g, '') })
      });
      const data = await response.json();

      if (response.ok) {
        toast.update(loadToast, { render: data.message, type: "success", isLoading: false, autoClose: 3000 });
        if (typeof data.balance === 'number') setBalance(data.balance);
        setTopupAmount('');
        setCard({ name: '', number: '', expiry: '', cvv: '' });
        fetchWalletData();
      } else {
        toast.update(loadToast, { render: data.message || "Xəta baş verdi.", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(loadToast, { render: "Bağlantı xətası.", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (amount < 10) return toast.warning("Minimum çəkim 10 AZN-dir.");
    if (amount > balance) return toast.error("Balansınızda bu qədər məbləğ yoxdur.");
    if (iban.length < 16) return toast.warning("Düzgün IBAN və ya Kart nömrəsi daxil edin.");

    setIsSubmitting(true);
    const token = getToken();
    const loadToast = toast.loading("Tələb göndərilir...");

    try {
      const response = await fetch(`${API_URL}/api/withdrawals`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amount), iban })
      });
      const data = await response.json();

      if (response.ok) {
        toast.update(loadToast, { render: data.message, type: "success", isLoading: false, autoClose: 3000 });
        setBalance(prevBalance => prevBalance - Number(amount));
        setAmount('');
        setIban('');
        fetchWalletData();
      } else {
        toast.update(loadToast, { render: data.message, type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (error) {
      toast.update(loadToast, { render: "Xəta baş verdi.", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '100px'}}>Yüklənir...</div>;

  // Top-up + withdrawal-ları birləşdirib tarixə görə sırala
  const transactions = [
    ...topups.map(t => ({ ...t, _type: 'topup' })),
    ...withdrawals.map(w => ({ ...w, _type: 'withdraw' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="main-content" style={{ minHeight: '70vh', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <WalletIcon size={28} color="#14224F" /> Cüzdanım və Qazanclarım
      </h2>

      <div className="wallet-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>

        <div style={{ background: 'var(--bg-surface)', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
          <div style={{ background: 'linear-gradient(135deg, #14224F 0%, #0C1733 100%)', padding: '30px', borderRadius: '12px', color: 'white', marginBottom: '30px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: '0.9' }}>Mövcud Balans</p>
            <h1 style={{ margin: 0, fontSize: '42px', fontWeight: '800' }}>{balance.toFixed(2)} AZN</h1>
          </div>

          {/* === BALANS ARTIR (TOP-UP) === */}
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="#14224F" /> Balansı Artır
          </h3>
          <form onSubmit={handleTopup}>
            <div className="form-group">
              <label>Yüklənəcək Məbləğ (AZN)</label>
              <input type="number" className="auth-input" placeholder="Məs: 50" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} min="1" required />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
              {QUICK_AMOUNTS.map(q => (
                <button type="button" key={q} onClick={() => setTopupAmount(String(q))}
                  style={{ flex: 1, minWidth: '60px', padding: '8px 4px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: Number(topupAmount) === q ? '#14224F' : 'var(--bg-page)',
                    color: Number(topupAmount) === q ? '#fff' : 'var(--text-primary)',
                    fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                  {q} ₼
                </button>
              ))}
            </div>
            <div className="form-group">
              <label>Kartın Üzərindəki Ad</label>
              <input type="text" className="auth-input" placeholder="Ad Soyad" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} autoComplete="cc-name" required />
            </div>
            <div className="form-group">
              <label>Kart Nömrəsi</label>
              <input type="text" inputMode="numeric" className="auth-input" placeholder="0000 0000 0000 0000" maxLength={19} value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} autoComplete="cc-number" required />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Bitmə Tarixi</label>
                <input type="text" inputMode="numeric" className="auth-input" placeholder="AA/İİ" maxLength={5} value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} autoComplete="cc-exp" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>CVV</label>
                <input type="text" inputMode="numeric" className="auth-input" placeholder="123" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} autoComplete="cc-csc" required />
              </div>
            </div>
            <button type="submit" className="btn-evden-cta" style={{ width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: 'pointer', opacity: isToppingUp ? 0.7 : 1 }} disabled={isToppingUp}>
              <ArrowUpCircle size={18} /> {isToppingUp ? 'İşlənir...' : `Balansı Artır${topupAmount ? ` (${Number(topupAmount).toFixed(2)} AZN)` : ''}`}
            </button>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <Lock size={12} /> Bütün ödənişlər 256-bit SSL ilə qorunur.
            </p>
          </form>

          <div style={{ height: '1px', background: 'var(--border)', margin: '28px 0' }} />

          {/* === PUL ÇƏK (WITHDRAW) === */}
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} /> Bank Hesabına Pul Çək
          </h3>
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label>Çəkiləcək Məbləğ (AZN)</label>
              <input type="number" className="auth-input" placeholder="Məs: 50" value={amount} onChange={(e) => setAmount(e.target.value)} required max={balance} />
            </div>
            <div className="form-group">
              <label>IBAN və ya Kart Nömrəsi</label>
              <input type="text" className="auth-input" placeholder="AZ00 IBAZ 0000 0000 0000 0000 00" value={iban} onChange={(e) => setIban(e.target.value)} required />
            </div>
            <button type="submit" className="btn-publish" style={{ width: '100%', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSubmitting || balance < 10 ? 0.7 : 1 }} disabled={isSubmitting || balance < 10}>
              <ArrowDownCircle size={18} /> Tələbi Göndər
            </button>
            {balance < 10 && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>Pul çəkmək üçün balansınızda ən az 10 AZN olmalıdır.</p>}
          </form>
        </div>

        <div style={{ background: 'var(--bg-page)', padding: '30px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '20px' }}>Son Əməliyyatlar</h3>
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>Hələ heç bir əməliyyatınız yoxdur.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {transactions.map(tx => {
                if (tx._type === 'topup') {
                  return (
                    <div key={`t-${tx._id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#16a34a', fontSize: '16px' }}>+ {tx.amount.toFixed(2)} AZN</h4>
                        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '12px' }}>
                          {new Date(tx.createdAt).toLocaleDateString()} - Balans artırma{tx.cardLast4 ? ` · ****${tx.cardLast4}` : ''}
                        </p>
                      </div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold', color: '#16a34a', background: '#16a34a20', padding: '5px 10px', borderRadius: '20px' }}>
                        <ArrowUpCircle size={14} /> {tx.status}
                      </span>
                    </div>
                  );
                }
                // withdraw
                let statusColor = '#f59e0b';
                let StatusIcon = Clock;
                if (tx.status === 'Tamamlandı') { statusColor = '#14224F'; StatusIcon = CheckCircle; }
                if (tx.status === 'Rədd Edildi') { statusColor = '#ef4444'; StatusIcon = XCircle; }

                return (
                  <div key={`w-${tx._id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)', fontSize: '16px' }}>- {tx.amount} AZN</h4>
                      <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '12px' }}>{new Date(tx.createdAt).toLocaleDateString()} - {tx.iban.substring(0, 4)}...{tx.iban.substring(tx.iban.length - 4)}</p>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold', color: statusColor, background: `${statusColor}20`, padding: '5px 10px', borderRadius: '20px' }}>
                      <StatusIcon size={14} /> {tx.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Wallet;
