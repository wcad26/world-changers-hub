import React from 'react';

interface MultiRoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/** Pass-through. All client-side role checks removed. */
const MultiRoleProtectedRoute: React.FC<MultiRoleProtectedRouteProps> = ({ children }) => <>{children}</>;

export default MultiRoleProtectedRoute;
