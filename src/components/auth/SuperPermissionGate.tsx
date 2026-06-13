import React from 'react';
import { useSuperAdminPermissions } from '@/hooks/useSuperAdminPermissions';

interface SuperPermissionGateProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Renders children only if the current super admin has the given permission.
 * Principals always pass. If the auth state isn't yet ready, renders nothing
 * (no flash of denied content).
 */
const SuperPermissionGate: React.FC<SuperPermissionGateProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { has, isReady } = useSuperAdminPermissions();
  if (!isReady) return null;
  if (!has(permission)) return <>{fallback}</>;
  return <>{children}</>;
};

export default SuperPermissionGate;
