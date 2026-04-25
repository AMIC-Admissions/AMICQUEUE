
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireCounter = false }) {
  const { isAuthenticated, selectedCounter } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireCounter && !selectedCounter) {
    return <Navigate to="/counter-select" replace />;
  }

  return children;
}
