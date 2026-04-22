import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type Dcg = Database['public']['Tables']['dcgs']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

type AppRole = 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin';

const SIGNOUT_FLAG = 'wca:just_signed_out';
const SIGNOUT_FLAG_TTL_MS = 5000;

const isJustSignedOut = (): boolean => {
  try {
    const raw = sessionStorage.getItem(SIGNOUT_FLAG);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts) || Date.now() - ts > SIGNOUT_FLAG_TTL_MS) {
      sessionStorage.removeItem(SIGNOUT_FLAG);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const setJustSignedOut = () => {
  try {
    sessionStorage.setItem(SIGNOUT_FLAG, Date.now().toString());
  } catch {
    /* ignore */
  }
};

const clearJustSignedOut = () => {
  try {
    sessionStorage.removeItem(SIGNOUT_FLAG);
  } catch {
    /* ignore */
  }
};

interface AuthContextValue {
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

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const signOutRedirectRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const isSigningOutRef = useRef(false);
  const inflightFetchRef = useRef<string | null>(null);

  const clearAllState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setUserRoles([]);
    setUserRegion(null);
    setUserDcg(null);
    setMemberRecord(null);
    setUserRegionalRoles([]);
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    if (inflightFetchRef.current === userId) return;
    inflightFetchRef.current = userId;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Auth: profile fetch error', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Auth: roles fetch error', rolesError);
      } else {
        setUserRoles(rolesData || []);
      }

      if (profileData?.region_id) {
        const { data: regionData } = await supabase
          .from('regions')
          .select('*')
          .eq('id', profileData.region_id)
          .single();
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

      if (profileData && profileData.region_id) {
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
      console.error('Auth: exception fetching user data', error);
      toast({
        title: 'Error loading user data',
        description: 'Please refresh the page and try again.',
        variant: 'destructive',
      });
    } finally {
      initializedRef.current = true;
      setInitialized(true);
      setLoading(false);
      inflightFetchRef.current = null;
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    console.log('Auth: provider mounted — installing single auth listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Mid-signout: ignore noise until SIGNED_OUT lands
      if (isSigningOutRef.current && event !== 'SIGNED_OUT') {
        return;
      }

      if (event === 'SIGNED_OUT') {
        clearAllState();
        setLoading(false);
        initializedRef.current = true;
        setInitialized(true);

        const redirectUrl = signOutRedirectRef.current;
        signOutRedirectRef.current = null;
        isSigningOutRef.current = false;

        if (redirectUrl) {
          setJustSignedOut();
          navigate(redirectUrl, { replace: true });
          toast({
            title: 'Signed out successfully',
            description: 'You have been signed out of your account.',
          });
        }
        return;
      }

      // A real authenticated session: SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION w/ user
      if (session?.user) {
        // A new explicit sign-in invalidates any pending "just signed out" guard
        if (event === 'SIGNED_IN') {
          clearJustSignedOut();
        }

        setUser((prev: any) => {
          const isNewUser = prev?.id !== session.user.id;
          if (isNewUser) {
            // Reset derived state so route guards don't read stale roles/dcg
            setProfile(null);
            setUserRoles([]);
            setUserRegion(null);
            setUserDcg(null);
            setMemberRecord(null);
            setUserRegionalRoles([]);
            setLoading(true);
            setInitialized(false);
            initializedRef.current = false;
          }
          return isNewUser ? session.user : prev;
        });

        // Defer to avoid awaiting inside the listener (Supabase deadlock guidance)
        setTimeout(() => {
          if (mounted) fetchUserData(session.user.id);
        }, 0);
        return;
      }

      // No session
      if (!initializedRef.current) return;
      clearAllState();
      setLoading(false);
    });

    const getInitialSession = async () => {
      try {
        // Only the initial restore path honors the "just signed out" guard,
        // to prevent local-storage rehydration immediately after logout.
        if (isJustSignedOut()) {
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          clearJustSignedOut();
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Auth: initial session error', error);
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
          return;
        }
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth: initial session exception', error);
        if (mounted) {
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, navigate, toast]);

  const hasRole = useCallback(
    (role: AppRole) => userRoles.some((ur) => ur.role === role && ur.is_active),
    [userRoles],
  );

  const hasAnyRole = useCallback(
    (roles: AppRole[]) => roles.some((r) => userRoles.some((ur) => ur.role === r && ur.is_active)),
    [userRoles],
  );

  const isDcgMember = userDcg !== null;

  const canAccessPortal = useCallback(
    (portalType: string): boolean => {
      switch (portalType) {
        case 'super':
          return userRoles.some((ur) => ur.role === 'super_admin' && ur.is_active);
        case 'regional':
          return (
            userRoles.some((ur) => ur.role === 'regional_admin' && ur.is_active) ||
            userRegionalRoles.length > 0
          );
        case 'dcg':
          return (
            userRoles.some((ur) => ur.role === 'dcg_admin' && ur.is_active) || isDcgMember
          );
        case 'member':
          return (
            userRoles.some((ur) => ur.role === 'member' && ur.is_active) || memberRecord !== null
          );
        default:
          return false;
      }
    },
    [userRoles, userRegionalRoles, isDcgMember, memberRecord],
  );

  const getAvailablePortals = useCallback(() => {
    const portals: string[] = [];
    if (canAccessPortal('super')) portals.push('super');
    if (canAccessPortal('regional')) portals.push('regional');
    if (canAccessPortal('dcg')) portals.push('dcg');
    if (canAccessPortal('member')) portals.push('member');
    return portals;
  }, [canAccessPortal]);

  const hasRegionalPermission = useCallback(
    (permission: string) => {
      if (userRoles.some((ur) => ur.role === 'super_admin' && ur.is_active)) return true;
      return userRegionalRoles.some((userRole) =>
        userRole.regional_roles?.permissions?.includes(permission),
      );
    },
    [userRoles, userRegionalRoles],
  );

  const hasRegionalPortalAccess =
    userRoles.some((ur) => ur.role === 'regional_admin' && ur.is_active) ||
    userRegionalRoles.length > 0;

  const isSuperAdmin = useCallback(() => hasRole('super_admin'), [hasRole]);
  const isRegionalAdmin = useCallback(() => hasRole('regional_admin'), [hasRole]);
  const isMember = useCallback(() => hasRole('member'), [hasRole]);
  const isDcgAdmin = useCallback(() => hasRole('dcg_admin'), [hasRole]);

  const signOut = useCallback(async () => {
    try {
      console.log('Auth: signing out');
      isSigningOutRef.current = true;
      setLoading(true);

      const pathname = location.pathname;
      let redirectUrl = '/';
      if (pathname.startsWith('/admin/super') || pathname.startsWith('/super/')) {
        redirectUrl = '/auth/super';
      } else if (pathname.startsWith('/admin/regional') || pathname.startsWith('/regional/')) {
        redirectUrl = '/auth/regional';
      } else if (pathname.startsWith('/dcg/')) {
        redirectUrl = '/dcg-auth';
      } else if (pathname.startsWith('/member/')) {
        redirectUrl = '/auth/member';
      } else if (pathname.startsWith('/portal-selector')) {
        if (hasRole('super_admin')) redirectUrl = '/auth/super';
        else if (hasRole('regional_admin')) redirectUrl = '/auth/regional';
        else if (hasRole('dcg_admin')) redirectUrl = '/dcg-auth';
        else if (hasRole('member')) redirectUrl = '/auth/member';
      } else {
        if (hasRole('super_admin')) redirectUrl = '/auth/super';
        else if (hasRole('regional_admin')) redirectUrl = '/auth/regional';
        else if (hasRole('dcg_admin')) redirectUrl = '/dcg-auth';
        else if (hasRole('member')) redirectUrl = '/auth/member';
      }

      signOutRedirectRef.current = redirectUrl;

      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        const isSessionError = error.message?.toLowerCase().includes('session');
        if (isSessionError) {
          clearAllState();
          setLoading(false);
          isSigningOutRef.current = false;
          signOutRedirectRef.current = null;
          setJustSignedOut();
          navigate(redirectUrl, { replace: true });
          toast({
            title: 'Signed out successfully',
            description: 'You have been signed out of your account.',
          });
        } else {
          console.error('Auth: sign out error', error);
          isSigningOutRef.current = false;
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Auth: sign out exception', error);
      isSigningOutRef.current = false;
      signOutRedirectRef.current = null;
      clearAllState();
      setLoading(false);
      setJustSignedOut();
      navigate('/', { replace: true });
    }
  }, [location.pathname, hasRole, clearAllState, navigate, toast]);

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

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
};
