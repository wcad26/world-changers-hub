import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import {
  clearRegionalBootstrap,
  createRegionStub,
  readRegionalBootstrap,
  writeRegionalBootstrap,
} from '@/lib/regionalBootstrap';
import {
  RegionalSessionContext,
  type RegionalSessionValue,
} from './regionalSessionContextCore';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];

/**
 * Regional portal session.
 *
 * Sticky behavior: once the regional bootstrap exists (or Supabase reports a
 * user), we stay "authorized" until the user explicitly logs out. Transient
 * SIGNED_OUT / null INITIAL_SESSION events in the Lovable dev preview no
 * longer clear state or bounce the user to login.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const queryClient = useQueryClient();

  const signingOutRef = useRef(false);
  const loadedForUserRef = useRef<string | null>(null);
  const userEmailRef = useRef<string | null>(null);

  const loadProfileAndRegion = useCallback(async (uid: string, preferredRegionId?: string | null) => {
    if (signingOutRef.current) return;
    const loadKey = `${uid}:${preferredRegionId ?? 'none'}`;
    if (loadedForUserRef.current === loadKey) return;
    loadedForUserRef.current = loadKey;

    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
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
        writeRegionalBootstrap({ userId: uid, email: userEmailRef.current, regionId });
        setBootstrapAvailable(true);
        setRegion((current) => current?.id === regionId ? current : createRegionStub(regionId));

        const { data: reg } = await supabase
          .from('regions')
          .select('*')
          .eq('id', regionId)
          .maybeSingle();
        if (reg) setRegion(reg as Region);
      }
    } catch (err) {
      if (!signingOutRef.current) console.warn('[RegionalSession] background load failed:', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let authSubscription: { unsubscribe: () => void } | null = null;

    (async () => {
      const bootstrap = readRegionalBootstrap();
      if (bootstrap && !cancelled) {
        setBootstrapAvailable(true);
        userEmailRef.current = bootstrap.email ?? null;
        setUser({ id: bootstrap.userId, email: bootstrap.email ?? undefined });
        setRegion((current) => current?.id === bootstrap.regionId ? current : createRegionStub(bootstrap.regionId));
        void loadProfileAndRegion(bootstrap.userId, bootstrap.regionId);
      }

      const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
        if (cancelled) return;
        if (event === 'SIGNED_OUT') {
          // Ignore unless explicit logout flag was set within 10s.
          let explicit = false;
          try {
            const raw = window.localStorage.getItem('wca-explicit-signout');
            if (raw) {
              window.localStorage.removeItem('wca-explicit-signout');
              const savedAt = Number(raw);
              explicit = Number.isFinite(savedAt) && Date.now() - savedAt < 10000;
            }
          } catch {}
          if (!signingOutRef.current && !explicit) return;
          return;
        }
        const authUser = session?.user;
        if (authUser) {
          userEmailRef.current = authUser.email ?? null;
          setUser({ id: authUser.id, email: authUser.email ?? undefined });
          void loadProfileAndRegion(authUser.id, readRegionalBootstrap()?.regionId ?? null);
        }
      });
      authSubscription = authSub.subscription;

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const u = data.session?.user;
      if (u) {
        userEmailRef.current = u.email ?? null;
        setUser({ id: u.id, email: u.email ?? undefined });
        void loadProfileAndRegion(u.id, bootstrap?.regionId ?? null);
      }
    })();

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
    };
  }, [loadProfileAndRegion]);

  const retry = useCallback(() => {
    const bootstrap = readRegionalBootstrap();
    if (bootstrap) {
      setBootstrapAvailable(true);
      userEmailRef.current = bootstrap.email ?? null;
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
    userEmailRef.current = null;
    setUser(null);
    setProfile(null);
    setRegion(null);
    setBootstrapAvailable(false);
    loadedForUserRef.current = null;
    clearRegionalBootstrap();
    try {
      window.localStorage.setItem('wca-explicit-signout', String(Date.now()));
      window.localStorage.removeItem('wca-auth-last-user');
    } catch {}
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    }
  }, [queryClient]);

  // Sticky: as soon as we have a bootstrap or a user, we are authorized and
  // ready. Never transition back to checking on transient null sessions.
  const ready = !!(user || bootstrapAvailable);
  const authorized = ready;

  const value: RegionalSessionValue = {
    user,
    profile,
    region,
    status: ready ? 'authorized' : 'checking',
    provided: true,
    ready,
    authorized,
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
