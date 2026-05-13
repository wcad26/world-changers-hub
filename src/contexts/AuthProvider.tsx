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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [userDcg, setUserDcg] = useState<Dcg | null>(null);
  const [memberRecord, setMemberRecord] = useState<Member | null>(null);
  const [userRegionalRoles, setUserRegionalRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const fetchedForUserRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
    if (fetchedForUserRef.current === userId) return;
    fetchedForUserRef.current = userId;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (profileData) setProfile(profileData);

      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      setUserRoles(rolesData || []);

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

      // Resolve DCG (session row, then led DCG, then membership)
      let resolvedDcg: Dcg | null = null;
      const { data: dcgId } = await supabase.rpc('get_user_dcg', { _user_id: userId });
      if (dcgId) {
        const { data: dcgData } = await supabase
          .from('dcgs')
          .select('*')
          .eq('id', dcgId)
          .maybeSingle();
        if (dcgData) resolvedDcg = dcgData;
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

      if (profileData?.region_id) {
        const { data: regionalRolesData } = await supabase
          .from('regional_user_roles')
          .select(`
            *,
            regional_roles (
              id,
              name,
              description,
              permissions
            )
          `)
          .eq('user_id', userId)
          .eq('region_id', profileData.region_id)
          .eq('is_active', true);
        setUserRegionalRoles(regionalRolesData || []);
      }
    } catch (error) {
      console.error('[PortalAuth] fetch error', error);
      fetchedForUserRef.current = null;
    } finally {
      setInitialized(true);
      setLoading(false);
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT') {
        fetchedForUserRef.current = null;
        setUser(null);
        setProfile(null);
        setUserRoles([]);
        setUserRegion(null);
        setUserDcg(null);
        setMemberRecord(null);
        setUserRegionalRoles([]);
        setInitialized(true);
        setLoading(false);
        setAuthReady(true);
        return;
      }

      const sessionUser = session?.user ?? null;

      // Only update auth state for events that actually carry session info.
      // Spurious events without a session (e.g. transient TOKEN_REFRESHED
      // failures) must NOT null out the user, otherwise the DCG portal
      // bounces a logged-in user back to /dcg-auth a few seconds after
      // login.
      if (sessionUser) {
        setUser(sessionUser);
        queueMicrotask(() => {
          if (cancelled) return;
          void fetchUserData(sessionUser.id);
        });
      } else if (event === 'INITIAL_SESSION') {
        // Truly no session at startup — let guards redirect.
        setUser(null);
        setInitialized(true);
        setLoading(false);
        setAuthReady(true);
      }
      // For other events without a session, ignore — keep current state.
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        void fetchUserData(sessionUser.id);
      } else {
        setInitialized(true);
        setLoading(false);
        setAuthReady(true);
      }
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
    setLoading(true);
    fetchedForUserRef.current = null;
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
