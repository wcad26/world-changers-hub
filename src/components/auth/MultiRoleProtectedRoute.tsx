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
  const { user, loading, initialized, hasAnyRole, hasRegionalPortalAccess, isDcgMember } = useAuth();
  const location = useLocation();

  // Wait until both the loading flag is cleared AND the auth hook has
  // completed its initial probe. Prevents redirect-on-transient-null
  // races during INITIAL_SESSION boot or token refresh.
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/regional" state={{ from: location }} replace />;
  }

  // If regional_admin is in allowedRoles, also accept users with regional role assignments.
  // If dcg_admin is in allowedRoles, also accept users with a real DCG association
  // (so DCG leaders without an explicit dcg_admin row can still enter the DCG portal).
  // This must match DcgProtectedRoute and AuthContext.canAccessPortal('dcg').
  const hasRegionalInAllowed = allowedRoles.includes('regional_admin');
  const hasDcgInAllowed = allowedRoles.includes('dcg_admin');
  if (
    hasAnyRole(allowedRoles) ||
    (hasRegionalInAllowed && hasRegionalPortalAccess) ||
    (hasDcgInAllowed && isDcgMember)
  ) {
    return <>{children}</>;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default MultiRoleProtectedRoute;