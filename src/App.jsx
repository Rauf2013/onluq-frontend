import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
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
import NotFound from './pages/NotFound';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

function App() {
  return (
    <ThemeProvider>
    <Router>
      <Navbar />
      <ToastContainer position="top-center" autoClose={1500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover transition={Slide} />

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

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
    </ThemeProvider>
  );
}

export default App;
