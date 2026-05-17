import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PortalLoading = () => (
  <div className="min-h-svh flex items-center justify-center bg-background text-foreground">
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      Loading portal…
    </div>
  </div>
);

/**
 * Pass-through guard. All client-side session redirect checks removed —
 * they were bouncing freshly logged-in users back to /dcg-auth in the
 * Lovable development preview. RLS is the source of truth for data access,
 * and pages already render their own loading states.
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, authReady } = useAuth();
  if (loading || !authReady) return <PortalLoading />;
  return <>{children}</>;
};

export default DcgSessionRoute;
