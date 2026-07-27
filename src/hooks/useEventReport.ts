import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';

export interface EventReportDay {
  attendanceEventId: string;
  dayIndex: number;
  eventDate: string;
  name: string;
  presentCount: number;
}

export interface EventAttendeeWithDetails {
  id: string;
  member_id: string;
  is_present: boolean;
  recorded_at: string | null;
  is_child?: boolean;
  days_attended: number;
  days_present: number[]; // day_index values where member was marked present
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
  days: EventReportDay[];
  totalDays: number;
  stats: {
    totalAttendees: number;
    members: number;
    visitors: number;
    children: number;
    unknownType: number;
    maleCount: number;
    femaleCount: number;
    unknownGender: number;
    wantToJoin: number;
    notWantToJoin: number;
    undecided: number;
    joinInterestNotSpecified: number;
    visitorsTotal: number;
    attendanceRate: number;
  };
}

export const useEventReport = (eventId?: string, regionId?: string | null, dayEventId?: string) => {
  return useQuery({
    queryKey: ['event_report', eventId, regionId ?? 'any', dayEventId || 'all'],
    queryFn: async (): Promise<EventReportData> => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, name, start_datetime, end_datetime, location_name, category, attendance_target')
        .eq('id', eventId)
        .single();
      if (eventError) throw eventError;

      // All attendance_events linked to this source event
      let aeQuery = supabase
        .from('attendance_events')
        .select('id, event_date, day_index, name, parent_event_id')
        .eq('source_event_id', eventId);
      if (regionId) aeQuery = aeQuery.eq('region_id', regionId);
      const { data: attendanceEvents, error: aeError } = await aeQuery;
      if (aeError) throw aeError;


      const empty: EventReportData = {
        event,
        attendees: [],
        days: [],
        totalDays: 0,
        stats: {
          totalAttendees: 0, members: 0, visitors: 0, children: 0, unknownType: 0,
          maleCount: 0, femaleCount: 0, unknownGender: 0,
          wantToJoin: 0, notWantToJoin: 0, undecided: 0,
          joinInterestNotSpecified: 0, visitorsTotal: 0, attendanceRate: 0,
        },
      };

      if (!attendanceEvents || attendanceEvents.length === 0) return empty;

      // Determine day structure: prefer children of a parent; otherwise treat each attendance_event as a "day"
      const parents = attendanceEvents.filter(e => !e.parent_event_id);
      const children = attendanceEvents.filter(e => !!e.parent_event_id);
      const dayRows = children.length > 0
        ? [...parents, ...children].sort((a, b) => (a.day_index || 0) - (b.day_index || 0))
        : attendanceEvents.slice().sort((a, b) => (a.event_date || '').localeCompare(b.event_date || ''));

      // Assign a stable dayIndex (1-based) if missing
      const dayMeta = dayRows.map((r, i) => ({
        attendanceEventId: r.id,
        dayIndex: r.day_index ?? (i + 1),
        eventDate: r.event_date,
        name: r.name,
      }));

      // Which attendance_event ids to include in stats
      const includeIds = dayEventId
        ? [dayEventId]
        : attendanceEvents.map(e => e.id);

      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('id, member_id, is_present, recorded_at, event_id')
        .in('event_id', includeIds)
        .eq('is_present', true);
      if (recordsError) throw recordsError;

      // Present counts per day (always across all days, regardless of filter)
      const allRecordsRes = dayEventId
        ? await supabase
            .from('attendance_records')
            .select('member_id, event_id')
            .in('event_id', attendanceEvents.map(e => e.id))
            .eq('is_present', true)
        : { data: records?.map(r => ({ member_id: r.member_id, event_id: r.event_id })) || [], error: null };
      if ((allRecordsRes as any).error) throw (allRecordsRes as any).error;
      const allRecords = (allRecordsRes as any).data as { member_id: string; event_id: string }[];

      const dayIdToIndex = new Map(dayMeta.map(d => [d.attendanceEventId, d.dayIndex]));
      const presentPerDay = new Map<string, Set<string>>();
      for (const r of allRecords) {
        if (!presentPerDay.has(r.event_id)) presentPerDay.set(r.event_id, new Set());
        presentPerDay.get(r.event_id)!.add(r.member_id);
      }
      const days: EventReportDay[] = dayMeta.map(d => ({
        ...d,
        presentCount: presentPerDay.get(d.attendanceEventId)?.size || 0,
      }));

      // Build per-member "days attended" map from allRecords
      const memberDays = new Map<string, Set<number>>();
      for (const r of allRecords) {
        const di = dayIdToIndex.get(r.event_id);
        if (di == null) continue;
        if (!memberDays.has(r.member_id)) memberDays.set(r.member_id, new Set());
        memberDays.get(r.member_id)!.add(di);
      }

      const uniqueMemberIds = [...new Set((records || []).map(r => r.member_id))];

      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id, member_id, member_type, join_interest,
          profile:profiles!members_profile_id_fkey (
            id, first_name, last_name, email, phone, gender, date_of_birth
          )
        `)
        .in('id', uniqueMemberIds);
      if (membersError) throw membersError;

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
      const recordByMember = new Map<string, typeof records[0]>();
      for (const r of records || []) {
        const existing = recordByMember.get(r.member_id);
        if (!existing || (r.recorded_at && existing.recorded_at && r.recorded_at < existing.recorded_at)) {
          recordByMember.set(r.member_id, r);
        }
      }

      const attendees: EventAttendeeWithDetails[] = uniqueMemberIds.map(memberId => {
        const record = recordByMember.get(memberId);
        const member = membersMap.get(memberId);
        const daysSet = memberDays.get(memberId) || new Set<number>();
        return {
          id: record?.id || '',
          member_id: memberId,
          is_present: true,
          recorded_at: record?.recorded_at || null,
          is_child: attendeeChildrenSet.has(memberId),
          days_attended: daysSet.size,
          days_present: [...daysSet].sort((a, b) => a - b),
          member: member ? {
            id: member.id,
            member_id: member.member_id,
            member_type: member.member_type,
            join_interest: member.join_interest,
            profile: member.profile as EventAttendeeWithDetails['member']['profile'],
          } : null,
        };
      });

      const totalAttendees = attendees.length;
      const childrenCount = attendees.filter(a => a.is_child).length;
      const nonChild = attendees.filter(a => !a.is_child);
      const membersCount = nonChild.filter(a => a.member?.member_type === 'member').length;
      const visitorsCount = nonChild.filter(a => a.member?.member_type === 'visitor').length;
      const unknownType = nonChild.length - membersCount - visitorsCount;
      const maleCount = attendees.filter(a => a.member?.profile?.gender?.toLowerCase() === 'male').length;
      const femaleCount = attendees.filter(a => a.member?.profile?.gender?.toLowerCase() === 'female').length;
      const unknownGender = totalAttendees - maleCount - femaleCount;
      const visitorsAll = attendees.filter(a => a.member?.member_type === 'visitor');
      const wantToJoin = visitorsAll.filter(a => a.member?.join_interest === 'yes').length;
      const notWantToJoin = visitorsAll.filter(a => a.member?.join_interest === 'no').length;
      const undecided = visitorsAll.filter(a => a.member?.join_interest === 'undecided').length;
      const joinInterestNotSpecified = visitorsAll.length - wantToJoin - notWantToJoin - undecided;
      const attendanceRate = event?.attendance_target && event.attendance_target > 0
        ? (totalAttendees / event.attendance_target) * 100
        : 0;

      return {
        event,
        attendees,
        days,
        totalDays: days.length,
        stats: {
          totalAttendees, members: membersCount, visitors: visitorsCount,
          children: childrenCount, unknownType,
          maleCount, femaleCount, unknownGender,
          wantToJoin, notWantToJoin, undecided,
          joinInterestNotSpecified, visitorsTotal: visitorsAll.length,
          attendanceRate,
        },
      };
    },
    enabled: !!eventId,
  });
};

