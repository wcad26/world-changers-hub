import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface MultiRoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'super_admin' | 'regional_admin' | 'member' | 'dcg_admin'>;
  redirectTo?: string;
}

const MultiRoleProtectedRoute: React.FC<MultiRoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/portal-selector'
}) => {
  const { user, loading, hasAnyRole, hasRegionalPortalAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/regional" state={{ from: location }} replace />;
  }

  // If regional_admin is in allowedRoles, also accept users with regional role assignments
  const hasRegionalInAllowed = allowedRoles.includes('regional_admin');
  if (hasAnyRole(allowedRoles) || (hasRegionalInAllowed && hasRegionalPortalAccess)) {
    return <>{children}</>;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default MultiRoleProtectedRoute;