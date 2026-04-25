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
  /** True only after the very first session check has finished. */
  ready: boolean;
  /** True if a Supabase session exists AND profile.region_id is set. */
  authorized: boolean;
  /** Manual retry helper for recoverable errors. */
  retry: () => void;
  signOut: () => Promise<void>;
}

export const RegionalSessionContext = createContext<RegionalSessionValue | null>(null);

/**
 * Self-contained session provider for the Regional portal.
 *
 * IMPORTANT: This provider is mounted ONCE for the whole regional portal at
 * the App level. It never remounts during navigation between regional pages,
 * so route changes never re-run the session boot sequence. Token refreshes
 * only update the user reference — they do NOT re-fetch profile/region.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<RegionalSessionStatus>('checking');
  const [ready, setReady] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const bootedForUser = useRef<string | null>(null);
  const signingOutRef = useRef(false);
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
        // Recoverable — do NOT log the user out.
        setStatus('error');
        return;
      }

      setProfile(profileRow ?? null);

      if (!profileRow?.region_id) {
        console.warn('[RegionalSession] user has no region_id on profile');
        setStatus('unauthorized');
        return;
      }

      const { data: regionRow, error: regionError } = await supabase
        .from('regions')
        .select('*')
        .eq('id', profileRow.region_id)
        .maybeSingle();

      if (regionError) {
        console.error('[RegionalSession] region fetch error:', regionError);
        // Keep user authorized — a transient regions read error must not log them out.
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

    // Initial boot
    (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;

        if (sessionError) {
          console.error('[RegionalSession] getSession error:', sessionError);
        }

        if (!session?.user) {
          setStatus('unauthorized');
          return;
        }

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

    // Auth subscription — kept minimal to avoid remount loops.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setRegion(null);
        bootedForUser.current = null;
        setStatus('unauthorized');
        setReady(true);
        return;
      }

      if (!session?.user) {
        // Other events without a session — ignore, do not flip state.
        return;
      }

      // Token refresh / user update — just refresh the user reference, do NOT
      // re-fetch profile/region. This is what was causing periodic reloads.
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        return;
      }

      // SIGNED_IN for a new user identity — boot once for them.
      if (event === 'SIGNED_IN' && bootedForUser.current !== session.user.id) {
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        bootedForUser.current = session.user.id;
        // Defer to avoid awaiting inside the listener (Supabase guidance).
        setTimeout(() => {
          if (!cancelled) loadProfileAndRegion(session.user.id);
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // retryTick intentionally re-runs the boot path when the user clicks retry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  const retry = () => {
    setStatus('checking');
    setReady(false);
    bootedForUser.current = null;
    setRetryTick((n) => n + 1);
  };

  const signOut = async () => {
    // Mark as signing out so the auth listener doesn't try to do anything
    // exotic. We clear local state synchronously, cancel any in-flight queries,
    // then call Supabase. This guarantees the regional UI is fully unwound
    // before /auth/regional mounts, which prevents the brief "blank" frame.
    signingOutRef.current = true;
    try {
      // Stop any active queries so child pages can't try to render with stale
      // data while the auth state is changing.
      queryClient.cancelQueries();
      queryClient.clear();
    } catch (err) {
      console.warn('[RegionalSession] queryClient cleanup failed:', err);
    }

    // Optimistically clear local state and flip to unauthorized so the guard
    // renders <Navigate to="/auth/regional" /> on the very next commit.
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
    } finally {
      signingOutRef.current = false;
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
    throw new Error('useRegionalSession must be used within a <RegionalSessionProvider>');
  }
  return ctx;
};
