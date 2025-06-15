import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';

type Profile = Database['public']['Tables']['profiles']['Row'];
export type MemberWithProfile = Database['public']['Tables']['members']['Row'] & {
  profiles: Profile | null;
};

type NewMemberData = Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'emergency_contact_name' | 'emergency_contact_phone'> & {
    email: string;
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
