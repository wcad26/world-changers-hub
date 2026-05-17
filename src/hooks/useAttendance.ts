
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { isChildMember } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';

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
      
      // First fetch DCG IDs belonging to this region
      const { data: regionalDcgs } = await supabase
        .from('dcgs')
        .select('id')
        .eq('region_id', regionId);
      
      const dcgIds = regionalDcgs?.map(d => d.id) || [];
      
      // Fetch attendance events for this region OR linked via regional DCGs
      let query = supabase
        .from('attendance_events')
        .select(`
          id,
          name,
          event_date,
          dcg_id,
          source_event_id,
          attendance_records!inner (
            is_present,
            members!inner (
              id,
              member_type,
              profiles (
                date_of_birth
              )
            )
          )
        `)
        .order('event_date', { ascending: false });
      
      // Filter: region_id matches OR dcg_id is in regional DCGs
      if (dcgIds.length > 0) {
        query = query.or(`region_id.eq.${regionId},dcg_id.in.(${dcgIds.join(',')})`);
      } else {
        query = query.eq('region_id', regionId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;

      // Collect unique member IDs and DOBs from attendance records
      const memberIds = new Set<string>();
      const dobByMemberId = new Map<string, string | null | undefined>();
      data?.forEach(event => {
        (event.attendance_records || []).forEach((r: any) => {
          if (r.members?.id) {
            memberIds.add(r.members.id);
            dobByMemberId.set(r.members.id, r.members?.profiles?.date_of_birth ?? null);
          }
        });
      });

      // Fetch relationships AND build adult DOB lookup so the strict child rule
      // (age<16 AND linked to at least one adult) is applied identically across
      // dashboards, KPIs, and attendance trends.
      let relationships: Array<{ member_id: string; related_member_id: string }> = [];
      const adultDobLookup = new Map<string, string | null | undefined>(dobByMemberId);
      if (memberIds.size > 0) {
        const ids = Array.from(memberIds);
        relationships = await fetchMemberRelationshipsForMembers(ids);

        // Pull DOBs for related members not in attendance — needed to verify
        // the related party is an adult.
        const referenced = new Set<string>();
        relationships.forEach(r => {
          referenced.add(r.member_id);
          referenced.add(r.related_member_id);
        });
        const missing = Array.from(referenced).filter(id => !adultDobLookup.has(id));
        if (missing.length > 0) {
          const { data: extraMembers } = await supabase
            .from('members')
            .select('id, profiles:profile_id(date_of_birth)')
            .in('id', missing);
          (extraMembers || []).forEach((m: any) => {
            adultDobLookup.set(m.id, m.profiles?.date_of_birth ?? null);
          });
        }
      }

      const checkIsChild = (record: any) => {
        const dob = record.members?.profiles?.date_of_birth;
        const memberId = record.members?.id;
        if (!dob || !memberId) return false;
        return isChildMember(dob, memberId, relationships, adultDobLookup);
      };
      
      // Process the data to get counts by member type, separating children
      const processedData = data?.map(event => {
        const records = event.attendance_records || [];

        const presentMemberIds: string[] = [];
        const presentVisitorIds: string[] = [];
        const presentChildrenIds: string[] = [];

        const childrenPresent = records.filter(r => r.is_present && checkIsChild(r)).length;
        const childrenAbsent = records.filter(r => !r.is_present && checkIsChild(r)).length;

        const membersPresent = records.filter(r =>
          r.is_present && r.members?.member_type === 'member' && !checkIsChild(r)
        ).length;

        const visitorsPresent = records.filter(r =>
          r.is_present && r.members?.member_type === 'visitor' && !checkIsChild(r)
        ).length;

        const membersAbsent = records.filter(r =>
          !r.is_present && r.members?.member_type === 'member' && !checkIsChild(r)
        ).length;

        const visitorsAbsent = records.filter(r =>
          !r.is_present && r.members?.member_type === 'visitor' && !checkIsChild(r)
        ).length;

        records.forEach((r: any) => {
          if (!r.is_present || !r.members?.id) return;
          const id = r.members.id;
          if (checkIsChild(r)) presentChildrenIds.push(id);
          else if (r.members?.member_type === 'member') presentMemberIds.push(id);
          else if (r.members?.member_type === 'visitor') presentVisitorIds.push(id);
        });

        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          dcg_id: event.dcg_id || null,
          source_event_id: event.source_event_id || null,
          members_present: membersPresent,
          visitors_present: visitorsPresent,
          children_present: childrenPresent,
          members_absent: membersAbsent,
          visitors_absent: visitorsAbsent,
          children_absent: childrenAbsent,
          present_member_ids: presentMemberIds,
          present_visitor_ids: presentVisitorIds,
          present_children_ids: presentChildrenIds,
          total_present: membersPresent + visitorsPresent + childrenPresent,
          total_absent: membersAbsent + visitorsAbsent + childrenAbsent,
          date: new Date(event.event_date).toLocaleDateString()
        };
      }) || [];

      // Return one row per attendance event (do NOT collapse same-day events
      // — multiple meetings on the same date must remain distinct points on
      // the trend chart).
      return processedData;
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
      let attendanceQuery = supabase
        .from('attendance_events')
        .select('id')
        .eq('source_event_id', eventId);

      // If regionId provided, filter by region; otherwise get ALL (global)
      attendanceQuery = attendanceQuery.eq('region_id', regionId);

      const { data: attendanceEvents, error: attendanceEventError } = await attendanceQuery;

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

// Hook to get detailed attendance stats for a member with date filtering and categorization
export const useMemberDetailedAttendance = (
  memberId?: string,
  regionId?: string,
  dateRange?: { from: Date | undefined; to: Date | undefined }
) => {
  return useQuery({
    queryKey: ['member_detailed_attendance', memberId, regionId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!memberId || !regionId) return null;

      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          is_present,
          event_id,
          attendance_events!inner (
            id,
            name,
            event_date,
            region_id,
            dcg_id
          )
        `)
        .eq('member_id', memberId)
        .eq('attendance_events.region_id', regionId)
        .order('attendance_events(event_date)', { ascending: false });

      // Apply date filters
      if (dateRange?.from) {
        query = query.gte('attendance_events.event_date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        query = query.lte('attendance_events.event_date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      const { data: records, error } = await query;

      if (error) throw error;

      if (!records || records.length === 0) {
        return {
          overall: { attended: 0, total: 0, rate: 0 },
          regional: { attended: 0, total: 0 },
          dcg: { attended: 0, total: 0 },
          prayerMeeting: { attended: 0, total: 0 },
          streak: 0,
          recentEvents: [],
          monthlyTrend: []
        };
      }

      // Categorize events
      const regionalEvents = records.filter(r => 
        !r.attendance_events?.dcg_id && 
        !r.attendance_events?.name?.toLowerCase().includes('prayer')
      );
      const dcgEvents = records.filter(r => r.attendance_events?.dcg_id);
      const prayerEvents = records.filter(r => 
        r.attendance_events?.name?.toLowerCase().includes('prayer')
      );

      // Calculate stats for each category
      const overall = {
        attended: records.filter(r => r.is_present).length,
        total: records.length,
        rate: records.length > 0 
          ? Math.round((records.filter(r => r.is_present).length / records.length) * 100)
          : 0
      };

      const regional = {
        attended: regionalEvents.filter(r => r.is_present).length,
        total: regionalEvents.length
      };

      const dcg = {
        attended: dcgEvents.filter(r => r.is_present).length,
        total: dcgEvents.length
      };

      const prayerMeeting = {
        attended: prayerEvents.filter(r => r.is_present).length,
        total: prayerEvents.length
      };

      // Calculate streak (consecutive present events from most recent)
      const sortedRecords = [...records].sort((a, b) => {
        const dateA = a.attendance_events?.event_date || '';
        const dateB = b.attendance_events?.event_date || '';
        return dateB.localeCompare(dateA);
      });

      let streak = 0;
      for (const record of sortedRecords) {
        if (record.is_present) {
          streak++;
        } else {
          break;
        }
      }

      // Recent events (last 10)
      const recentEvents = sortedRecords.slice(0, 10).map(r => ({
        id: r.id,
        name: r.attendance_events?.name || '',
        date: r.attendance_events?.event_date || '',
        type: r.attendance_events?.dcg_id ? 'dcg' : 
              r.attendance_events?.name?.toLowerCase().includes('prayer') ? 'prayer' : 'regional',
        attended: r.is_present
      }));

      // Monthly trend for chart
      const monthlyData = records.reduce((acc, record) => {
        const eventDate = record.attendance_events?.event_date;
        if (!eventDate) return acc;

        const month = format(new Date(eventDate), 'MMM');
        if (!acc[month]) {
          acc[month] = { month, attended: 0, total: 0 };
        }
        acc[month].total++;
        if (record.is_present) {
          acc[month].attended++;
        }
        return acc;
      }, {} as Record<string, { month: string; attended: number; total: number }>);

      const monthlyTrend = Object.values(monthlyData)
        .map(m => ({
          ...m,
          rate: m.total > 0 ? Math.round((m.attended / m.total) * 100) : 0
        }))
        .slice(-6);

      return {
        overall,
        regional,
        dcg,
        prayerMeeting,
        streak,
        recentEvents,
        monthlyTrend
      };
    },
    enabled: !!memberId && !!regionId
  });
};

/**
 * Global variant of useAttendanceHistoryWithMemberTypes — returns processed
 * attendance rows across ALL regions (no region_id filter). Used by the
 * Super Admin Global Events page to compute KPIs aggregated globally.
 *
 * Returns the same row shape as useAttendanceHistoryWithMemberTypes so the
 * Super Events page can reuse the same KPI math the Regional Events page
 * uses.
 */
export const useGlobalAttendanceHistoryWithMemberTypes = () => {
  return useQuery({
    queryKey: ['attendance_history_with_types', 'global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance_events')
        .select(`
          id,
          name,
          event_date,
          dcg_id,
          source_event_id,
          attendance_records!inner (
            is_present,
            members!inner (
              id,
              member_type,
              profiles (
                date_of_birth
              )
            )
          )
        `)
        .order('event_date', { ascending: false });

      if (error) throw error;

      const memberIds = new Set<string>();
      const dobByMemberId = new Map<string, string | null | undefined>();
      data?.forEach(event => {
        (event.attendance_records || []).forEach((r: any) => {
          if (r.members?.id) {
            memberIds.add(r.members.id);
            dobByMemberId.set(r.members.id, r.members?.profiles?.date_of_birth ?? null);
          }
        });
      });

      let relationships: Array<{ member_id: string; related_member_id: string }> = [];
      const adultDobLookup = new Map<string, string | null | undefined>(dobByMemberId);
      if (memberIds.size > 0) {
        const ids = Array.from(memberIds);
        relationships = await fetchMemberRelationshipsForMembers(ids);
        const referenced = new Set<string>();
        relationships.forEach(r => {
          referenced.add(r.member_id);
          referenced.add(r.related_member_id);
        });
        const missing = Array.from(referenced).filter(id => !adultDobLookup.has(id));
        if (missing.length > 0) {
          const { data: extraMembers } = await supabase
            .from('members')
            .select('id, profiles:profile_id(date_of_birth)')
            .in('id', missing);
          (extraMembers || []).forEach((m: any) => {
            adultDobLookup.set(m.id, m.profiles?.date_of_birth ?? null);
          });
        }
      }

      const checkIsChild = (record: any) => {
        const dob = record.members?.profiles?.date_of_birth;
        const memberId = record.members?.id;
        if (!dob || !memberId) return false;
        return isChildMember(dob, memberId, relationships, adultDobLookup);
      };

      const processedData = data?.map(event => {
        const records = event.attendance_records || [];
        const childrenPresent = records.filter(r => r.is_present && checkIsChild(r)).length;
        const childrenAbsent = records.filter(r => !r.is_present && checkIsChild(r)).length;
        const membersPresent = records.filter(r => r.is_present && r.members?.member_type === 'member' && !checkIsChild(r)).length;
        const visitorsPresent = records.filter(r => r.is_present && r.members?.member_type === 'visitor' && !checkIsChild(r)).length;
        const membersAbsent = records.filter(r => !r.is_present && r.members?.member_type === 'member' && !checkIsChild(r)).length;
        const visitorsAbsent = records.filter(r => !r.is_present && r.members?.member_type === 'visitor' && !checkIsChild(r)).length;
        return {
          event_id: event.id,
          event_name: event.name,
          event_date: event.event_date,
          dcg_id: event.dcg_id || null,
          source_event_id: event.source_event_id || null,
          members_present: membersPresent,
          visitors_present: visitorsPresent,
          children_present: childrenPresent,
          members_absent: membersAbsent,
          visitors_absent: visitorsAbsent,
          children_absent: childrenAbsent,
          total_present: membersPresent + visitorsPresent + childrenPresent,
          total_absent: membersAbsent + visitorsAbsent + childrenAbsent,
          date: new Date(event.event_date).toLocaleDateString(),
        };
      }) || [];

      return processedData;
    },
  });
};
