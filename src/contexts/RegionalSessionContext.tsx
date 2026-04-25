import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];

interface RegionalSessionValue {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  region: Region | null;
  /** True only after the very first session check has finished. */
  ready: boolean;
  /** True if a Supabase session exists AND profile.region_id is set. */
  authorized: boolean;
  signOut: () => Promise<void>;
}

// Exported so `useAuth()` (in src/hooks/useAuth.tsx) can transparently fall
// back to the regional session when no global <AuthProvider> is present.
export const RegionalSessionContext = createContext<RegionalSessionValue | null>(null);

/**
 * Self-contained session provider for the Regional portal.
 *
 * On mount it runs ONE pass:
 *   1. supabase.auth.getSession()
 *   2. If there is a user, SELECT profile (and the region row).
 *   3. Mark ready=true; authorized = (session exists AND profile.region_id is set).
 *
 * It deliberately does NOT:
 *   - read user_roles / regional_user_roles / dcgs / members
 *   - listen to onAuthStateChange (no surprise re-fetches, no HMR remounts)
 *   - sign the user out automatically on errors
 *
 * Errors during profile/region fetches are logged but DO NOT change `authorized`
 * unilaterally — we still consider the user authorized as long as the session
 * + region_id check actually succeeded. A failed `regions` fetch (e.g. transient
 * network hiccup) will not bounce a real user back to the login page.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (cancelled) return;

        if (sessionError) {
          console.error('[RegionalSession] getSession error:', sessionError);
        }

        if (!session?.user) {
          console.info('[RegionalSession] no active session');
          setReady(true);
          return;
        }

        setUser({ id: session.user.id, email: session.user.email ?? undefined });

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          console.error('[RegionalSession] profile fetch error:', profileError);
        }

        setProfile(profileRow ?? null);

        if (!profileRow?.region_id) {
          console.warn('[RegionalSession] user has no region_id on profile');
        } else {
          const { data: regionRow, error: regionError } = await supabase
            .from('regions')
            .select('*')
            .eq('id', profileRow.region_id)
            .maybeSingle();

          if (cancelled) return;

          if (regionError) {
            console.error('[RegionalSession] region fetch error:', regionError);
          }

          if (regionRow) setRegion(regionRow);
        }
      } catch (err) {
        console.error('[RegionalSession] unexpected error during boot:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    }
    // Hard redirect — guarantees no stale React state survives.
    window.location.replace('/auth/regional');
  };

  const value: RegionalSessionValue = {
    user,
    profile,
    region,
    ready,
    authorized: !!user && !!profile?.region_id,
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
