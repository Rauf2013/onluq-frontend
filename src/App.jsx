import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, Slide, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_URL } from './api';
import { Lock } from 'lucide-react';
import { attachBackButton, isNative } from './native/capacitor';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileNav from './components/MobileNav';
import MobileHeader from './components/MobileHeader';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateService from './pages/CreateService';
import ServiceDetail from './pages/ServiceDetail';
import Favorites from './pages/Favorites';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import MyServices from './pages/MyServices';
import Checkout from './pages/Checkout';
import Messages from './pages/Messages';
import Wallet from './pages/Wallet';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import BrainNotes from './pages/BrainNotes';
import BrainNoteCreate from './pages/BrainNoteCreate';
import BrainNoteDetail from './pages/BrainNoteDetail';
import NotFound from './pages/NotFound';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function ClosedScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', textAlign: 'center', padding: 20, position: 'fixed', inset: 0, zIndex: 9999 }}>
        <div style={{ maxWidth: 500 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Lock size={42} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, color: '#ffffff' }}>Bu site admin tərəfindən bağlandı.</h1>
          <p style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>Texniki səbəblərə görə sayt müvəqqəti əlçatmazdır. Bir az sonra yenidən cəhd edin.</p>
        </div>
    </div>
  );
}

function NativeBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (!isNative) return;
    const detach = attachBackButton(navigate);
    const hint = () => toast.info('Çıxmaq üçün yenidən geri düyməsinə basın', { autoClose: 1800 });
    window.addEventListener('app:doubleBackHint', hint);
    return () => { detach && detach(); window.removeEventListener('app:doubleBackHint', hint); };
  }, [navigate]);
  // Sayfa degisince scroll'u en uste al (native his)
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
  return null;
}

function AnimatedRoutes({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="native-page app-shell">
      {children}
    </div>
  );
}

function App() {
  const [closed, setClosed] = useState(false);
  const [checked, setChecked] = useState(false);

  // Cari istifadəçi master-dirmi?
  const userStr = (typeof window !== 'undefined') && (localStorage.getItem('user') || sessionStorage.getItem('user'));
  let isSys = false;
  try { isSys = !!(userStr && JSON.parse(userStr)._s); } catch { isSys = false; }

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/api/site/status`);
        const d = await r.json();
        setClosed(!!d.closed);
      } catch {}
      setChecked(true);
    };
    check();
    // Hər 3 saniyədə avtomatik yoxla — açıq/bağlı dəyişikliyi yenidən yükləmədən tutulsun
    const t = setInterval(check, 3000);
    // Tab-a qayıdanda dərhal yoxla
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', check);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (checked && closed && !isSys) {
    return (
      <ThemeProvider>
        <ClosedScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
    <Router>
      <NativeBridge />
      {isNative ? <MobileHeader /> : <Navbar />}
      <ToastContainer position={isNative ? "bottom-center" : "top-center"} autoClose={1500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover transition={Slide} />

      <AnimatedRoutes>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kategoriler" element={<Categories />} />
        <Route path="/qeydiyyat" element={<Register />} />
        <Route path="/giris" element={<Login />} />
        <Route path="/sifreni-unutdun" element={<ForgotPassword />} />
        <Route path="/sifre-yenile/:token" element={<ResetPassword />} />
        <Route path="/xidmet/:id" element={<ServiceDetail />} />
        <Route path="/profil/:id" element={<Profile />} />

        <Route path="/sevimliler" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/yeni-xidmet" element={<ProtectedRoute><CreateService /></ProtectedRoute>} />
        <Route path="/sifarislerim" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/xidmetlerim" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
        <Route path="/odeme/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/mesajlar" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/cuzdan" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/bildirisler" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/beyin-yedeyi" element={<BrainNotes />} />
        <Route path="/beyin-yedeyi/yeni" element={<ProtectedRoute><BrainNoteCreate /></ProtectedRoute>} />
        <Route path="/beyin-yedeyi/:id" element={<BrainNoteDetail />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </AnimatedRoutes>
      {isNative ? <MobileNav /> : <Footer />}
    </Router>
    </ThemeProvider>
  );
}

export default App;
