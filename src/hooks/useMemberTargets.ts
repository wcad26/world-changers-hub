import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type MemberTarget = Database['public']['Tables']['member_targets']['Row'];
type NewMemberTarget = Database['public']['Tables']['member_targets']['Insert'];
type UpdateMemberTarget = Database['public']['Tables']['member_targets']['Update'];

export const useMemberTargets = () => {
  const { userRegion } = useAuth();
  
  return useQuery({
    queryKey: ['member-targets', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      
      const { data, error } = await supabase
        .from('member_targets')
        .select('*')
        .eq('region_id', userRegion.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MemberTarget[];
    },
    enabled: !!userRegion?.id,
  });
};

export const useCurrentMemberTarget = (regionIdOverride?: string) => {
  const { userRegion } = useAuth();
  const effectiveRegionId = regionIdOverride ?? userRegion?.id;
  
  return useQuery({
    queryKey: ['current-member-target', effectiveRegionId],
    queryFn: async () => {
      if (!userRegion?.id) return null;
      
      const { data, error } = await supabase
        .from('member_targets')
        .select('*')
        .eq('region_id', userRegion.id)
        .eq('is_active', true)
        .gte('target_date', new Date().toISOString().split('T')[0])
        .order('target_date', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as MemberTarget | null;
    },
    enabled: !!userRegion?.id,
  });
};

export const useCreateMemberTarget = () => {
  const queryClient = useQueryClient();
  const { userRegion } = useAuth();
  
  return useMutation({
    mutationFn: async (targetData: Omit<NewMemberTarget, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'created_by'>) => {
      if (!userRegion?.id) throw new Error('User region not found');
      
      const { data, error } = await supabase
        .from('member_targets')
        .insert({
          ...targetData,
          region_id: userRegion.id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-targets'] });
      queryClient.invalidateQueries({ queryKey: ['current-member-target'] });
    },
  });
};

export const useUpdateMemberTarget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateMemberTarget & { id: string }) => {
      const { data, error } = await supabase
        .from('member_targets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-targets'] });
      queryClient.invalidateQueries({ queryKey: ['current-member-target'] });
    },
  });
};

export const useDeleteMemberTarget = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('member_targets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-targets'] });
      queryClient.invalidateQueries({ queryKey: ['current-member-target'] });
    },
  });
};