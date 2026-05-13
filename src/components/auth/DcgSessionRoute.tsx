import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Guards DCG portal pages. Waits for auth to settle, then redirects to
 * /dcg-auth if there is no signed-in user. Does NOT enforce DCG membership
 * — RLS is the source of truth for data access.
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authReady, user } = useAuth();

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/dcg-auth" replace />;
  }

  return <>{children}</>;
};

export default DcgSessionRoute;
