import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];

export type RegionalSessionStatus = 'checking' | 'authorized' | 'unauthorized' | 'error';

interface RegionalSessionValue {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  region: Region | null;
  status: RegionalSessionStatus;
  ready: boolean;
  authorized: boolean;
  retry: () => void;
  signOut: () => Promise<void>;
}

export const RegionalSessionContext = createContext<RegionalSessionValue | null>(null);

/**
 * Self-contained session reader for the Regional portal.
 *
 * NON-DESTRUCTIVE by design:
 *  - No `onAuthStateChange` subscription (cross-portal SIGNED_OUT events
 *    used to silently flip this provider to `unauthorized`).
 *  - No sessionStorage-based "signing out" marker.
 *  - No automatic boot-time signOut.
 *  - A transient null session or profile read failure shows an error/retry
 *    panel — it never destroys the session or redirects to login by itself.
 *
 *  Only an explicit `signOut()` call from the regional portal UI itself
 *  clears the session.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<RegionalSessionStatus>('checking');
  const [ready, setReady] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const bootedForUser = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const loadProfileAndRegion = async (userId: string) => {
    try {
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[RegionalSession] profile fetch error:', profileError);
        setStatus('error');
        return;
      }

      setProfile(profileRow ?? null);

      if (!profileRow?.region_id) {
        console.warn('[RegionalSession] user has no region_id on profile');
        // Treat as a recoverable error (NOT unauthorized) so we don't bounce
        // a freshly-logged-in user to the login page on a transient read.
        setStatus('error');
        return;
      }

      const { data: regionRow, error: regionError } = await supabase
        .from('regions')
        .select('*')
        .eq('id', profileRow.region_id)
        .maybeSingle();

      if (regionError) {
        console.error('[RegionalSession] region fetch error:', regionError);
        // Keep the user authorized — a transient regions read error must not log them out.
        setStatus('authorized');
        return;
      }

      if (regionRow) setRegion(regionRow);
      setStatus('authorized');
    } catch (err) {
      console.error('[RegionalSession] load error:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        console.info('[RegionalSession] boot start');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;

        if (sessionError) {
          console.error('[RegionalSession] getSession error:', sessionError);
          setStatus('error');
          return;
        }

        if (!session?.user) {
          console.info('[RegionalSession] boot: no session');
          setStatus('unauthorized');
          return;
        }

        console.info('[RegionalSession] boot: session present', session.user.id);
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        bootedForUser.current = session.user.id;
        await loadProfileAndRegion(session.user.id);
      } catch (err) {
        console.error('[RegionalSession] boot error:', err);
        if (!cancelled) setStatus('error');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  const retry = () => {
    setStatus('checking');
    setReady(false);
    bootedForUser.current = null;
    setRetryTick((n) => n + 1);
  };

  const signOut = async () => {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch (err) {
      console.warn('[RegionalSession] queryClient cleanup failed:', err);
    }

    setUser(null);
    setProfile(null);
    setRegion(null);
    bootedForUser.current = null;
    setStatus('unauthorized');
    setReady(true);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    }
  };

  const value: RegionalSessionValue = {
    user,
    profile,
    region,
    status,
    ready,
    authorized: status === 'authorized' || (!!user && !!profile?.region_id),
    retry,
    signOut,
  };

  return (
    <RegionalSessionContext.Provider value={value}>
      {children}
    </RegionalSessionContext.Provider>
  );
};

export const useRegionalSession = (): RegionalSessionValue => {
  const ctx = useContext(RegionalSessionContext);
  if (!ctx) {
    if (typeof console !== 'undefined') {
      console.warn('[RegionalSession] consumed outside provider — returning safe stub');
    }
    return {
      user: null,
      profile: null,
      region: null,
      status: 'checking',
      ready: false,
      authorized: false,
      retry: () => {},
      signOut: async () => {},
    };
  }
  return ctx;
};
