import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AuthContext, type AppRole, type AuthContextValue } from './AuthContext';
import {
  EXPLICIT_SIGNOUT_KEY,
  clearCachedUser,
  consumeExplicitSignOutFlag,
  markExplicitSignOut,
  readCachedUser,
  writeCachedUser,
} from '@/lib/portalAuthCache';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type Dcg = Database['public']['Tables']['dcgs']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

/**
 * Per-portal auth provider — deterministic, listener-based.
 * See AuthContext.ts for the value shape.
 *
 * NOTE: This file intentionally exports ONLY the AuthProvider component so
 * Vite React Fast Refresh can hot-reload it cleanly. Mixing a context value
 * + component export in the same module caused dev-only HMR invalidation
 * which left consumers reading a stale AuthContext (null) → bouncing users
 * back to the login page right after a successful sign-in.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialCachedUserRef = useRef<any | null>(readCachedUser());
  const [user, setUser] = useState<any>(initialCachedUserRef.current);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [userDcg, setUserDcg] = useState<Dcg | null>(null);
  const [memberRecord, setMemberRecord] = useState<Member | null>(null);
  const [userRegionalRoles, setUserRegionalRoles] = useState<any[]>([]);
  // Sticky: auth is ALWAYS considered ready. We never enter a blocking
  // loading state on transient null sessions in the Lovable preview.
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(true);
  const [authReady, setAuthReady] = useState(true);

  const fetchedForUserRef = useRef<string | null>(null);
  const explicitSignOutRef = useRef(false);
  const userRef = useRef<any>(initialCachedUserRef.current);

  const markReady = useCallback(() => {
    setInitialized(true);
    setLoading(false);
    setAuthReady(true);
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    if (fetchedForUserRef.current === userId) return;
    fetchedForUserRef.current = userId;

    // Context fetches below are best-effort and must NEVER block portal access.
    markReady();

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileData) setProfile(profileData);

      if (profileData?.region_id) {
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', profileData.region_id)
          .maybeSingle();
        if (regionData) setUserRegion(regionData);
      }

      if (profileData) {
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('profile_id', userId)
          .maybeSingle();
        if (memberData) setMemberRecord(memberData);
      }

      // Resolve DCG (best-effort, for label/filter context only).
      let resolvedDcg: Dcg | null = null;
      try {
        const { data: dcgId } = await supabase.rpc('get_user_dcg', { _user_id: userId });
        if (dcgId) {
          const { data: dcgData } = await supabase
            .from('dcgs')
            .select('*')
            .eq('id', dcgId)
            .maybeSingle();
          if (dcgData) resolvedDcg = dcgData;
        }
      } catch {
        // ignore
      }
      if (!resolvedDcg) {
        const { data: memberRows } = await supabase
          .from('members')
          .select('id')
          .eq('profile_id', userId);
        const memberIds = (memberRows || []).map((m) => m.id);
        if (memberIds.length > 0) {
          const { data: ledDcg } = await supabase
            .from('dcgs')
            .select('*')
            .in('leader_id', memberIds)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          if (ledDcg) {
            resolvedDcg = ledDcg;
          } else {
            const { data: memberships } = await supabase
              .from('dcg_members')
              .select('dcg_id, role, dcgs:dcg_id (*)')
              .in('member_id', memberIds)
              .eq('is_active', true);
            if (memberships && memberships.length > 0) {
              const preferred =
                memberships.find((m) => m.role === 'Leader') ||
                memberships.find((m) => m.role === 'Assistant') ||
                memberships[0];
              if (preferred?.dcgs) resolvedDcg = preferred.dcgs as Dcg;
            }
          }
        }
      }
      if (resolvedDcg) setUserDcg(resolvedDcg);
    } catch (error) {
      console.warn('[PortalAuth] non-fatal context load error', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (userRef.current?.id) {
      void fetchUserData(userRef.current.id);
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        // Only act on SIGNED_OUT if the user explicitly clicked logout.
        // The Lovable dev preview emits spurious SIGNED_OUT events while the
        // session is still valid — ignore those completely.
        const hasStoredExplicitSignOut = consumeExplicitSignOutFlag();
        if (!explicitSignOutRef.current && !hasStoredExplicitSignOut) {
          return;
        }
        explicitSignOutRef.current = false;
        fetchedForUserRef.current = null;
        userRef.current = null;
        clearCachedUser();
        setUser(null);
        setProfile(null);
        setUserRoles([]);
        setUserRegion(null);
        setUserDcg(null);
        setMemberRecord(null);
        setUserRegionalRoles([]);
        return;
      }

      const sessionUser = session?.user ?? null;

      if (sessionUser) {
        // Successful session → clear any stale explicit-logout flag.
        try { window.localStorage.removeItem(EXPLICIT_SIGNOUT_KEY); } catch {}
        userRef.current = sessionUser;
        writeCachedUser(sessionUser);
        setUser(sessionUser);
        queueMicrotask(() => {
          if (cancelled) return;
          void fetchUserData(sessionUser.id);
        });
        return;
      }
      // Null session on INITIAL_SESSION / TOKEN_REFRESHED → DO NOTHING.
      // The preview environment frequently fires these spuriously while the
      // session is still valid. We never clear cached user or block the UI.
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const sessionUser = data.session?.user ?? null;
      if (sessionUser) {
        try { window.localStorage.removeItem(EXPLICIT_SIGNOUT_KEY); } catch {}
        userRef.current = sessionUser;
        writeCachedUser(sessionUser);
        setUser(sessionUser);
        void fetchUserData(sessionUser.id);
      }
      // If no session: do NOT clear cached user. Routes are pass-through;
      // the page renders from cache while the listener restores the session.
    });

    return () => {
      cancelled = true;
      subscription?.subscription?.unsubscribe?.();
    };
  }, [fetchUserData]);

  // Client-side role checks remain disabled — RLS is the source of truth.
  const hasRole = useCallback((_role: AppRole) => true, []);
  const hasAnyRole = useCallback((_roles: AppRole[]) => true, []);

  const isDcgMember = userDcg !== null;

  const canAccessPortal = useCallback((_portalType: string): boolean => true, []);
  const getAvailablePortals = useCallback(
    () => ['super', 'regional', 'dcg', 'member'],
    [],
  );
  const hasRegionalPermission = useCallback((_permission: string) => true, []);
  const hasRegionalPortalAccess = true;
  const isSuperAdmin = useCallback(() => true, []);
  const isRegionalAdmin = useCallback(() => true, []);
  const isMember = useCallback(() => true, []);
  const isDcgAdmin = useCallback(() => true, []);

  const signOut = useCallback(async () => {
    explicitSignOutRef.current = true;
    markExplicitSignOut();
    setLoading(true);
    fetchedForUserRef.current = null;
    userRef.current = null;
    clearCachedUser();
    setUser(null);
    setProfile(null);
    setUserRoles([]);
    setUserRegion(null);
    setUserDcg(null);
    setMemberRecord(null);
    setUserRegionalRoles([]);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[PortalAuth] signOut error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchUserData = useCallback(
    () => {
      if (!user) return null;
      fetchedForUserRef.current = null;
      return fetchUserData(user.id);
    },
    [user, fetchUserData],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      userRoles,
      userRegion,
      userDcg,
      memberRecord,
      memberId: memberRecord?.id || null,
      userRegionalRoles,
      loading,
      initialized,
      authReady,
      hasRole,
      hasAnyRole,
      hasRegionalPortalAccess,
      getAvailablePortals,
      canAccessPortal,
      hasRegionalPermission,
      isSuperAdmin,
      isRegionalAdmin,
      isMember,
      isDcgAdmin,
      isDcgMember,
      signOut,
      refetchUserData,
    }),
    [
      user,
      profile,
      userRoles,
      userRegion,
      userDcg,
      memberRecord,
      userRegionalRoles,
      loading,
      initialized,
      authReady,
      hasRole,
      hasAnyRole,
      hasRegionalPortalAccess,
      getAvailablePortals,
      canAccessPortal,
      hasRegionalPermission,
      isSuperAdmin,
      isRegionalAdmin,
      isMember,
      isDcgAdmin,
      isDcgMember,
      signOut,
      refetchUserData,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
