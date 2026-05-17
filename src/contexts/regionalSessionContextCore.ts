import { createContext, useContext } from 'react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];

export type RegionalSessionStatus = 'checking' | 'authorized' | 'unauthorized' | 'error';

export interface RegionalSessionValue {
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  region: Region | null;
  status: RegionalSessionStatus;
  provided: boolean;
  ready: boolean;
  authorized: boolean;
  bootstrapAvailable: boolean;
  retry: () => void;
  signOut: () => Promise<void>;
}

export const DEFAULT_REGIONAL_SESSION: RegionalSessionValue = {
  user: null,
  profile: null,
  region: null,
  status: 'checking',
  provided: false,
  ready: false,
  authorized: false,
  bootstrapAvailable: false,
  retry: () => {},
  signOut: async () => {},
};

/**
 * Pure context + hook. Kept in a .ts file with no React component exports so
 * Vite Fast Refresh does not invalidate every consumer on edit — that
 * invalidation was remounting the entire route tree in the dev preview and
 * producing the "blank screen → redirect to login" loop after sign-in.
 */
export const RegionalSessionContext = createContext<RegionalSessionValue>(DEFAULT_REGIONAL_SESSION);

export const useRegionalSession = (): RegionalSessionValue => useContext(RegionalSessionContext);
