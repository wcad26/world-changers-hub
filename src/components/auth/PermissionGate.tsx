import React from 'react';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  fallback?: React.ReactNode;
}

/** Pass-through. All permission checks removed. */
const PermissionGate: React.FC<PermissionGateProps> = ({ children }) => <>{children}</>;

export default PermissionGate;
