import React from 'react';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/** Pass-through. All client-side role checks removed. */
export default function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  return <>{children}</>;
}
