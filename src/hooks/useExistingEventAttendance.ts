import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExistingAttendanceData {
  attendanceEventId: string | null;
  presentMemberIds: Set<string>;
  totalPresentCount: number;
}

export const useExistingEventAttendance = (sourceEventId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['existing_event_attendance', sourceEventId, regionId],
    queryFn: async (): Promise<ExistingAttendanceData> => {
      if (!sourceEventId || !regionId) {
        return { attendanceEventId: null, presentMemberIds: new Set(), totalPresentCount: 0 };
      }

      // Find existing attendance event(s) for this source event
      const { data: attendanceEvents, error: eventError } = await supabase
        .from('attendance_events')
        .select('id')
        .eq('source_event_id', sourceEventId)
        .eq('region_id', regionId);

      if (eventError) throw eventError;
      if (!attendanceEvents || attendanceEvents.length === 0) {
        return { attendanceEventId: null, presentMemberIds: new Set(), totalPresentCount: 0 };
      }

      // Get all attendance records from all related attendance events
      const attendanceEventIds = attendanceEvents.map(e => e.id);
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('member_id, is_present')
        .in('event_id', attendanceEventIds)
        .eq('is_present', true);

      if (recordsError) throw recordsError;

      // Deduplicate member IDs (same member might be in multiple attendance events)
      const presentMemberIds = new Set<string>(
        (records || []).map(r => r.member_id)
      );

      // Return the first attendance event ID for adding new records
      return {
        attendanceEventId: attendanceEvents[0].id,
        presentMemberIds,
        totalPresentCount: presentMemberIds.size,
      };
    },
    enabled: !!sourceEventId && !!regionId,
  });
};
