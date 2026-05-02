import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';

export interface EventAttendeeWithDetails {
  id: string;
  member_id: string;
  is_present: boolean;
  recorded_at: string | null;
  is_child?: boolean;
  member: {
    id: string;
    member_id: string;
    member_type: string;
    join_interest: string | null;
    profile: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      gender: string | null;
      date_of_birth?: string | null;
    } | null;
  } | null;
}

export interface EventReportData {
  event: {
    id: string;
    name: string;
    start_datetime: string;
    end_datetime: string | null;
    location_name: string | null;
    category: string | null;
    attendance_target: number | null;
  } | null;
  attendees: EventAttendeeWithDetails[];
  stats: {
    totalAttendees: number;
    members: number;
    visitors: number;
    children: number;
    maleCount: number;
    femaleCount: number;
    wantToJoin: number;
    notWantToJoin: number;
    undecided: number;
    attendanceRate: number;
  };
}

export const useEventReport = (eventId?: string, regionId?: string) => {
  return useQuery({
    queryKey: ['event_report', eventId, regionId],
    queryFn: async (): Promise<EventReportData> => {
      if (!eventId || !regionId) {
        throw new Error('Event ID and Region ID are required');
      }

      // Fetch event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, start_datetime, end_datetime, location_name, category, attendance_target')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      // Fetch attendance events for this source event
      const { data: attendanceEvents, error: aeError } = await supabase
        .from('attendance_events')
        .select('id')
        .eq('source_event_id', eventId)
        .eq('region_id', regionId);

      if (aeError) throw aeError;

      if (!attendanceEvents || attendanceEvents.length === 0) {
        return {
          event,
          attendees: [],
          stats: {
            totalAttendees: 0,
            members: 0,
            visitors: 0,
            children: 0,
            maleCount: 0,
            femaleCount: 0,
            wantToJoin: 0,
            notWantToJoin: 0,
            undecided: 0,
            attendanceRate: 0,
          },
        };
      }

      const attendanceEventIds = attendanceEvents.map(e => e.id);

      // Fetch attendance records with member and profile details
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          member_id,
          is_present,
          recorded_at
        `)
        .in('event_id', attendanceEventIds)
        .eq('is_present', true);

      if (recordsError) throw recordsError;

      // Deduplicate by member_id
      const uniqueMemberIds = [...new Set((records || []).map(r => r.member_id))];

      // Fetch member details
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          member_id,
          member_type,
          join_interest,
          profile:profiles!members_profile_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            gender,
            date_of_birth
          )
        `)
        .in('id', uniqueMemberIds);

      if (membersError) throw membersError;

      // Fetch relationships touching these attendees so we can apply the strict child rule
      let attendeeRelationships: Array<{ member_id: string; related_member_id: string }> = [];
      if (uniqueMemberIds.length > 0) {
        attendeeRelationships = await fetchMemberRelationshipsForMembers(uniqueMemberIds);
      }

      const attendeeChildrenSet = buildChildrenSet(
        (members || []).map(m => ({
          id: m.id,
          profiles: { date_of_birth: (m.profile as any)?.date_of_birth ?? null },
        })),
        attendeeRelationships
      );

      const membersMap = new Map(members?.map(m => [m.id, m]) || []);

      // Build attendees list
      const attendees: EventAttendeeWithDetails[] = uniqueMemberIds.map(memberId => {
        const record = records?.find(r => r.member_id === memberId);
        const member = membersMap.get(memberId);
        return {
          id: record?.id || '',
          member_id: memberId,
          is_present: true,
          recorded_at: record?.recorded_at || null,
          is_child: attendeeChildrenSet.has(memberId),
          member: member ? {
            id: member.id,
            member_id: member.member_id,
            member_type: member.member_type,
            join_interest: member.join_interest,
            profile: member.profile as EventAttendeeWithDetails['member']['profile'],
          } : null,
        };
      });

      // Calculate stats — exclude children from member/visitor counts
      const totalAttendees = attendees.length;
      const childrenCount = attendees.filter(a => a.is_child).length;
      const membersCount = attendees.filter(a => !a.is_child && a.member?.member_type === 'member').length;
      const visitorsCount = attendees.filter(a => !a.is_child && a.member?.member_type === 'visitor').length;
      const maleCount = attendees.filter(a => a.member?.profile?.gender?.toLowerCase() === 'male').length;
      const femaleCount = attendees.filter(a => a.member?.profile?.gender?.toLowerCase() === 'female').length;
      const wantToJoin = attendees.filter(a => a.member?.join_interest === 'yes').length;
      const notWantToJoin = attendees.filter(a => a.member?.join_interest === 'no').length;
      const undecided = attendees.filter(a => a.member?.join_interest === 'undecided').length;
      const attendanceRate = event?.attendance_target && event.attendance_target > 0 
        ? (totalAttendees / event.attendance_target) * 100 
        : 0;

      return {
        event,
        attendees,
        stats: {
          totalAttendees,
          members: membersCount,
          visitors: visitorsCount,
          children: childrenCount,
          maleCount,
          femaleCount,
          wantToJoin,
          notWantToJoin,
          undecided,
          attendanceRate,
        },
      };
    },
    enabled: !!eventId && !!regionId,
  });
};
