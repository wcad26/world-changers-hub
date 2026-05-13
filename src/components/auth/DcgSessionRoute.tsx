import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

/**
 * Guards DCG portal pages.
 *
 * - Waits for the portal AuthProvider to finish initializing.
 * - If there is no Supabase user → redirect to /dcg-auth.
 * - If the user is signed in but has no resolved DCG context → show a
 *   clear "no DCG assigned" screen instead of a blank page or silent
 *   logout.
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authReady, loading, user, userDcg, signOut } = useAuth();

  if (!authReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/dcg-auth" replace />;
  }

  if (!userDcg) {
    const handleSignOut = async () => {
      try {
        await signOut();
      } finally {
        window.location.assign('/dcg-auth');
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">No DCG assigned</h1>
          <p className="text-muted-foreground">
            Your account is signed in, but it isn't linked to a DCG yet. Ask your
            regional admin to assign you to a DCG, then sign in again.
          </p>
          <Button onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DcgSessionRoute;
