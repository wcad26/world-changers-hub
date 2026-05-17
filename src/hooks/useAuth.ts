import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/AuthContext';
import { RegionalSessionContext } from '@/contexts/regionalSessionContextCore';

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

/**
 * Single source of truth for accessing auth state.
 *
 * Precedence:
 *   1. Global AuthProvider is the primary source.
 *   2. Regional session, when present, overlays the regional fields (user,
 *      region, profile, signOut) so the regional portal continues to work
 *      with its bootstrap-based session. We never replace a valid global
 *      user with a null regional user — that was bouncing freshly logged-in
 *      users back to /auth/regional during preview hot reloads.
 */
export const useAuth = (): AuthContextValue => {
  const globalCtx = useContext(AuthContext);
  const regional = useContext(RegionalSessionContext);
  const hasRegional = !!regional?.provided;

  const base = globalCtx ?? buildEmptyValue();

  if (!hasRegional) return base;

  // Overlay regional data only when it has something useful.
  return {
    ...base,
    user: regional.user ?? base.user,
    profile: regional.profile ?? base.profile,
    userRegion: regional.region ?? base.userRegion,
    loading: false,
    initialized: true,
    authReady: true,
    hasRegionalPortalAccess: regional.authorized || base.hasRegionalPortalAccess,
    signOut: regional.signOut ?? base.signOut,
  };
};
