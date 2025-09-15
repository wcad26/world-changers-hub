import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface DcgProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const DcgProtectedRoute: React.FC<DcgProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/dcg-auth'
}) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (!hasRole('dcg_admin') && !hasRole('regional_admin') && !hasRole('super_admin')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default DcgProtectedRoute;