
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
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  member_type: z.enum(['member', 'visitor']).default('member'),
});

// Type inferred from the schema
export type NewMemberData = z.infer<typeof memberSchema>;

// Enhanced member type with profile data
type Profile = Database['public']['Tables']['profiles']['Row'] & { email?: string | null };

export type MemberWithProfile = Database['public']['Tables']['members']['Row'] & {
  profiles: Profile | null;
};

export const useMembers = (regionId?: string) => {
  return useQuery({
    queryKey: ['members', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      console.log('useMembers: Fetching members for region:', regionId);
      
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          profiles (
            *
          )
        `)
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('useMembers: Error fetching members:', error);
        throw error;
      }
      
      console.log('useMembers: Fetched members:', data);
      return data as MemberWithProfile[];
    },
    enabled: !!regionId,
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
