
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AttendanceEvent = Database['public']['Tables']['attendance_events']['Row'];
type AttendanceRecordInsert = Database['public']['Tables']['attendance_records']['Insert'];
type AttendanceEventInsert = Database['public']['Tables']['attendance_events']['Insert'];


export const useAttendanceEvents = (regionId?: string) => {
    return useQuery({
        queryKey: ['attendance_events', regionId],
        queryFn: async () => {
            if (!regionId) return [];
            const { data, error } = await supabase
                .from('attendance_events')
                .select('*')
                .eq('region_id', regionId)
                .order('event_date', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!regionId,
    });
};

export const useCreateAttendanceEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (event: AttendanceEventInsert) => {
            const { data, error } = await supabase
                .from('attendance_events')
                .insert(event)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['attendance_events', data.region_id] });
        },
    });
};

export const useSaveAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (records: AttendanceRecordInsert[]) => {
            const { data, error } = await supabase
                .from('attendance_records')
                .upsert(records, { onConflict: 'event_id,member_id' })
                .select();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data && data.length > 0) {
                queryClient.invalidateQueries({ queryKey: ['attendance_records', data[0].event_id] });
                queryClient.invalidateQueries({ queryKey: ['attendance_events'] });
            }
        },
    });
};

export const useAttendanceHistory = (regionId?: string) => {
  return useQuery({
    queryKey: ['attendance_history', regionId],
    queryFn: async () => {
      if (!regionId) return null;
      const { data, error } = await supabase.rpc('get_attendance_summary', { p_region_id: regionId });
      if (error) throw error;
      return data;
    },
    enabled: !!regionId
  });
};
