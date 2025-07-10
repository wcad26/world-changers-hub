
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

export const useAttendanceHistoryWithMemberTypes = (regionId?: string) => {
  return useQuery({
    queryKey: ['attendance_history_with_types', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      
      // Get attendance events with detailed breakdown by member type
      const { data, error } = await supabase
        .from('attendance_events')
        .select(`
          id,
          name,
          event_date,
          attendance_records!inner (
            is_present,
            members!inner (
              member_type
            )
          )
        `)
        .eq('region_id', regionId)
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      
      // Process the data to get counts by member type
      return data?.map(event => {
        const records = event.attendance_records || [];
        
        const membersPresent = records.filter(r => 
          r.is_present && r.members?.member_type === 'member'
        ).length;
        
        const visitorsPresent = records.filter(r => 
          r.is_present && r.members?.member_type === 'visitor'
        ).length;
        
        const membersAbsent = records.filter(r => 
          !r.is_present && r.members?.member_type === 'member'
        ).length;
        
        const visitorsAbsent = records.filter(r => 
          !r.is_present && r.members?.member_type === 'visitor'
        ).length;
        
        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          members_present: membersPresent,
          visitors_present: visitorsPresent,
          members_absent: membersAbsent,
          visitors_absent: visitorsAbsent,
          total_present: membersPresent + visitorsPresent,
          total_absent: membersAbsent + visitorsAbsent,
          date: new Date(event.event_date).toLocaleDateString()
        };
      }) || [];
    },
    enabled: !!regionId
  });
};
