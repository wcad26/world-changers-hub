
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

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (!mounted) return;

        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            if (mounted) {
              fetchUserData(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
          setUserRegion(null);
          setLoading(false);
        }
      }
    );

    // Then get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('Fetching user data for:', userId);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      } else {
        console.log('Profile data:', profileData);
        setProfile(profileData);
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
      } else {
        console.log('User roles:', rolesData);
        setUserRoles(rolesData || []);
      }

      // Fetch user region if profile exists
      if (profileData?.region_id) {
        const { data: regionData, error: regionError } = await supabase
          .from('regions')
          .select('*')
          .eq('id', profileData.region_id)
          .single();

        if (regionError && regionError.code !== 'PGRST116') {
          console.error('Region fetch error:', regionError);
        } else {
          console.log('User region:', regionData);
          setUserRegion(regionData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
    console.log(`Checking role ${role}:`, result, 'from roles:', userRoles);
    return result;
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isRegionalAdmin = () => hasRole('regional_admin');
  const isMember = () => hasRole('member');

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Sign out successful');
        navigate('/');
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account."
        });
      }
    } catch (error) {
      console.error('Sign out exception:', error);
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
