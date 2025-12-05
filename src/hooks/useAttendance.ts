
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type AttendanceEvent = Database['public']['Tables']['attendance_events']['Row'];
type AttendanceRecordInsert = Database['public']['Tables']['attendance_records']['Insert'];
type AttendanceEventInsert = Database['public']['Tables']['attendance_events']['Insert'];

export type EventAttendee = {
  id: string;
  member_id: string;
  member_type: string;
  photo_url: string | null;
  profile_id: string | null;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};


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
      if (!memberId || !regionId) return null;

      const { data: attendanceRecords, error } = await supabase
        .from('attendance_records')
        .select(`
          is_present,
          event_id,
          attendance_events!inner (
            event_date,
            region_id
          )
        `)
        .eq('member_id', memberId)
        .eq('attendance_events.region_id', regionId);

      if (error) throw error;

      if (!attendanceRecords || attendanceRecords.length === 0) {
        return {
          totalEvents: 0,
          eventsAttended: 0,
          attendanceRate: 0,
          monthlyAttendance: [],
          isActive: false
        };
      }

      const eventsAttended = attendanceRecords.filter(r => r.is_present).length;
      const totalEvents = attendanceRecords.length;
      const attendanceRate = totalEvents > 0 ? (eventsAttended / totalEvents) * 100 : 0;

      const monthlyData = attendanceRecords.reduce((acc, record) => {
        const eventDate = record.attendance_events?.event_date;
        if (!eventDate) return acc;

        const month = format(new Date(eventDate), 'MMM yyyy');
        if (!acc[month]) {
          acc[month] = { month, attended: 0, total: 0 };
        }
        acc[month].total++;
        if (record.is_present) {
          acc[month].attended++;
        }
        return acc;
      }, {} as Record<string, { month: string; attended: number; total: number }>);

      const monthlyAttendance = Object.values(monthlyData);

      const sortedRecords = attendanceRecords
        .sort((a, b) => {
          const dateA = a.attendance_events?.event_date;
          const dateB = b.attendance_events?.event_date;
          if (!dateA || !dateB) return 0;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

      const recentEvents = sortedRecords.slice(0, 3);
      const recentAttendance = recentEvents.filter(r => r.is_present).length;
      const isActive = recentAttendance >= 2;

      // Get last active date
      const lastActiveRecord = sortedRecords.find(r => r.is_present);
      const lastActiveDate = lastActiveRecord?.attendance_events?.event_date || null;

      // Calculate monthly change (comparing last 2 months)
      const now = new Date();
      const thisMonth = format(now, 'MMM yyyy');
      const lastMonth = format(new Date(now.getFullYear(), now.getMonth() - 1), 'MMM yyyy');
      
      const thisMonthData = monthlyData[thisMonth];
      const lastMonthData = monthlyData[lastMonth];
      
      const thisMonthRate = thisMonthData ? (thisMonthData.attended / thisMonthData.total) * 100 : 0;
      const lastMonthRate = lastMonthData ? (lastMonthData.attended / lastMonthData.total) * 100 : 0;
      const monthlyChange = thisMonthRate - lastMonthRate;

      return {
        totalEvents,
        eventsAttended,
        attendanceRate: Math.round(attendanceRate),
        monthlyAttendance,
        isActive,
        isActiveBasedOnAttendance: isActive,
        monthlyChange,
        lastActiveDate
      };
    },
    enabled: !!memberId && !!regionId
  });
};

export const useEventAttendees = (eventId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['event_attendees', eventId, regionId],
    queryFn: async () => {
      if (!eventId || !regionId) return [];

      // Find ALL attendance events for this source event (may be multiple)
      const { data: attendanceEvents, error: attendanceEventError } = await supabase
        .from('attendance_events')
        .select('id')
        .eq('source_event_id', eventId)
        .eq('region_id', regionId);

      if (attendanceEventError) throw attendanceEventError;
      if (!attendanceEvents || attendanceEvents.length === 0) return [];

      // Get attendance event IDs
      const attendanceEventIds = attendanceEvents.map(e => e.id);

      // Get all members who attended (is_present = true) from ALL attendance events
      const { data: attendees, error: attendeesError } = await supabase
        .from('attendance_records')
        .select(`
          member_id,
          members!inner (
            id,
            member_id,
            member_type,
            photo_url,
            profile_id,
            profiles (
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .in('event_id', attendanceEventIds)
        .eq('is_present', true);

      if (attendeesError) throw attendeesError;

      // Deduplicate by member_id (same member might be in multiple attendance events)
      const uniqueAttendees = new Map<string, EventAttendee>();
      (attendees || []).forEach(record => {
        if (record.members && !uniqueAttendees.has(record.member_id)) {
          uniqueAttendees.set(record.member_id, record.members as EventAttendee);
        }
      });

      return Array.from(uniqueAttendees.values());
    },
    enabled: !!eventId && !!regionId
  });
};
