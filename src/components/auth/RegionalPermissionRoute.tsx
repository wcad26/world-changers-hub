import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { REGIONAL_PAGES } from '@/config/regionalPermissions';

interface RegionalPermissionRouteProps {
  /** The view permission required to access this route */
  permission: string;
  children: React.ReactNode;
}

/**
 * Per-route guard for the regional admin portal.
 *
 * - Super admins and base regional_admin users bypass the check.
 * - Otherwise, the user must hold `permission` via a regional_user_roles assignment.
 * - Users without permission are redirected to the first page they CAN access,
 *   or to /unauthorized if they have no regional pages at all.
 *
 * This guarantees that pages are not just hidden in the sidebar but truly
 * unreachable by typing the URL directly.
 */
const RegionalPermissionRoute: React.FC<RegionalPermissionRouteProps> = ({
  permission,
  children,
}) => {
  const { loading, user, hasRole, hasRegionalPermission, userRegionalRoles } = useAuth();
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

  // Only super admins skip the granular permission check.
  // The base `regional_admin` role is just a login token — region owners still
  // pass via the auto-created "Regional Admin" granular role they hold.
  if (hasRole('super_admin')) {
    return <>{children}</>;
  }

  if (hasRegionalPermission(permission)) {
    return <>{children}</>;
  }

  // Find the first regional page this user CAN access and redirect there.
  const ownedPermissions = new Set<string>(
    (userRegionalRoles || []).flatMap(
      (ur: any) => ur?.regional_roles?.permissions ?? [],
    ),
  );
  const fallback = REGIONAL_PAGES.find((p) => ownedPermissions.has(p.permission));

  if (fallback && fallback.path !== location.pathname) {
    return <Navigate to={fallback.path} replace />;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default RegionalPermissionRoute;
