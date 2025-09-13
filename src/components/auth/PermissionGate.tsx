import React from 'react';
import { useHasPermission } from '@/hooks/useUserPermissions';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGateProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ 
  children, 
  permission, 
  fallback = null 
}) => {
  const { isRegionalAdmin, isSuperAdmin } = useAuth();
  const { data: hasPermission, isLoading } = useHasPermission(permission);

  // Super admins and regional admins have all permissions by default
  if (isSuperAdmin() || isRegionalAdmin()) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default PermissionGate;