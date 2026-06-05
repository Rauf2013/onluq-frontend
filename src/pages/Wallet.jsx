import React, { useState, useEffect } from 'react';
import { API_URL } from '../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Wallet as WalletIcon, CreditCard, ArrowDownCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

function Wallet() {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchWalletData = async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return navigate('/giris');

    try {
      const userRes = await fetch(`${API_URL}/api/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      const withdrawRes = await fetch(`${API_URL}/api/withdrawals/my`, { headers: { 'Authorization': `Bearer ${token}` } });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setBalance(userData.balance || 0);
      }
      if (withdrawRes.ok) {
        const withdrawData = await withdrawRes.json();
        setWithdrawals(withdrawData);
      }
    } catch (error) {
      toast.error("Bağlantı xətası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (amount < 10) return toast.warning("Minimum çəkim 10 AZN-dir.");
    if (amount > balance) return toast.error("Balansınızda bu qədər məbləğ yoxdur.");
    if (iban.length < 16) return toast.warning("Düzgün IBAN və ya Kart nömrəsi daxil edin.");

    setIsSubmitting(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
          {withdrawals.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>Hələ heç bir pul çəkmə tələbiniz yoxdur.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {withdrawals.map(w => {
                let statusColor = '#f59e0b'; 
                let StatusIcon = Clock;
                if (w.status === 'Tamamlandı') { statusColor = '#14224F'; StatusIcon = CheckCircle; }
                if (w.status === 'Rədd Edildi') { statusColor = '#ef4444'; StatusIcon = XCircle; }

                return (
                  <div key={w._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)', fontSize: '16px' }}>{w.amount} AZN</h4>
                      <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '12px' }}>{new Date(w.createdAt).toLocaleDateString()} - {w.iban.substring(0, 4)}...{w.iban.substring(w.iban.length - 4)}</p>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold', color: statusColor, background: `${statusColor}20`, padding: '5px 10px', borderRadius: '20px' }}>
                      <StatusIcon size={14} /> {w.status}
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
