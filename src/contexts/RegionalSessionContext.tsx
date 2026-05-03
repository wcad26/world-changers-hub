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
  status: 'authorized',
  ready: true,
  authorized: true,
  retry: () => {},
  signOut: async () => {},
};

export const RegionalSessionContext = createContext<RegionalSessionValue>(DEFAULT_REGIONAL_SESSION);

/**
 * Non-blocking regional session provider.
 *
 * - Subscribes to onAuthStateChange first so we never miss the restored session.
 * - Then calls getSession() to seed initial state.
 * - Loads profile + region best-effort whenever the user id changes.
 * - NEVER signs the user out, NEVER redirects, NEVER blocks the UI.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [ready, setReady] = useState(false);
  const queryClient = useQueryClient();

  // Subscribe to auth state and seed initial session.
  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
      setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined } : null);
      setReady(true);
      console.info('[RegionalSession] initial session:', u ? u.id : 'none');
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load profile + region when the user changes.
  const lastLoadedUserRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) {
      lastLoadedUserRef.current = null;
      setProfile(null);
      setRegion(null);
      return;
    }
    if (lastLoadedUserRef.current === user.id) return;
    lastLoadedUserRef.current = user.id;

    let cancelled = false;
    (async () => {
      try {
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profileErr) console.warn('[RegionalSession] profile load error:', profileErr.message);
        if (profileRow) {
          setProfile(profileRow);
          console.info('[RegionalSession] profile loaded, region_id:', profileRow.region_id);
        }

        if (profileRow?.region_id) {
          const { data: regionRow, error: regionErr } = await supabase
            .from('regions')
            .select('*')
            .eq('id', profileRow.region_id)
            .maybeSingle();
          if (cancelled) return;
          if (regionErr) console.warn('[RegionalSession] region load error:', regionErr.message);
          if (regionRow) {
            setRegion(regionRow);
            console.info('[RegionalSession] region loaded:', regionRow.name);
          }
        } else {
          console.warn('[RegionalSession] user has no region_id on profile');
        }
      } catch (err) {
        console.warn('[RegionalSession] best-effort load failed (non-blocking):', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signOut = async () => {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {}
    setUser(null);
    setProfile(null);
    setRegion(null);
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
    status: 'authorized',
    ready,
    authorized: true,
    retry: () => {
      lastLoadedUserRef.current = null;
      if (user?.id) setUser({ ...user });
    },
    signOut,
  };

  return (
    <RegionalSessionContext.Provider value={value}>
      {children}
    </RegionalSessionContext.Provider>
  );
};

export const useRegionalSession = (): RegionalSessionValue => useContext(RegionalSessionContext);
