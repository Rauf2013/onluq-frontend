import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const location = useLocation();

  useEffect(() => {
    if (!token) toast.info('Bu səhifəyə keçid üçün giriş etməlisiniz.');
  }, [token]);

  if (!token) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />;
  }

  return children;
}
