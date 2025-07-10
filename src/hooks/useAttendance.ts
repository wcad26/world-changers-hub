
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

// Hook to get attendance stats for a specific member
export const useMemberAttendanceStats = (memberId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['member_attendance_stats', memberId, regionId],
    queryFn: async () => {
      if (!memberId || !regionId) {
        console.log('useMemberAttendanceStats: Missing memberId or regionId', { memberId, regionId });
        return null;
      }
      
      console.log('useMemberAttendanceStats: Querying for', { memberId, regionId });
      
      // Get all attendance records for this member in this region
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          is_present,
          attendance_events!inner (
            id,
            name,
            event_date,
            region_id
          )
        `)
        .eq('member_id', memberId)
        .eq('attendance_events.region_id', regionId)
        .order('attendance_events.event_date', { ascending: false });
      
      if (error) {
        console.error('useMemberAttendanceStats: Query error', error);
        throw error;
      }
      
      console.log('useMemberAttendanceStats: Raw data from query', { data, dataLength: data?.length });
      
      const totalEvents = data?.length || 0;
      const eventsAttended = data?.filter(record => record.is_present).length || 0;
      const attendanceRate = totalEvents > 0 ? (eventsAttended / totalEvents) * 100 : 0;
      
      console.log('useMemberAttendanceStats: Calculated stats', { 
        totalEvents, 
        eventsAttended, 
        attendanceRate,
        presentRecords: data?.filter(record => record.is_present) 
      });
      
      // Calculate this month's attendance
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthRecords = data?.filter(record => {
        const eventDate = new Date(record.attendance_events.event_date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }) || [];
      
      const thisMonthTotal = thisMonthRecords.length;
      const thisMonthAttended = thisMonthRecords.filter(record => record.is_present).length;
      const thisMonthRate = thisMonthTotal > 0 ? (thisMonthAttended / thisMonthTotal) * 100 : 0;
      
      // Calculate last month's attendance for comparison
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const lastMonthRecords = data?.filter(record => {
        const eventDate = new Date(record.attendance_events.event_date);
        return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
      }) || [];
      
      const lastMonthTotal = lastMonthRecords.length;
      const lastMonthAttended = lastMonthRecords.filter(record => record.is_present).length;
      const lastMonthRate = lastMonthTotal > 0 ? (lastMonthAttended / lastMonthTotal) * 100 : 0;
      
      const monthlyChange = thisMonthRate - lastMonthRate;
      
      // Calculate activity status based on last 3 events
      const last3Events = data?.slice(0, 3) || [];
      const isActiveBasedOnAttendance = last3Events.length < 3 || 
        last3Events.some(record => record.is_present);
      
      // Get the last attended event date
      const lastAttendedEvent = data?.find(record => record.is_present);
      const lastActiveDate = lastAttendedEvent ? lastAttendedEvent.attendance_events.event_date : null;
      
      return {
        totalEvents,
        eventsAttended,
        attendanceRate,
        thisMonthAttended,
        thisMonthTotal,
        thisMonthRate,
        monthlyChange,
        isActiveBasedOnAttendance,
        lastActiveDate,
        last3EventsAttendance: last3Events.map(record => ({
          eventName: record.attendance_events.name,
          eventDate: record.attendance_events.event_date,
          isPresent: record.is_present
        }))
      };
    },
    enabled: !!memberId && !!regionId
  });
};
