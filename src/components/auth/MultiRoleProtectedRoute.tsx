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
  redirectTo = '/portal-selector',
}) => {
  const { user, loading, initialized, authReady, hasAnyRole, hasRegionalPortalAccess, isDcgMember } = useAuth();
  const location = useLocation();

  // Wait for the initial auth restore to fully complete before deciding
  // anything. This avoids redirect-on-transient-null races.
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
