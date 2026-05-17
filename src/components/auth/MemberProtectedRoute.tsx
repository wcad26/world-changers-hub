import React from 'react';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * STICKY PASS-THROUGH GUARD — DO NOT ADD AUTH CHECKS HERE.
 * See mem://constraints/portal-session-guards-must-be-sticky.
 */
export default function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  return <>{children}</>;
}
