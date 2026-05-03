
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';
import * as z from 'zod';

// Enhanced schema for new members with all required fields
export const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  member_type: z.enum(['member', 'visitor']).default('member'),
});

// Type inferred from the schema
export type NewMemberData = z.infer<typeof memberSchema>;

// Enhanced member type with profile data
type Profile = Database['public']['Tables']['profiles']['Row'] & { 
  email?: string | null;
  user_roles?: Array<{
    role: string;
    is_active: boolean;
  }>;
};

export type MemberWithProfile = Database['public']['Tables']['members']['Row'] & {
  profiles: Profile | null;
  user_roles?: Array<{
    role: string;
    is_active: boolean;
  }>;
};

export const useMembers = (regionId?: string, memberType?: 'member' | 'visitor') => {
  return useQuery({
    queryKey: ['members', regionId, memberType],
    queryFn: async () => {
      if (!regionId) return [];
      
      let query = supabase
        .from('members')
        .select(`
          *,
          profiles (
            *
          )
        `)
        .eq('region_id', regionId);

      if (memberType) {
        query = query.eq('member_type', memberType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Batch fetch all user roles at once instead of N+1 queries
      const memberProfileIds = (data || [])
        .map(m => m.profiles?.id)
        .filter((id): id is string => !!id);
      
      if (memberProfileIds.length === 0) {
        return data as MemberWithProfile[];
      }

      const { data: allRoles } = await supabase
        .from('user_roles')
        .select('user_id, role, is_active')
        .in('user_id', memberProfileIds)
        .eq('is_active', true);
      
      // Create a map of user_id to roles for O(1) lookup
      const rolesMap = (allRoles || []).reduce((acc, role) => {
        if (!acc[role.user_id]) acc[role.user_id] = [];
        acc[role.user_id].push({ role: role.role, is_active: role.is_active });
        return acc;
      }, {} as Record<string, Array<{ role: string; is_active: boolean | null }>>);
      
      // Map roles to members in memory (no additional queries)
      const membersWithRoles = (data || []).map(member => {
        if (!member.profiles?.id) return member;
        
        return {
          ...member,
          profiles: {
            ...member.profiles,
            user_roles: rolesMap[member.profiles.id] || []
          }
        };
      });
      
      return membersWithRoles as MemberWithProfile[];
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000, // 5 minutes - don't refetch if data is fresh
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (newMember: NewMemberData) => {
      console.log('useCreateMember: Starting member creation:', newMember);
      
      if (!userRegion) {
        console.error('useCreateMember: No user region found');
        throw new Error("User region not found");
      }

      console.log('useCreateMember: Calling create-member function with region:', userRegion.id);
      
      const { data, error } = await supabase.functions.invoke('create-member', {
        body: { 
          record: { 
            ...newMember, 
            region_id: userRegion.id 
          } 
        },
      });

      if (error) {
        console.error('useCreateMember: Function call failed:', error);
        throw error;
      }
      
      if (!data?.success) {
        console.error('useCreateMember: Function returned error:', data);
        throw new Error(data?.error || 'Failed to create member');
      }
      
      console.log('useCreateMember: Member created successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('useCreateMember: Mutation successful, invalidating queries');
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['members', userRegion.id] });
      }
    },
    onError: (error) => {
      console.error('useCreateMember: Mutation failed:', error);
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('useDeleteMember: Starting member deletion:', userId);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });

      if (error) {
        console.error('useDeleteMember: Function call failed:', error);
        throw error;
      }
      
      if (!data?.success) {
        console.error('useDeleteMember: Function returned error:', data);
        throw new Error(data?.error || 'Failed to delete member');
      }
      
      console.log('useDeleteMember: Member deleted successfully:', data);
      return data;
    },
    onSuccess: () => {
      console.log('useDeleteMember: Mutation successful, invalidating queries');
      if (userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['members', userRegion.id] });
      }
    },
    onError: (error) => {
      console.error('useDeleteMember: Mutation failed:', error);
    },
  });
};
