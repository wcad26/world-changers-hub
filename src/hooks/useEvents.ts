
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';
import { featuredEventsQueryOptions, publicEventsQueryOptions } from '@/lib/public-site.functions';

export type Event = Database['public']['Tables']['events']['Row'];
export type NewEvent = Database['public']['Tables']['events']['Insert'];
export type UpdateEvent = Database['public']['Tables']['events']['Update'];

// Hook to get events for a region (defaults to current admin's region)
export const useRegionalEvents = (regionIdOverride?: string) => {
  const { userRegion } = useAuth();
  const regionId = regionIdOverride ?? userRegion?.id;

  return useQuery({
    queryKey: ['events', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('region_id', regionId)
        .order('start_datetime', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to get all public upcoming events
export const usePublicEvents = () => {
    const now = new Date().toISOString();
    return useQuery({ ...publicEventsQueryOptions(), select: (events) => events.filter((event) => event.start_datetime >= now) });
};

// Hook to get all public past events
export const usePublicPastEvents = () => {
    const now = new Date().toISOString();
    return useQuery({ ...publicEventsQueryOptions(), select: (events) => events.filter((event) => event.start_datetime < now).reverse() });
};

// Hook to get events for a member's region (both past and future)
export const useMemberRegionEvents = () => {
  const { profile } = useAuth();
  const regionId = profile?.region_id;

  return useQuery({
    queryKey: ['member-region-events', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('region_id', regionId)
        .eq('is_public', true)
        .order('start_datetime', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!regionId,
  });
};

// Hook to get a single event by ID
export const useEventById = (eventId: string | undefined) => {
    return useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!eventId,
    });
};

// Hook to get featured public events
export const useFeaturedEvents = () => {
    return useQuery(featuredEventsQueryOptions());
};


// Hook to create an event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { user, userRegion } = useAuth();

  return useMutation({
    mutationFn: async (eventData: Omit<NewEvent, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'created_by'>) => {
        if (!userRegion?.id || !user?.id) throw new Error('User or region not found');
        const { data, error } = await supabase
            .from('events')
            .insert([{ 
                ...eventData, 
                region_id: userRegion.id,
                created_by: user.id 
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

// Hook to update an event
export const useUpdateEvent = () => {
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

// Hook to delete an event
export const useDeleteEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            // Simply delete the event - CASCADE will handle attendance_events and all related records
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
        },
    });
};
