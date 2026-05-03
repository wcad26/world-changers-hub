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

const DEFAULT_REGIONAL_SESSION: RegionalSessionValue = {
  user: null,
  profile: null,
  region: null,
  status: 'checking',
  ready: false,
  authorized: false,
  retry: () => {},
  signOut: async () => {},
};

export const RegionalSessionContext = createContext<RegionalSessionValue>(DEFAULT_REGIONAL_SESSION);

/**
 * Wait for Supabase to restore a session from storage.
 * Returns the session as soon as it appears, or null after the retry window.
 */
const waitForSession = async (maxAttempts = 8, delayMs = 150) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
};

export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<RegionalSessionStatus>('checking');
  const [ready, setReady] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const explicitSignOutRef = useRef(false);
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
      console.info('[RegionalSession] profile loaded');

      if (!profileRow?.region_id) {
        console.warn('[RegionalSession] user has no region_id on profile');
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
        setStatus('authorized');
        return;
      }

      if (regionRow) setRegion(regionRow);
      console.info('[RegionalSession] region loaded');
      setStatus('authorized');
      console.info('[RegionalSession] authorized');
    } catch (err) {
      console.error('[RegionalSession] load error:', err);
      setStatus('error');
    }
  };

  useEffect(() => {
    let cancelled = false;
    console.info('[RegionalSession] provider mounted');

    (async () => {
      try {
        console.info('[RegionalSession] waiting for session');
        const session = await waitForSession();
        if (cancelled) return;

        if (!session?.user) {
          console.info('[RegionalSession] no session after retry window');
          setStatus('unauthorized');
          return;
        }

        console.info('[RegionalSession] session restored', session.user.id);
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        await loadProfileAndRegion(session.user.id);
      } catch (err) {
        console.error('[RegionalSession] boot error:', err);
        if (!cancelled) setStatus('error');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    // Non-destructive listener: only react to explicit regional sign-out and
    // to fresh sign-ins / token refreshes. Cross-portal SIGNED_OUT events
    // never flip this provider unless the user actually clicked logout here.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? undefined });
        }
      } else if (event === 'SIGNED_OUT') {
        if (explicitSignOutRef.current) {
          explicitSignOutRef.current = false;
          setUser(null);
          setProfile(null);
          setRegion(null);
          setStatus('unauthorized');
          setReady(true);
        }
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  const retry = () => {
    setStatus('checking');
    setReady(false);
    setRetryTick((n) => n + 1);
  };

  const signOut = async () => {
    explicitSignOutRef.current = true;
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch (err) {
      console.warn('[RegionalSession] queryClient cleanup failed:', err);
    }

    setUser(null);
    setProfile(null);
    setRegion(null);
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
    authorized: status === 'authorized',
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
  if (ctx === DEFAULT_REGIONAL_SESSION && import.meta.env.DEV) {
    console.warn('[RegionalSession] consumed outside RegionalSessionProvider — using default checking state');
  }
  return ctx;
};
