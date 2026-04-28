import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireCounter = false, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, selectedCounter, selectedBranch } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireCounter && (!selectedCounter || !selectedBranch)) {
    return <Navigate to="/counter-select" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={selectedCounter ? "/dashboard" : "/counter-select"} replace />;
  }

  return children;
}
