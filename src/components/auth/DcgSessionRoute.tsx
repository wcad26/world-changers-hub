import React, { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

/**
 * DCG portal guard.
 *
 * Single source of truth: the parent <AuthProvider> mounted at /dcg.
 * We avoid mounting our own onAuthStateChange listener (which was racing
 * with the provider and bouncing freshly-logged-in users back to /dcg-auth).
 *
 * As a safety net we also poll `supabase.auth.getSession()` once on mount
 * in case the provider hasn't published the restored session yet (hard
 * navigation from /dcg-auth → /dcg/dashboard).
 */
const DcgSessionRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authReady } = useAuth();
  const [fallbackUser, setFallbackUser] = useState<unknown>(undefined); // undefined = unchecked
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    supabase.auth.getSession().then(({ data }) => {
      setFallbackUser(data.session?.user ?? null);
    });
  }, []);

  const hasUser = !!user || !!fallbackUser;
  const stillChecking = !authReady && fallbackUser === undefined;

  if (stillChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasUser) {
    return <Navigate to="/dcg-auth" replace />;
  }

  return <>{children}</>;
};

export default DcgSessionRoute;
