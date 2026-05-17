import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePortalSession } from '@/hooks/usePortalSession';

/**
 * Super Admin portal guard. Conservative — never redirects to login during
 * Supabase session restoration. Only after `getSession()` resolves with no
 * session, or after an explicit SIGNED_OUT event.
 */
const SuperAdminSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = usePortalSession();

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'anon') return <Navigate to="/auth/super" replace />;
  return <>{children}</>;
};

export default SuperAdminSessionRoute;
