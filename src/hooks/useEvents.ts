
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

export type Event = Database['public']['Tables']['events']['Row'];
export type NewEvent = Database['public']['Tables']['events']['Insert'];
export type UpdateEvent = Database['public']['Tables']['events']['Update'];

// Hook to get events for the current admin's region
export const useRegionalEvents = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

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
  });
};

// Hook to get all public events
export const usePublicEvents = () => {
    return useQuery({
        queryKey: ['publicEvents'],
        queryFn: async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('is_public', true)
                .gte('start_datetime', now)
                .order('start_datetime', { ascending: true });
            if (error) throw error;
            return data;
        }
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
    return useQuery({
        queryKey: ['featuredEvents'],
        queryFn: async () => {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('is_public', true)
                .eq('is_featured', true)
                .gte('start_datetime', now)
                .order('start_datetime', { ascending: true });
            if (error) throw error;
            return data;
        }
    });
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
            // Get event details first to find related attendance events
            const { data: event } = await supabase
                .from('events')
                .select('start_datetime, region_id, name')
                .eq('id', id)
                .single();
            
            if (event) {
                const eventDate = new Date(event.start_datetime).toISOString().split('T')[0];
                
                // Find related attendance_events by date, region, and name
                const { data: attendanceEvents } = await supabase
                    .from('attendance_events')
                    .select('id')
                    .eq('event_date', eventDate)
                    .eq('region_id', event.region_id)
                    .eq('name', event.name);
                
                // Delete attendance records for these attendance events
                if (attendanceEvents && attendanceEvents.length > 0) {
                    const attendanceEventIds = attendanceEvents.map(ae => ae.id);
                    await supabase
                        .from('attendance_records')
                        .delete()
                        .in('event_id', attendanceEventIds);
                    
                    // Delete the attendance events
                    await supabase
                        .from('attendance_events')
                        .delete()
                        .in('id', attendanceEventIds);
                }
            }
            
            // Delete the main event (cascades to FAQs, images, speakers, testimonials, slug history)
            const { error } = await supabase.from('events').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['publicEvents'] });
        },
    });
};
