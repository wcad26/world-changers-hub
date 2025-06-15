
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth.tsx';
import * as z from 'zod';

export type Dcg = Database['public']['Tables']['dcgs']['Row'];
export type DcgWithLeader = Dcg & {
  leader: {
    profiles: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
};

// Schema for creating/updating a DCG
export const dcgSchema = z.object({
  name: z.string().min(1, 'DCG name is required'),
  leader_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  meeting_day: z.string().optional().nullable(),
  meeting_time: z.string().optional().nullable(),
  contact_phone: z.string().optional().nullable(),
});
export type DcgData = z.infer<typeof dcgSchema>;

// Hook to fetch all DCGs for the current user's region
export const useDcgs = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['dcgs', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('dcgs')
        .select('*, leader:members(profiles(first_name, last_name)))')
        .eq('region_id', regionId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as DcgWithLeader[];
    },
    enabled: !!regionId,
  });
};

// Hook to create a new DCG
export const useCreateDcg = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();

  return useMutation({
    mutationFn: async (dcgData: DcgData) => {
      if (!userRegion?.id) throw new Error('User region not found');
      
      const { data, error } = await supabase
        .from('dcgs')
        .insert([{ ...dcgData, region_id: userRegion.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if(userRegion?.id) {
        queryClient.invalidateQueries({ queryKey: ['dcgs', userRegion.id] });
        queryClient.invalidateQueries({ queryKey: ['regionalReports', userRegion.id] });
      }
    },
  });
};
