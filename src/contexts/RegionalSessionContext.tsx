import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  signOut: () => Promise<void>;
}

export const RegionalSessionContext = createContext<RegionalSessionValue | null>(null);

/**
 * Self-contained session provider for the Regional portal.
 *
 * Behavior:
 *  - Boots once: getSession -> profile -> region.
 *  - Subscribes to auth state changes safely:
 *      • SIGNED_OUT: clears state and marks unauthorized.
 *      • TOKEN_REFRESHED / USER_UPDATED: updates the user reference only,
 *        does NOT re-fetch profile/region (no UI churn, no remount loops).
 *      • SIGNED_IN with a different user: re-runs the boot sequence.
 *  - Never auto-signs the user out. Transient profile/region fetch errors
 *    surface as `status === 'error'` but the session is preserved.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [status, setStatus] = useState<RegionalSessionStatus>('checking');
  const [ready, setReady] = useState(false);
  const bootedForUser = useRef<string | null>(null);

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

      if (event === 'SIGNED_OUT' || !session?.user) {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRegion(null);
          bootedForUser.current = null;
          setStatus('unauthorized');
          setReady(true);
        }
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
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    }
    window.location.replace('/auth/regional');
  };

  const value: RegionalSessionValue = {
    user,
    profile,
    region,
    status,
    ready,
    authorized: status === 'authorized' || (!!user && !!profile?.region_id),
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
