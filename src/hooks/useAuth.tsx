
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Tables']['user_roles']['Row'];
type Region = Database['public']['Tables']['regions']['Row'];

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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

  const hasRole = (role: 'super_admin' | 'regional_admin' | 'member') => {
    const result = userRoles.some(ur => ur.role === role && ur.is_active);
    console.log(`useAuth: Checking role ${role}:`, result, 'from roles:', userRoles.map(r => r.role));
    return result;
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isRegionalAdmin = () => hasRole('regional_admin');
  const isMember = () => hasRole('member');

  const signOut = async () => {
    try {
      console.log('useAuth: Signing out user...');
      setLoading(true);
      
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
        // Clear state immediately
        setUser(null);
        setProfile(null);
        setUserRoles([]);
        setUserRegion(null);
        
        navigate('/');
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
    loading,
    hasRole,
    isSuperAdmin,
    isRegionalAdmin,
    isMember,
    signOut,
    refetchUserData: () => user ? fetchUserData(user.id) : null
  };
};
