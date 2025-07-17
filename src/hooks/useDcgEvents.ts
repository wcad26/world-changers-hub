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

// Hook to get attendance records for a specific event
export const useEventAttendanceRecords = (eventId?: string) => {
  return useQuery({
    queryKey: ['event-attendance-records', eventId],
    queryFn: async () => {
      if (!eventId) return [];
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
        .eq('event_id', eventId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });
};

// Hook to save attendance for an event
export const useSaveEventAttendance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      eventId, 
      attendanceRecords 
    }: { 
      eventId: string; 
      attendanceRecords: { member_id: string; is_present: boolean }[] 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const recordsToInsert = attendanceRecords.map(record => ({
        event_id: eventId,
        member_id: record.member_id,
        is_present: record.is_present,
        recorded_by: user.id,
      }));

      const { data, error } = await supabase
        .from('attendance_records')
        .upsert(recordsToInsert, {
          onConflict: 'event_id,member_id'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance-records', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['dcg-events'] });
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