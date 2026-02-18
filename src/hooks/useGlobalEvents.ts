import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

export type Event = Database['public']['Tables']['events']['Row'];
export type NewEvent = Database['public']['Tables']['events']['Insert'];
export type UpdateEvent = Database['public']['Tables']['events']['Update'];

// Fetch ALL events across all regions (for super admin)
export const useGlobalEvents = () => {
  return useQuery({
    queryKey: ['events', 'global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, regions(name, code)')
        .order('start_datetime', { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Create a global/inter-regional event (region_id = NULL)
export const useCreateGlobalEvent = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventData: Omit<NewEvent, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user?.id) throw new Error('User not found');
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...eventData,
          region_id: eventData.region_id || null, // Allow null for global events
          created_by: user.id,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
    },
  });
};

// Update a global event
export const useUpdateGlobalEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateEvent & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
    },
  });
};

// Delete a global event
export const useDeleteGlobalEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
    },
  });
};
