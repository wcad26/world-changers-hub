import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type Event = Database['public']['Tables']['events']['Row'];
export type NewEvent = Database['public']['Tables']['events']['Insert'];
export type UpdateEvent = Database['public']['Tables']['events']['Update'];

// Hook to get DCG-specific events
export const useDcgEvents = (dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-events', dcgId],
    queryFn: async () => {
      if (!dcgId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('dcg_id', dcgId)
        .order('start_datetime', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!dcgId,
  });
};

// Hook to create DCG event
export const useCreateDcgEvent = () => {
  const queryClient = useQueryClient();
  const { userDcg, userRegion, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventData: Omit<NewEvent, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'dcg_id' | 'created_by'>) => {
      if (!userDcg?.id || !userRegion?.id || !user?.id) {
        throw new Error('User, DCG, or region not found');
      }
      
      const { data, error } = await supabase
        .from('events')
        .insert([{ 
          ...eventData,
          dcg_id: userDcg.id,
          region_id: userRegion.id,
          created_by: user.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update DCG event
export const useUpdateDcgEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update event: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to delete DCG event
export const useDeleteDcgEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete event: " + error.message,
        variant: "destructive",
      });
    },
  });
};

// Helper to find or create an attendance_event for a DCG source event
const findOrCreateAttendanceEvent = async (
  sourceEventId: string,
  dcgId: string,
  regionId: string,
  eventName: string,
  eventDate: string,
  userId: string
): Promise<string> => {
  // Check if attendance_event already exists for this source event + dcg
  const { data: existing, error: fetchError } = await supabase
    .from('attendance_events')
    .select('id')
    .eq('source_event_id', sourceEventId)
    .eq('dcg_id', dcgId)
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing.id;

  // Create a new attendance_event
  const { data: created, error: createError } = await supabase
    .from('attendance_events')
    .insert({
      name: eventName,
      event_date: eventDate,
      source_event_id: sourceEventId,
      dcg_id: dcgId,
      region_id: regionId,
      created_by: userId,
    })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
};

// Hook to get attendance records for a specific source event (from events table)
export const useEventAttendanceRecords = (sourceEventId?: string, dcgId?: string) => {
  return useQuery({
    queryKey: ['event-attendance-records', sourceEventId, dcgId],
    queryFn: async () => {
      if (!sourceEventId) return [];

      // First find the attendance_event for this source event
      let query = supabase
        .from('attendance_events')
        .select('id')
        .eq('source_event_id', sourceEventId);
      
      if (dcgId) {
        query = query.eq('dcg_id', dcgId);
      }

      const { data: attendanceEvents, error: aeError } = await query;
      if (aeError) throw aeError;
      if (!attendanceEvents || attendanceEvents.length === 0) return [];

      const aeIds = attendanceEvents.map(ae => ae.id);

      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          members (
            id,
            member_id,
            profiles (
              first_name,
              last_name
            )
          )
        `)
        .in('event_id', aeIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!sourceEventId,
  });
};

// Hook to save attendance for an event
export const useSaveEventAttendance = () => {
  const queryClient = useQueryClient();
  const { user, userDcg, userRegion } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventName,
      eventDate,
      attendanceRecords,
    }: {
      eventId: string;
      eventName: string;
      eventDate: string;
      attendanceRecords: { member_id: string; is_present: boolean }[];
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      if (!userDcg?.id) throw new Error('DCG not found');

      const regionId = userRegion?.id || userDcg?.region_id;
      if (!regionId) throw new Error('Region not found');

      // Find or create the attendance_event
      const attendanceEventId = await findOrCreateAttendanceEvent(
        eventId,
        userDcg.id,
        regionId,
        eventName,
        eventDate,
        user.id
      );

      // Delete existing records for this attendance event to replace them
      await supabase
        .from('attendance_records')
        .delete()
        .eq('event_id', attendanceEventId);

      // Insert new records
      const recordsToInsert = attendanceRecords.map(record => ({
        event_id: attendanceEventId,
        member_id: record.member_id,
        is_present: record.is_present,
        recorded_by: user.id,
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .insert(recordsToInsert);

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance-records', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
      queryClient.invalidateQueries({ queryKey: ['dcg-attendance'] });
      toast({
        title: "Success",
        description: "Attendance recorded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to record attendance: " + error.message,
        variant: "destructive",
      });
    },
  });
};