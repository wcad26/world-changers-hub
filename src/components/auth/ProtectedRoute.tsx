import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin';
  allowedRoles?: Array<'super_admin' | 'regional_admin' | 'member' | 'dcg_admin'>;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  redirectTo = '/portal-selector',
}) => {
  const { user, loading, initialized, authReady, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Hold the route until the initial auth restore has truly finished.
  // `authReady` only flips on once and never flips off, so it is safe
  // against transient HMR/StrictMode remounts.
  if (!authReady || loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
