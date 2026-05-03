import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type Dcg = Database['public']['Tables']['dcgs']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

export type AppRole = 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin';

export interface AuthContextValue {
  user: any;
  profile: Profile | null;
  userRoles: UserRole[];
  userRegion: Region | null;
  userDcg: Dcg | null;
  memberRecord: Member | null;
  memberId: string | null;
  userRegionalRoles: any[];
  loading: boolean;
  initialized: boolean;
  authReady: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  hasRegionalPortalAccess: boolean;
  getAvailablePortals: () => string[];
  canAccessPortal: (portalType: string) => boolean;
  hasRegionalPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  isRegionalAdmin: () => boolean;
  isMember: () => boolean;
  isDcgAdmin: () => boolean;
  isDcgMember: boolean;
  signOut: () => Promise<void>;
  refetchUserData: () => Promise<void> | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Per-portal auth provider.
 *
 * Mounted ONCE inside each portal's route subtree (super, dcg, member).
 * Public pages run with NO provider — `useAuth()` returns a safe empty shape.
 *
 * Design rules (keep simple, keep stable):
 *   - Run getSession() ONCE on mount and load this user's data.
 *   - Do NOT subscribe to onAuthStateChange. No focus refetch, no token-refresh
 *     refetch, no cross-tab cascades. The session lives on the supabase client;
 *     this provider just snapshots derived data.
 *   - signOut uses scope: 'local' so signing out of one portal NEVER kills a
 *     session in another portal/tab. Caller decides where to navigate next.
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

  const bootedRef = useRef(false);
  const fetchedForUserRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string) => {
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

      fetchedForUserRef.current = userId;
    } catch (error) {
      console.error('[PortalAuth] fetch error', error);
    } finally {
      setInitialized(true);
      setLoading(false);
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let cancelled = false;
    const waitForSession = async () => {
      for (let i = 0; i < 8; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) return data.session;
        await new Promise((r) => setTimeout(r, 150));
      }
      const { data } = await supabase.auth.getSession();
      return data.session ?? null;
    };

    (async () => {
      try {
        const session = await waitForSession();
        if (cancelled) return;
        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          setInitialized(true);
          setLoading(false);
          setAuthReady(true);
        }
      } catch (err) {
        console.error('[PortalAuth] boot error', err);
        if (!cancelled) {
          setInitialized(true);
          setLoading(false);
          setAuthReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchUserData]);

  // All client-side role/permission checks are disabled — they always
  // return true so legacy guards never block UI. RLS remains the source
  // of truth for actual data access.
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
    setUser(null);
    setProfile(null);
    setUserRoles([]);
    setUserRegion(null);
    setUserDcg(null);
    setMemberRecord(null);
    setUserRegionalRoles([]);
    fetchedForUserRef.current = null;
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('[PortalAuth] signOut error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchUserData = useCallback(
    () => (user ? fetchUserData(user.id) : null),
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
