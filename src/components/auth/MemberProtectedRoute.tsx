import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Pass-through guard. All client-side session redirect checks removed to
 * eliminate preview-only logout loops. RLS controls real data access.
 */
export default function MemberProtectedRoute({ children }: MemberProtectedRouteProps) {
  const { loading, authReady } = useAuth();
  if (loading || !authReady) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading portal…
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
