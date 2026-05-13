import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext';
import { RegionalSessionContext } from '@/contexts/RegionalSessionContext';

/**
 * Single source of truth for accessing auth state.
 *
 * Note: this file is intentionally `.ts` (not `.tsx`) and exports only the
 * `useAuth` hook so Vite Fast Refresh skips it cleanly instead of issuing
 * "Could not Fast Refresh" invalidations that previously left consumers
 * reading a stale AuthContext.
 *
 * Regional portal isolation:
 *   The regional portal runs WITHOUT the global <AuthProvider>. Many shared
 *   hooks still call useAuth() to read userRegion / user / profile. So:
 *     1. If a global <AuthProvider> exists, use it.
 *     2. Otherwise, if a <RegionalSessionProvider> is present, build a
 *        minimal AuthContextValue from the regional session.
 *     3. Otherwise, return a safe no-op shape.
 */

const NOOP_ASYNC = async () => {};

const buildEmptyValue = (): AuthContextValue => ({
  user: null,
  profile: null,
  userRoles: [],
  userRegion: null,
  userDcg: null,
  memberRecord: null,
  memberId: null,
  userRegionalRoles: [],
  loading: false,
  initialized: true,
  authReady: true,
  hasRole: () => false,
  hasAnyRole: () => false,
  hasRegionalPortalAccess: false,
  getAvailablePortals: () => [],
  canAccessPortal: () => false,
  hasRegionalPermission: () => true,
  isSuperAdmin: () => false,
  isRegionalAdmin: () => false,
  isMember: () => false,
  isDcgAdmin: () => false,
  isDcgMember: false,
  signOut: NOOP_ASYNC,
  refetchUserData: () => null,
});

export const useAuth = (): AuthContextValue => {
  const globalCtx = useContext(AuthContext);
  if (globalCtx) return globalCtx;

  const regional = useContext(RegionalSessionContext);
  const value = buildEmptyValue();

  if (regional) {
    const stillChecking = !regional.ready || regional.status === 'checking';
    value.user = regional.user as any;
    value.profile = regional.profile as any;
    value.userRegion = regional.region as any;
    value.loading = stillChecking;
    value.initialized = !stillChecking;
    value.authReady = !stillChecking;
    value.hasRegionalPortalAccess = !!regional.authorized;
    value.signOut = regional.signOut;
  }

  return value;
};
