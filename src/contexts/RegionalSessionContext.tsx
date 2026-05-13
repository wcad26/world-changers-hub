import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  clearRegionalBootstrap,
  createRegionStub,
  readRegionalBootstrap,
  writeRegionalBootstrap,
} from '@/lib/regionalBootstrap';

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
  bootstrapAvailable: boolean;
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
  bootstrapAvailable: false,
  retry: () => {},
  signOut: async () => {},
};

export const RegionalSessionContext = createContext<RegionalSessionValue>(DEFAULT_REGIONAL_SESSION);

/**
 * Regional portal session.
 *
 * Regional portal session boot.
 *
 * Critical rule: the UI should never depend on a fragile post-navigation
 * getSession() race to know the user's region. The login page writes a small
 * sessionStorage bootstrap (`userId`, `email`, `regionId`). This provider reads
 * it synchronously, enables regional data queries immediately, and then hydrates
 * richer profile/region details from Supabase in the background.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialBootstrap = useMemo(() => readRegionalBootstrap(), []);
  const [user, setUser] = useState<RegionalSessionValue['user']>(
    initialBootstrap ? { id: initialBootstrap.userId, email: initialBootstrap.email ?? undefined } : null,
  );
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(
    initialBootstrap ? createRegionStub(initialBootstrap.regionId) : null,
  );
  const [ready, setReady] = useState(true);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(!!initialBootstrap);
  const queryClient = useQueryClient();

  const signingOutRef = useRef(false);
  const loadedForUserRef = useRef<string | null>(null);

  const loadProfileAndRegion = useCallback(async (uid: string, preferredRegionId?: string | null) => {
    if (signingOutRef.current) return;
    const loadKey = `${uid}:${preferredRegionId ?? 'none'}`;
    if (loadedForUserRef.current === loadKey) return;
    loadedForUserRef.current = loadKey;

    try {
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (profErr) console.warn('[RegionalSession] profile load error:', profErr.message);
      if (prof) setProfile(prof as Profile);

      let regionId: string | null = preferredRegionId ?? (prof as any)?.region_id ?? null;

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
        writeRegionalBootstrap({ userId: uid, email: user?.email ?? null, regionId });
        setBootstrapAvailable(true);
        setRegion((current) => current?.id === regionId ? current : createRegionStub(regionId));

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
      if (!signingOutRef.current) {
        console.warn('[RegionalSession] background load failed:', err);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const bootstrap = readRegionalBootstrap();
      if (bootstrap && !cancelled) {
        setBootstrapAvailable(true);
        setUser({ id: bootstrap.userId, email: bootstrap.email ?? undefined });
        setRegion((current) => current?.id === bootstrap.regionId ? current : createRegionStub(bootstrap.regionId));
        void loadProfileAndRegion(bootstrap.userId, bootstrap.regionId);
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      const u = data.session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? undefined });
        void loadProfileAndRegion(u.id, bootstrap?.regionId ?? null);
      } else if (!bootstrap) {
        console.info('[RegionalSession] no Supabase session and no regional bootstrap');
      }
      console.info('[RegionalSession] ready. user =', u?.id ?? bootstrap?.userId ?? 'none', 'bootstrap =', !!bootstrap);
    })();

    return () => {
      cancelled = true;
    };
  }, [loadProfileAndRegion]);

  const retry = useCallback(() => {
    const bootstrap = readRegionalBootstrap();
    if (bootstrap) {
      setBootstrapAvailable(true);
      setUser({ id: bootstrap.userId, email: bootstrap.email ?? undefined });
      setRegion((current) => current?.id === bootstrap.regionId ? current : createRegionStub(bootstrap.regionId));
      loadedForUserRef.current = null;
      void loadProfileAndRegion(bootstrap.userId, bootstrap.regionId);
      return;
    }

    if (user?.id) {
      loadedForUserRef.current = null;
      void loadProfileAndRegion(user.id, region?.id ?? null);
    }
  }, [user?.id, region?.id, loadProfileAndRegion]);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {}
    setUser(null);
    setProfile(null);
    setRegion(null);
    setBootstrapAvailable(false);
    loadedForUserRef.current = null;
    clearRegionalBootstrap();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.replace('/auth/regional');
      }
    }
  }, [queryClient]);

  const value: RegionalSessionValue = {
    user,
    profile,
    region,
    status: 'authorized',
    ready,
    authorized: true,
    bootstrapAvailable,
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
