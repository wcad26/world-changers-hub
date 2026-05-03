import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  status: 'authorized',
  ready: true,
  authorized: true,
  retry: () => {},
  signOut: async () => {},
};

export const RegionalSessionContext = createContext<RegionalSessionValue>(DEFAULT_REGIONAL_SESSION);

/**
 * Regional portal session.
 *
 * Boot rules:
 *   - Read the supabase session ONCE and immediately expose the user.
 *   - Then, in the background, resolve profile + region with a fallback chain:
 *       1) profile.region_id
 *       2) members.region_id (any membership row)
 *       3) leave region null and let the page show a non-blocking notice
 *   - Mark `ready` true as soon as we know whether a session exists. Never
 *     wait on profile/region — those load in the background.
 *   - NEVER auto-signOut. NEVER redirect.
 *   - Ignore transient null sessions from onAuthStateChange unless the
 *     provider itself initiated the sign-out.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  const signingOutRef = useRef(false);
  const loadedForUserRef = useRef<string | null>(null);

  const loadProfileAndRegion = useCallback(async (uid: string) => {
    if (loadedForUserRef.current === uid) return;
    loadedForUserRef.current = uid;

    try {
      // 1) profile
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (profErr) console.warn('[RegionalSession] profile load error:', profErr.message);
      if (prof) setProfile(prof as Profile);

      // 2) region from profile.region_id
      let regionId: string | null = (prof as any)?.region_id ?? null;

      // 3) fallback: membership region
      if (!regionId) {
        const { data: mem } = await supabase
          .from('members')
          .select('region_id')
          .eq('profile_id', uid)
          .not('region_id', 'is', null)
          .limit(1)
          .maybeSingle();
        if ((mem as any)?.region_id) regionId = (mem as any).region_id;
      }

      if (regionId) {
        const { data: reg, error: regErr } = await supabase
          .from('regions')
          .select('*')
          .eq('id', regionId)
          .maybeSingle();
        if (regErr) console.warn('[RegionalSession] region load error:', regErr.message);
        if (reg) setRegion(reg as Region);
      } else {
        console.info('[RegionalSession] no region resolved for user', uid);
      }
    } catch (err) {
      console.warn('[RegionalSession] background load failed:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      const u = session?.user;

      if (!u) {
        if (signingOutRef.current || event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRegion(null);
          loadedForUserRef.current = null;
        }
        return;
      }

      setUser({ id: u.id, email: u.email ?? undefined });
      void loadProfileAndRegion(u.id);
    });

    (async () => {
      // One short poll to absorb localStorage hydration race.
      let session: any = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 80));
      }
      if (cancelled) return;

      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? undefined });
        void loadProfileAndRegion(u.id);
      }
      setReady(true);
      console.info('[RegionalSession] ready. user =', u?.id ?? 'none');
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadProfileAndRegion]);

  const retry = useCallback(() => {
    if (user?.id) {
      loadedForUserRef.current = null;
      void loadProfileAndRegion(user.id);
    }
  }, [user?.id, loadProfileAndRegion]);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {}
    setUser(null);
    setProfile(null);
    setRegion(null);
    loadedForUserRef.current = null;
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    } finally {
      setTimeout(() => {
        signingOutRef.current = false;
      }, 500);
    }
  }, [queryClient]);

  const value: RegionalSessionValue = {
    user,
    profile,
    region,
    status: 'authorized',
    ready,
    authorized: true,
    retry,
    signOut,
  };

  return (
    <RegionalSessionContext.Provider value={value}>
      {children}
    </RegionalSessionContext.Provider>
  );
};

export const useRegionalSession = (): RegionalSessionValue => useContext(RegionalSessionContext);
