import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from './use-toast';

type AttendanceEvent = Database['public']['Tables']['attendance_events']['Row'];
type AttendanceRecordInsert = Database['public']['Tables']['attendance_records']['Insert'];
type AttendanceEventInsert = Database['public']['Tables']['attendance_events']['Insert'];

export interface NextMeeting {
  event_id: string;
  event_name: string;
  event_date: string;
  is_today: boolean;
  is_upcoming: boolean;
}

// Function removed - events are now created manually on the Events page

// Get next DCG meeting
export const useDcgNextMeeting = (dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-next-meeting', dcgId],
    queryFn: async () => {
      if (!dcgId) return null;
      
      const { data, error } = await supabase.rpc('get_next_dcg_meeting', {
        _dcg_id: dcgId,
      });

      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!dcgId,
  });
};

// Get attendance events for a specific DCG
export const useDcgAttendanceEvents = (dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-attendance-events', dcgId],
    queryFn: async () => {
      if (!dcgId) return [];
      
      const { data, error } = await supabase
        .from('attendance_events')
        .select('*')
        .eq('dcg_id', dcgId);
      
      if (error) throw error;
      
      // Sort client-side to avoid SQL ambiguity
      return data?.sort((a, b) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      ) || [];
    },
    enabled: !!dcgId,
  });
};

// Create DCG-specific attendance event
export const useCreateDcgAttendanceEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ['dcg-attendance-events', data.dcg_id] });
      toast({
        title: 'Attendance Event Created',
        description: 'DCG attendance event has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Event',
        description: error.message || 'An error occurred while creating the attendance event.',
        variant: 'destructive',
      });
    },
  });
};

// Save DCG attendance records
export const useSaveDcgAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        queryClient.invalidateQueries({ queryKey: ['dcg-attendance-events'] });
      }
      toast({
        title: 'Attendance Recorded',
        description: 'Attendance has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Record Attendance',
        description: error.message || 'An error occurred while recording attendance.',
        variant: 'destructive',
      });
    },
  });
};

// Get DCG attendance history with detailed breakdown
export const useDcgAttendanceHistory = (dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-attendance-history', dcgId],
    queryFn: async () => {
      if (!dcgId) return [];
      
      // Get attendance events with detailed breakdown for DCG members
      const { data, error } = await supabase
        .from('attendance_events')
        .select(`
          id,
          name,
          event_date,
          attendance_records (
            is_present,
            members!inner (
              id,
              member_type,
              dcg_members!inner (
                dcg_id
              )
            )
          )
        `)
        .eq('dcg_id', dcgId)
        .eq('attendance_records.members.dcg_members.dcg_id', dcgId);
      
      if (error) throw error;
      
      // Process the data to get counts and sort client-side
      const processedData = data?.map(event => {
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
      
      // Sort by event_date descending (client-side)
      return processedData.sort((a, b) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      );
    },
    enabled: !!dcgId
  });
};

// Get individual DCG member attendance stats
export const useDcgMemberAttendanceStats = (memberId?: string, dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-member-attendance-stats', memberId, dcgId],
    queryFn: async () => {
      if (!memberId || !dcgId) return null;
      
      // Get all attendance records for this member in this DCG
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          is_present,
          attendance_events!inner (
            id,
            name,
            event_date,
            dcg_id
          )
        `)
        .eq('member_id', memberId)
        .eq('attendance_events.dcg_id', dcgId);
      
      if (error) throw error;
      
      // Sort by event date descending
      const sortedData = data?.sort((a, b) => 
        new Date(b.attendance_events.event_date).getTime() - 
        new Date(a.attendance_events.event_date).getTime()
      );
      
      const totalEvents = sortedData?.length || 0;
      const eventsAttended = sortedData?.filter(record => record.is_present).length || 0;
      const attendanceRate = totalEvents > 0 ? (eventsAttended / totalEvents) * 100 : 0;
      
      // Calculate this month's attendance
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthRecords = sortedData?.filter(record => {
        const eventDate = new Date(record.attendance_events.event_date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }) || [];
      
      const thisMonthTotal = thisMonthRecords.length;
      const thisMonthAttended = thisMonthRecords.filter(record => record.is_present).length;
      const thisMonthRate = thisMonthTotal > 0 ? (thisMonthAttended / thisMonthTotal) * 100 : 0;
      
      // Calculate activity status based on last 3 events
      const last3Events = sortedData?.slice(0, 3) || [];
      const isActiveBasedOnAttendance = last3Events.length < 3 || 
        last3Events.some(record => record.is_present);
      
      // Get the last attended event date
      const lastAttendedEvent = sortedData?.find(record => record.is_present);
      const lastActiveDate = lastAttendedEvent ? lastAttendedEvent.attendance_events.event_date : null;
      
      return {
        totalEvents,
        eventsAttended,
        attendanceRate,
        thisMonthAttended,
        thisMonthTotal,
        thisMonthRate,
        isActiveBasedOnAttendance,
        lastActiveDate,
        last3EventsAttendance: last3Events.map(record => ({
          eventName: record.attendance_events.name,
          eventDate: record.attendance_events.event_date,
          isPresent: record.is_present
        }))
      };
    },
    enabled: !!memberId && !!dcgId
  });
};

// Get DCG attendance analytics
export const useDcgAttendanceAnalytics = (dcgId?: string) => {
  return useQuery({
    queryKey: ['dcg-attendance-analytics', dcgId],
    queryFn: async () => {
      if (!dcgId) return null;
      
      // Get all attendance events for this DCG
      const { data: events, error } = await supabase
        .from('attendance_events')
        .select(`
          id,
          name,
          event_date,
          attendance_records (
            is_present
          )
        `)
        .eq('dcg_id', dcgId);
      
      if (error) throw error;
      
      // Sort events client-side to avoid SQL ambiguity
      const sortedEvents = events?.sort((a, b) => 
        new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      ) || [];
      
      const totalEvents = sortedEvents.length;
      let totalAttendanceRecords = 0;
      let totalPresentRecords = 0;
      
      // Calculate overall stats
      sortedEvents.forEach(event => {
        const records = event.attendance_records || [];
        totalAttendanceRecords += records.length;
        totalPresentRecords += records.filter(r => r.is_present).length;
      });
      
      const averageAttendanceRate = totalAttendanceRecords > 0 
        ? (totalPresentRecords / totalAttendanceRecords) * 100 
        : 0;
      
      // Calculate this month vs last month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const thisMonthEvents = sortedEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      });
      
      const lastMonthEvents = sortedEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
      });
      
      let thisMonthTotal = 0;
      let thisMonthPresent = 0;
      thisMonthEvents.forEach(event => {
        const records = event.attendance_records || [];
        thisMonthTotal += records.length;
        thisMonthPresent += records.filter(r => r.is_present).length;
      });
      
      let lastMonthTotal = 0;
      let lastMonthPresent = 0;
      lastMonthEvents.forEach(event => {
        const records = event.attendance_records || [];
        lastMonthTotal += records.length;
        lastMonthPresent += records.filter(r => r.is_present).length;
      });
      
      const thisMonthRate = thisMonthTotal > 0 ? (thisMonthPresent / thisMonthTotal) * 100 : 0;
      const lastMonthRate = lastMonthTotal > 0 ? (lastMonthPresent / lastMonthTotal) * 100 : 0;
      const monthlyChange = thisMonthRate - lastMonthRate;
      
      return {
        totalEvents,
        averageAttendanceRate,
        thisMonthRate,
        monthlyChange,
        thisMonthEvents: thisMonthEvents.length,
      };
    },
    enabled: !!dcgId
  });
};
