
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];
type Dcg = Database['public']['Tables']['dcgs']['Row'];

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [userDcg, setUserDcg] = useState<Dcg | null>(null);
  const [userRegionalRoles, setUserRegionalRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    console.log('useAuth: Setting up auth state listener...');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

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
          console.log('useAuth: No session, clearing user data...');
          setUser(null);
          setProfile(null);
          setUserRoles([]);
          setUserRegion(null);
          setUserDcg(null);
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
      } catch (error) {
        console.error('useAuth: Exception getting initial session:', error);
        if (mounted) {
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

      // Fetch user DCG if user has dcg_admin role
      const hasDcgRole = rolesData?.some(role => role.role === 'dcg_admin' && role.is_active);
      if (hasDcgRole) {
        const { data: dcgId, error: dcgIdError } = await supabase
          .rpc('get_user_dcg', { _user_id: userId });

        if (dcgIdError) {
          console.error('useAuth: DCG ID fetch error:', dcgIdError);
        } else if (dcgId) {
          const { data: dcgData, error: dcgError } = await supabase
            .from('dcgs')
            .select('*')
            .eq('id', dcgId)
            .single();

          if (dcgError && dcgError.code !== 'PGRST116') {
            console.error('useAuth: DCG fetch error:', dcgError);
          } else if (dcgData) {
            console.log('useAuth: User DCG loaded:', dcgData.name);
            setUserDcg(dcgData);
          }
        }
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
      setLoading(false);
    }
  };

  const hasRole = (role: 'super_admin' | 'regional_admin' | 'member' | 'dcg_admin') => {
    const result = userRoles.some(ur => ur.role === role && ur.is_active);
    console.log(`useAuth: Checking role ${role}:`, result, 'from roles:', userRoles.map(r => r.role));
    return result;
  };

  const hasRegionalPermission = (permission: string) => {
    if (hasRole('super_admin') || hasRole('regional_admin')) return true;
    
    return userRegionalRoles.some(userRole => 
      userRole.regional_roles?.permissions?.includes(permission)
    );
  };

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
        redirectUrl = '/auth/dcg';
      } else if (pathname.startsWith('/member/')) {
        redirectUrl = '/auth/member';
      } else {
        // Fallback: determine by user roles (while still available)
        if (hasRole('super_admin')) {
          redirectUrl = '/auth/super';
        } else if (hasRole('regional_admin')) {
          redirectUrl = '/auth/regional';
        } else if (hasRole('dcg_admin')) {
          redirectUrl = '/auth/dcg';
        } else if (hasRole('member')) {
          redirectUrl = '/auth/member';
        }
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('useAuth: Sign out error:', error);
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('useAuth: Sign out successful');
        // Clear state after determining redirect URL
        setUser(null);
        setProfile(null);
        setUserRoles([]);
        setUserRegion(null);
        setUserDcg(null);
        setUserRegionalRoles([]);
        
        navigate(redirectUrl);
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account."
        });
      }
    } catch (error) {
      console.error('useAuth: Sign out exception:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    userRoles,
    userRegion,
    userDcg,
    userRegionalRoles,
    loading,
    hasRole,
    hasRegionalPermission,
    isSuperAdmin,
    isRegionalAdmin,
    isMember,
    isDcgAdmin,
    signOut,
    refetchUserData: () => user ? fetchUserData(user.id) : null
  };
};
