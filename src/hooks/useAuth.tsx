
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type Dcg = Database['public']['Tables']['dcgs']['Row'];
type Member = Database['public']['Tables']['members']['Row'];

export const useAuth = () => {
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
  
  // Ref to track pending signout redirect - prevents race condition
  const signOutRedirectRef = useRef<string | null>(null);
  // Ref to track whether the initial session probe has resolved.
  // Prevents transient null sessions (during INITIAL_SESSION boot or token
  // refresh hiccups) from being interpreted as a logout by route guards.
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    console.log('useAuth: Setting up auth state listener...');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        // Handle SIGNED_OUT event - perform navigation here to avoid race condition
        if (event === 'SIGNED_OUT') {
          console.log('useAuth: SIGNED_OUT event received, clearing state...');
          setUser(null);
          setProfile(null);
          setUserRoles([]);
          setUserRegion(null);
          setUserDcg(null);
          setMemberRecord(null);
          setUserRegionalRoles([]);
          setLoading(false);
          initializedRef.current = true;
          setInitialized(true);
          
          // If we have a pending redirect from signOut, perform it now
          if (signOutRedirectRef.current) {
            const redirectUrl = signOutRedirectRef.current;
            signOutRedirectRef.current = null;
            console.log('useAuth: Navigating to:', redirectUrl);
            // Set flag to prevent auth pages from auto-redirecting back
            sessionStorage.setItem('just_signed_out', 'true');
            navigate(redirectUrl);
            toast({
              title: "Signed out successfully",
              description: "You have been signed out of your account."
            });
          }
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Use setTimeout to avoid blocking the auth state change and prevent potential deadlocks
          setTimeout(() => {
            if (mounted) {
              console.log('useAuth: Fetching user data after auth state change...');
              fetchUserData(session.user.id);
            }
          }, 100);
        } else {
          // No session in the event. If the initial probe hasn't run yet,
          // do NOT clear state or flip loading=false — INITIAL_SESSION will
          // deliver the truth shortly. This prevents guards from seeing a
          // transient (loading=false, user=null) state and bouncing the user.
          if (!initializedRef.current) {
            console.log('useAuth: Ignoring transient null session before initialization');
            return;
          }
          console.log('useAuth: No session, clearing user data...');
          setUser(null);
          setProfile(null);
          setUserRoles([]);
          setUserRegion(null);
          setUserDcg(null);
          setMemberRecord(null);
          setUserRegionalRoles([]);
          setLoading(false);
        }
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('useAuth: Error getting initial session:', error);
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('useAuth: Found initial session for user:', session.user.id);
          setUser(session.user);
          await fetchUserData(session.user.id);
        } else {
          console.log('useAuth: No initial session found');
          setLoading(false);
        }
        initializedRef.current = true;
        setInitialized(true);
      } catch (error) {
        console.error('useAuth: Exception getting initial session:', error);
        if (mounted) {
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      console.log('useAuth: Cleaning up auth listener...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('useAuth: Fetching user data for:', userId);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('useAuth: Profile fetch error:', profileError);
      } else if (profileData) {
        console.log('useAuth: Profile data loaded:', profileData.first_name, profileData.last_name);
        setProfile(profileData);
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('useAuth: Roles fetch error:', rolesError);
      } else {
        console.log('useAuth: User roles loaded:', rolesData?.map(r => r.role));
        setUserRoles(rolesData || []);
      }

      // Fetch user region if profile exists and has region_id
      if (profileData?.region_id) {
        const { data: regionData, error: regionError } = await supabase
          .from('regions')
          .select('*')
          .eq('id', profileData.region_id)
          .single();

        if (regionError && regionError.code !== 'PGRST116') {
          console.error('useAuth: Region fetch error:', regionError);
        } else if (regionData) {
          console.log('useAuth: User region loaded:', regionData.name);
          setUserRegion(regionData);
        }
      }

      // Fetch member record if user has profile
      if (profileData) {
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('profile_id', userId)
          .maybeSingle();

        if (memberError) {
          console.error('useAuth: Member fetch error:', memberError);
        } else if (memberData) {
          console.log('useAuth: Member record loaded:', memberData.member_id);
          setMemberRecord(memberData);
        }
      }

      // Resolve userDcg via any kind of association (session, leader, or member)
      let resolvedDcg: Dcg | null = null;

      // 1. Try dcg_user_sessions (dedicated leader provisioning)
      const { data: dcgId, error: dcgIdError } = await supabase
        .rpc('get_user_dcg', { _user_id: userId });

      if (dcgIdError) {
        console.error('useAuth: DCG session RPC error:', dcgIdError);
      } else if (dcgId) {
        const { data: dcgData } = await supabase
          .from('dcgs')
          .select('*')
          .eq('id', dcgId)
          .maybeSingle();
        if (dcgData) resolvedDcg = dcgData;
      }

      // 2/3. Fall back to leader_id or dcg_members lookup using the user's member ids
      if (!resolvedDcg) {
        const { data: memberRows } = await supabase
          .from('members')
          .select('id')
          .eq('profile_id', userId);

        const memberIds = (memberRows || []).map(m => m.id);

        if (memberIds.length > 0) {
          // 2. Leader of a DCG
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
            // 3. Regular dcg_members membership (prefer leader/co-leader role)
            const { data: memberships } = await supabase
              .from('dcg_members')
              .select('dcg_id, role, dcgs:dcg_id (*)')
              .in('member_id', memberIds)
              .eq('is_active', true);

            if (memberships && memberships.length > 0) {
              const preferred =
                memberships.find(m => m.role === 'Leader') ||
                memberships.find(m => m.role === 'Assistant') ||
                memberships[0];
              if (preferred?.dcgs) resolvedDcg = preferred.dcgs as Dcg;
            }
          }
        }
      }

      if (resolvedDcg) {
        console.log('useAuth: User DCG resolved:', resolvedDcg.name);
        setUserDcg(resolvedDcg);
      }

      // Fetch regional roles if user has region
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
      console.error('useAuth: Exception fetching user data:', error);
      toast({
        title: "Error loading user data",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
    } finally {
      initializedRef.current = true;
      setInitialized(true);
      setLoading(false);
    }
  };

  const hasRole = (role: 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin') => {
    const result = userRoles.some(ur => ur.role === role && ur.is_active);
    console.log(`useAuth: Checking role ${role}:`, result, 'from roles:', userRoles.map(r => r.role));
    return result;
  };

  const hasAnyRole = (roles: Array<'super_admin' | 'regional_admin' | 'member' | 'dcg_admin'>): boolean => {
    return roles.some(role => hasRole(role));
  };

  const getAvailablePortals = () => {
    const portals = [];
    if (canAccessPortal('super')) portals.push('super');
    if (canAccessPortal('regional')) portals.push('regional');
    if (canAccessPortal('dcg')) portals.push('dcg');
    if (canAccessPortal('member')) portals.push('member');
    return portals;
  };

  const canAccessPortal = (portalType: string): boolean => {
    switch (portalType) {
      case 'super': return hasRole('super_admin');
      case 'regional': return hasRole('super_admin') || hasRole('regional_admin');
      case 'dcg': return hasRole('super_admin') || hasRole('regional_admin') || hasRole('dcg_admin');
      case 'member': return hasRole('super_admin') || hasRole('regional_admin') || hasRole('dcg_admin') || hasRole('member');
      default: return false;
    }
  };

  const hasRegionalPermission = (permission: string) => {
    // Only super_admin gets an unconditional bypass.
    // The base `regional_admin` role is just a login token — granular regional
    // role permissions decide what's visible/reachable inside the portal.
    // True region owners still see everything because they hold the auto-created
    // "Regional Admin" granular role which contains every permission key.
    if (hasRole('super_admin')) return true;

    return userRegionalRoles.some(userRole =>
      userRole.regional_roles?.permissions?.includes(permission)
    );
  };

  const hasRegionalPortalAccess = hasRole('super_admin') || hasRole('regional_admin') || userRegionalRoles.length > 0;

  const isSuperAdmin = () => hasRole('super_admin');
  const isRegionalAdmin = () => hasRole('regional_admin');
  const isMember = () => hasRole('member');
  const isDcgAdmin = () => hasRole('dcg_admin');

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out user...');
      setLoading(true);
      
      // Determine redirect URL BEFORE clearing user state
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
      } else {
        // Fallback: determine by user roles (while still available)
        if (hasRole('super_admin')) {
          redirectUrl = '/auth/super';
        } else if (hasRole('regional_admin')) {
          redirectUrl = '/auth/regional';
        } else if (hasRole('dcg_admin')) {
          redirectUrl = '/dcg-auth';
        } else if (hasRole('member')) {
          redirectUrl = '/auth/member';
        }
      }
      
      // Store the redirect URL - navigation will happen in onAuthStateChange
      signOutRedirectRef.current = redirectUrl;
      
      // Use scope: 'global' to fully clear session from all tabs
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      // Handle session-not-found errors gracefully - user is already logged out
      if (error) {
        const isSessionError = error.message?.toLowerCase().includes('session');
        if (isSessionError) {
          console.log('useAuth: Session already expired, proceeding with cleanup...');
          // Manually trigger cleanup since onAuthStateChange may not fire
          setUser(null);
          setProfile(null);
          setUserRoles([]);
          setUserRegion(null);
          setUserDcg(null);
          setMemberRecord(null);
          setUserRegionalRoles([]);
          setLoading(false);
          navigate(redirectUrl);
          signOutRedirectRef.current = null;
          toast({
            title: "Signed out successfully",
            description: "You have been signed out of your account."
          });
        } else {
          console.error('useAuth: Sign out error:', error);
          setLoading(false);
        }
      } else {
        console.log('useAuth: Sign out API call successful, waiting for auth state change...');
        // Don't navigate here - let onAuthStateChange handle it
      }
    } catch (error) {
      console.error('useAuth: Sign out exception:', error);
      // On exception, clear state and redirect manually
      signOutRedirectRef.current = null;
      setUser(null);
      setProfile(null);
      setUserRoles([]);
      setUserRegion(null);
      setUserDcg(null);
      setMemberRecord(null);
      setUserRegionalRoles([]);
      setLoading(false);
      navigate('/');
    }
  };

  return {
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
    signOut,
    refetchUserData: () => user ? fetchUserData(user.id) : null
  };
};
