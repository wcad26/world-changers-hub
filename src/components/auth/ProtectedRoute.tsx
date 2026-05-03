import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  allowedRoles?: string[];
  redirectTo?: string;
}

/** Pass-through. All client-side role checks removed. */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => <>{children}</>;

export default ProtectedRoute;
