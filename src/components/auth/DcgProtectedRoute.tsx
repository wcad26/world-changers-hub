import React from 'react';

interface DcgProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/** Pass-through. All client-side role checks removed. */
const DcgProtectedRoute: React.FC<DcgProtectedRouteProps> = ({ children }) => <>{children}</>;

export default DcgProtectedRoute;
