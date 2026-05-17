import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePortalSession } from '@/hooks/usePortalSession';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Member portal guard. Uses the shared portal session hook — conservative,
 * never redirects on transient null session events during restoration.
 */
export default function MemberProtectedRoute({
  children,
  redirectTo = '/auth/member',
}: MemberProtectedRouteProps) {
  const { status } = usePortalSession();

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'anon') return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
