import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext';
import { RegionalSessionContext } from '@/contexts/RegionalSessionContext';

/**
 * Single source of truth for accessing auth state.
 *
 * IMPORTANT — regional portal isolation:
 *   The regional portal intentionally runs WITHOUT the global <AuthProvider>.
 *   Many shared hooks (useEvents, useFinancials, useMemberTargets, etc.)
 *   still call useAuth() to read `userRegion`, `user` and `profile`.
 *
 *   To keep those hooks working inside the regional portal without a global
 *   AuthProvider, this hook does the following:
 *     1. If a global <AuthProvider> exists, use it as before.
 *     2. Otherwise, if a <RegionalSessionProvider> is present, build a
 *        minimal AuthContextValue from the regional session so consumers
 *        get a real `user`, `profile`, and `userRegion`.
 *     3. Otherwise (e.g. on the public regional login pages), return a
 *        safe no-op shape so nothing throws.
 *
 *   This keeps Super Admin, DCG, and Member portals 100% unchanged while
 *   making the regional portal independent of the global auth boot path.
 */

const NOOP = () => {};
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
  hasRegionalPermission: () => true, // regional portal no longer permission-gated
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

  // Regional portal fallback — derive a minimal AuthContext shape from the
  // RegionalSessionProvider so legacy hooks keep working.
  const regional = useContext(RegionalSessionContext);
  const value = buildEmptyValue();

  if (regional) {
    value.user = regional.user as any;
    value.profile = regional.profile as any;
    value.userRegion = regional.region as any;
    value.loading = !regional.ready;
    value.initialized = regional.ready;
    value.authReady = regional.ready;
    value.hasRegionalPortalAccess = !!regional.authorized;
    value.signOut = regional.signOut;
  }

  return value;
};
