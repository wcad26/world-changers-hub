import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemberProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Member portal guard — Supabase-session-only.
 * Redirects to /auth/member if there is no signed-in user. No role checks.
 */
export default function MemberProtectedRoute({
  children,
  redirectTo = '/auth/member',
}: MemberProtectedRouteProps) {
  const [status, setStatus] = useState<'checking' | 'authed' | 'anon'>('checking');

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setStatus(data.session?.user ? 'authed' : 'anon');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session?.user) setStatus('authed');
      else if (event === 'SIGNED_OUT') setStatus('anon');
    });
    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

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
