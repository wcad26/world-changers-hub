import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { usePortalSession } from '@/hooks/usePortalSession';

/**
 * DCG portal guard. Uses the shared portal session hook so it follows the
 * same conservative rules as every other portal guard:
 *   - "checking" until Supabase session restore resolves
 *   - never redirects on transient null INITIAL_SESSION events
 *   - only redirects on confirmed no-session or SIGNED_OUT
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status } = usePortalSession();

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'anon') return <Navigate to="/dcg-auth" replace />;
  return <>{children}</>;
};

export default DcgSessionRoute;
