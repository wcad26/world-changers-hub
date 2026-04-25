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
 * It does ONE thing on mount:
 *   1. supabase.auth.getSession()
 *   2. If there is a user, SELECT profile.region_id (and the region row).
 *   3. Mark ready=true, authorized = (profile.region_id is set).
 *
 * It deliberately does NOT:
 *   - read user_roles / regional_user_roles / dcgs / members
 *   - listen to onAuthStateChange (no surprise re-fetches, no HMR remounts)
 *   - know about super-admin, dcg, member portals
 *
 * Logging out is a hard navigation to /auth/regional so absolutely no
 * stale provider state can re-enter the portal.
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
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!session?.user) {
          setReady(true);
          return;
        }

        setUser({ id: session.user.id, email: session.user.email ?? undefined });

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (cancelled) return;
        setProfile(profileRow ?? null);

        if (profileRow?.region_id) {
          const { data: regionRow } = await supabase
            .from('regions')
            .select('*')
            .eq('id', profileRow.region_id)
            .maybeSingle();
          if (!cancelled && regionRow) setRegion(regionRow);
        }
      } catch {
        // Swallow — the guard will redirect to /auth/regional if needed.
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
    } catch {
      /* ignore */
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
