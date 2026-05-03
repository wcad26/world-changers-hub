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
 * All client-side access checks are disabled. This provider only loads
 * profile/region data best-effort for data scoping. It NEVER blocks the UI
 * and NEVER signs the user out implicitly.
 */
export const RegionalSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RegionalSessionValue['user']>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const bootedRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (cancelled || !session?.user) return;

        setUser({ id: session.user.id, email: session.user.email ?? undefined });

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (cancelled) return;
        if (profileRow) setProfile(profileRow);

        if (profileRow?.region_id) {
          const { data: regionRow } = await supabase
            .from('regions')
            .select('*')
            .eq('id', profileRow.region_id)
            .maybeSingle();
          if (!cancelled && regionRow) setRegion(regionRow);
        }
      } catch (err) {
        console.warn('[RegionalSession] best-effort load failed (non-blocking):', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
    ready: true,
    authorized: true,
    retry: () => {},
    signOut,
  };

  return (
    <RegionalSessionContext.Provider value={value}>
      {children}
    </RegionalSessionContext.Provider>
  );
};

export const useRegionalSession = (): RegionalSessionValue => useContext(RegionalSessionContext);
