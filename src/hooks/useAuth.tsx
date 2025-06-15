
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setProfile(null);
          setUserRoles([]);
          setUserRegion(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile(profileData);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);

      // Fetch user region if profile exists
      if (profileData?.region_id) {
        const { data: regionData, error: regionError } = await supabase
          .from('regions')
          .select('*')
          .eq('id', profileData.region_id)
          .single();

        if (regionError && regionError.code !== 'PGRST116') {
          throw regionError;
        }

        setUserRegion(regionData);
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
    return userRoles.some(ur => ur.role === role && ur.is_active);
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isRegionalAdmin = () => hasRole('regional_admin');
  const isMember = () => hasRole('member');

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate('/');
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
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
