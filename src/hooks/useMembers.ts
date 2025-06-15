
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';
import * as z from 'zod';

// Centralized schema for new members
export const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
});

// Type inferred from the schema
export type NewMemberData = z.infer<typeof memberSchema>;

// Manually add email to Profile to fix build error due to possibly stale types.ts
type Profile = Database['public']['Tables']['profiles']['Row'] & { email?: string | null };

export type MemberWithProfile = Database['public']['Tables']['members']['Row'] & {
  profiles: Profile | null;
};

export const useMembers = (regionId?: string) => {
  return useQuery({
    queryKey: ['members', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('members')
        .select('*, profiles(*)')
        .eq('region_id', regionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
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
      if (!userRegion) throw new Error("User region not found");

      const { data, error } = await supabase.functions.invoke('create-member', {
        body: { record: { ...newMember, region_id: userRegion.id } },
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      if(userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['members', userRegion.id] });
      }
    },
  });
};
