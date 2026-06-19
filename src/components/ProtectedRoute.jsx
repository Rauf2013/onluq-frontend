import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const location = useLocation();

  // adminOnly route üçün rol yoxla (backend onsuz da 403 verir, bu yalnız UX — adi user
  // admin panelinin boş qabığını görməsin).
  let isAdmin = false;
  try {
    const s = localStorage.getItem('user') || sessionStorage.getItem('user');
    isAdmin = s ? JSON.parse(s).role === 'admin' : false;
  } catch { isAdmin = false; }

  useEffect(() => {
    if (!token) toast.info('Bu səhifəyə keçid üçün giriş etməlisiniz.');
    else if (adminOnly && !isAdmin) toast.error('Bu səhifəyə yalnız admin keçə bilər.');
  }, [token, adminOnly, isAdmin]);

  if (!token) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
