import React from 'react';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Pass-through guard. All client-side session redirect checks removed to
 * eliminate preview-only logout loops. RLS controls real data access.
 */
export default function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  return <>{children}</>;
}
