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
 * Deterministic, non-destructive regional session bootstrap.
 *
 * Boot order:
 *   1) Wait for getSession() to settle (poll briefly so we never race
 *      Supabase's localStorage hydration on first paint).
 *   2) If a session exists, call get_my_regional_context() exactly once
 *      to load profile + region in a single SECURITY DEFINER call. This
 *      avoids a chain of RLS-gated reads during portal startup.
 *   3) Set ready=true. Never block the UI past this point.
 *
 * Hard rules:
 *   - NEVER auto-signOut on missing data.
 *   - NEVER redirect.
 *   - Ignore transient null sessions from onAuthStateChange unless the
 *     user explicitly logged out from this provider (signingOutRef).
 *   - TOKEN_REFRESHED / SIGNED_IN events refresh user but never blank
 *     the portal.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  const signingOutRef = useRef(false);
  const bootstrappedForUserRef = useRef<string | null>(null);

  const loadContext = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase.rpc('get_my_regional_context');
      if (error) {
        console.warn('[RegionalSession] bootstrap RPC error (non-fatal):', error.message);
        return;
      }
      const payload: any = data ?? {};
      if (payload.profile) setProfile(payload.profile as Profile);
      if (payload.region) setRegion(payload.region as Region);
      bootstrappedForUserRef.current = uid;
      console.info('[RegionalSession] bootstrap ok. region =', payload.region?.name ?? '(none)');
    } catch (err) {
      console.warn('[RegionalSession] bootstrap threw (non-fatal):', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      const u = session?.user;

      // Only clear local user state when WE initiated the sign-out.
      if (!u) {
        if (signingOutRef.current || event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setRegion(null);
          bootstrappedForUserRef.current = null;
        }
        // Otherwise: ignore transient null sessions to avoid blanking
        // the portal during token refresh races.
        return;
      }

      setUser({ id: u.id, email: u.email ?? undefined });
      if (bootstrappedForUserRef.current !== u.id) {
        loadContext(u.id);
      }
    });

    (async () => {
      // Poll briefly for session restoration from localStorage.
      let session = null as Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];
      for (let i = 0; i < 12; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      if (cancelled) return;

      const u = session?.user;
      if (u) {
        setUser({ id: u.id, email: u.email ?? undefined });
        await loadContext(u.id);
      }
      setReady(true);
      console.info('[RegionalSession] ready. user =', u?.id ?? 'none');
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadContext]);

  const retry = useCallback(() => {
    if (user?.id) {
      bootstrappedForUserRef.current = null;
      loadContext(user.id);
    }
  }, [user?.id, loadContext]);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {}
    setUser(null);
    setProfile(null);
    setRegion(null);
    bootstrappedForUserRef.current = null;
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[RegionalSession] signOut error:', err);
    } finally {
      // Allow the auth listener to clear state again on the SIGNED_OUT event.
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
