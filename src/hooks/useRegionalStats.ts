import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Hook to get regional DCG statistics
export const useRegionalDcgStats = () => {
  const { userRegion } = useAuth();

  return useQuery({
    queryKey: ['regional-dcg-stats', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return null;

      // Get total DCG members count
      const { data: dcgMembersData, error: membersError } = await supabase
        .from('dcg_members')
        .select(`
          id,
          dcg_id,
          dcgs!inner (
            region_id
          )
        `)
        .eq('dcgs.region_id', userRegion.id)
        .eq('is_active', true);

      if (membersError) {
        console.error('Error fetching DCG members:', membersError);
        throw membersError;
      }

      // Get average attendance across all regional DCGs
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_events')
        .select(`
          id,
          attendance_records (
            is_present
          )
        `)
        .eq('region_id', userRegion.id)
        .not('dcg_id', 'is', null); // Only DCG-specific events

      if (attendanceError) {
        console.error('Error fetching attendance data:', attendanceError);
        throw attendanceError;
      }

      // Calculate average attendance
      let totalPresentCount = 0;
      let totalEventAttendeeCount = 0;

      attendanceData?.forEach(event => {
        const eventRecords = event.attendance_records || [];
        const presentCount = eventRecords.filter(record => record.is_present).length;
        const totalAttendeesForEvent = eventRecords.length;
        
        totalPresentCount += presentCount;
        totalEventAttendeeCount += totalAttendeesForEvent;
      });

      const averageAttendance = totalEventAttendeeCount > 0 
        ? Math.round((totalPresentCount / totalEventAttendeeCount) * 100)
        : 0;

      return {
        totalDcgMembers: dcgMembersData?.length || 0,
        averageAttendance,
      };
    },
    enabled: !!userRegion?.id,
  });
};

// Hook to get recent DCG activity
export const useRecentDcgActivity = () => {
  const { userRegion } = useAuth();

  return useQuery({
    queryKey: ['recent-dcg-activity', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];

      // Get recent attendance events for DCGs in this region
      const { data, error } = await supabase
        .from('attendance_events')
        .select(`
          id,
          name,
          event_date,
          dcgs (
            name
          )
        `)
        .eq('region_id', userRegion.id)
        .not('dcg_id', 'is', null)
        .order('event_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent DCG activity:', error);
        throw error;
      }

      return data?.map(event => ({
        dcgName: event.dcgs?.name || 'Unknown DCG',
        activity: event.name,
        date: new Date(event.event_date).toLocaleDateString(),
        status: new Date(event.event_date) <= new Date() ? 'Completed' : 'Upcoming',
      })) || [];
    },
    enabled: !!userRegion?.id,
  });
};