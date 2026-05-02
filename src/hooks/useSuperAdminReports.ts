
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfYear, subDays } from 'date-fns';
import { buildChildrenSet } from '@/utils/childUtils';

interface TimeFrameParams {
  startDate: Date;
  endDate: Date;
}

export const useSuperAdminReports = (timeFrame?: TimeFrameParams) => {
  return useQuery({
    queryKey: ['superAdminReports', timeFrame?.startDate?.toISOString(), timeFrame?.endDate?.toISOString()],
    queryFn: async () => {
      // Define date range (default to YTD)
      const startDate = timeFrame?.startDate ?? startOfYear(new Date());
      const endDate = timeFrame?.endDate ?? new Date();
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      // --- Global KPIs ---
      // Fetch ALL members + relationships once so we can apply the strict child rule globally
      const { data: allMembersRaw, error: allMembersError } = await supabase
        .from('members')
        .select('id, region_id, created_at, member_type, profiles:profile_id(date_of_birth)');
      if (allMembersError) throw allMembersError;

      const { data: allRelationshipsRaw } = await supabase
        .from('member_relationships' as any)
        .select('member_id, related_member_id');
      const allRelationships = (allRelationshipsRaw as any[]) || [];

      const globalChildrenSet = buildChildrenSet(allMembersRaw || [], allRelationships);

      const globalAdults = (allMembersRaw || []).filter(m => !globalChildrenSet.has(m.id));
      const totalMembers = globalAdults.filter(m => m.member_type === 'member').length;
      const totalVisitors = globalAdults.filter(m => m.member_type === 'visitor').length;
      const totalChildren = globalChildrenSet.size;

      // New Members (within selected period, excluding children)
      const newMembersInPeriod = globalAdults.filter(
        m => m.member_type === 'member' &&
          m.created_at &&
          new Date(m.created_at) >= startDate &&
          new Date(m.created_at) <= endDate
      ).length;

      // Total DCGs
      const { count: totalDcgs, error: dcgsError } = await supabase
        .from('dcgs')
        .select('*', { count: 'exact', head: true });
      if (dcgsError) throw dcgsError;
      
      // Total Regions
      const { count: totalRegions, error: regionsError } = await supabase
        .from('regions')
        .select('*', { count: 'exact', head: true });
      if (regionsError) throw regionsError;

      // Calculate Member Growth Percentage (for selected period)
      const previousMemberCount = totalMembers - newMembersInPeriod;
      const memberGrowthPercentage = previousMemberCount > 0 
        ? (newMembersInPeriod / previousMemberCount) * 100 
        : newMembersInPeriod > 0 ? 100 : 0;
      
      // --- Regional Overview Data ---
      const { data: regions, error: regionsDataError } = await supabase
        .from('regions')
        .select('id, name');
      if (regionsDataError) throw regionsDataError;

      // Reuse the already-fetched member list for per-region breakdown
      const membersByRegion = allMembersRaw || [];
      
      const { data: dcgsByRegion, error: dcgsByRegionError } = await supabase
        .from('dcgs')
        .select('id, region_id');
      if (dcgsByRegionError) throw dcgsByRegionError;
      
      // Fetch regional attendance events (dcg_id IS NULL) for selected period
      const { data: regionalAttendanceEvents, error: regionalAttendanceEventsError } = await supabase
        .from('attendance_events')
        .select('id, region_id, event_date')
        .is('dcg_id', null)
        .gte('event_date', startDateStr)
        .lte('event_date', endDateStr);
      if (regionalAttendanceEventsError) throw regionalAttendanceEventsError;
      
      // Get attendance records for regional events
      const regionalEventIds = (regionalAttendanceEvents || []).map(e => e.id);
      let regionalAttendanceRecords: any[] = [];
      if (regionalEventIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('attendance_records')
          .select('event_id, member_id, is_present')
          .in('event_id', regionalEventIds);
        if (recordsError) throw recordsError;
        regionalAttendanceRecords = records || [];
      }
      
      const regionalData = (regions || []).map(region => {
          const allMembers = (membersByRegion || []).filter(m => m.region_id === region.id);
          
          // Filter by member_type
          const members = allMembers.filter(m => m.member_type === 'member');
          const visitors = allMembers.filter(m => m.member_type === 'visitor');
          
          // Calculate growth for selected period - only for members
          const newMembersInPeriod = members.filter(m => m.created_at && new Date(m.created_at) >= startDate && new Date(m.created_at) <= endDate).length;
          const totalMembers = members.length;
          const previousMemberCount = totalMembers - newMembersInPeriod;
          const periodGrowth = previousMemberCount > 0 ? (newMembersInPeriod / previousMemberCount) * 100 : (newMembersInPeriod > 0 ? 100 : 0);

          // Calculate active percentage based on regional events
          const regionEvents = (regionalAttendanceEvents || []).filter(e => e.region_id === region.id);
          let activeMembersCount = 0;
          
          members.forEach(member => {
            // Count absences for this member in regional events
            let absenceCount = 0;
            regionEvents.forEach(event => {
              const record = regionalAttendanceRecords.find(
                r => r.event_id === event.id && r.member_id === member.id
              );
              // If no record exists OR is_present is false, count as absence
              if (!record || record.is_present === false) {
                absenceCount++;
              }
            });
            
            // If less than 3 absences, member is active
            if (absenceCount < 3) {
              activeMembersCount++;
            }
          });
          
          const activePercentage = totalMembers > 0 ? (activeMembersCount / totalMembers) * 100 : 0;

          return {
              id: region.id,
              name: region.name,
              members: totalMembers,
              visitors: visitors.length,
              activePercentage: isNaN(activePercentage) || !isFinite(activePercentage) ? 0 : activePercentage,
              periodGrowth: isNaN(periodGrowth) || !isFinite(periodGrowth) ? 0 : periodGrowth
          }
      });
      
      // --- DCG Regional Overview Data ---
      const { data: dcgMembersData, error: dcgMembersError } = await supabase
        .from('dcg_members')
        .select('id, member_id, dcg_id, created_at, is_active, dcgs(region_id)');
      if (dcgMembersError) throw dcgMembersError;
      
      // Get attendance events for selected period (DCG only)
      const { data: dcgAttendanceEvents, error: dcgAttendanceEventsError } = await supabase
        .from('attendance_events')
        .select('id, dcg_id, event_date')
        .not('dcg_id', 'is', null)
        .gte('event_date', startDateStr)
        .lte('event_date', endDateStr);
      if (dcgAttendanceEventsError) throw dcgAttendanceEventsError;
      
      // Get attendance records for those events
      const eventIds = (dcgAttendanceEvents || []).map(e => e.id);
      let dcgAttendanceRecords: any[] = [];
      if (eventIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('attendance_records')
          .select('event_id, member_id, is_present')
          .in('event_id', eventIds);
        if (recordsError) throw recordsError;
        dcgAttendanceRecords = records || [];
      }
      
      const regionalDcgData = (regions || []).map(region => {
        // Get DCG members for this region
        const regionDcgMembers = (dcgMembersData || []).filter(
          dm => dm.is_active && dm.dcgs?.region_id === region.id
        );
        
        const totalDcgMembers = regionDcgMembers.length;
        
        // Calculate active members (< 3 absences in last month)
        let activeMembersCount = 0;
        regionDcgMembers.forEach(dcgMember => {
          // Get attendance events for DCGs in this region
          const regionDcgIds = (dcgsByRegion || [])
            .filter(d => d.region_id === region.id)
            .map(d => d.id);
          
          const memberEvents = (dcgAttendanceEvents || []).filter(
            e => regionDcgIds.includes(e.dcg_id)
          );
          
          // Count absences for this member
          let absenceCount = 0;
          memberEvents.forEach(event => {
            const record = dcgAttendanceRecords.find(
              r => r.event_id === event.id && r.member_id === dcgMember.member_id
            );
            if (record && record.is_present === false) {
              absenceCount++;
            }
          });
          
          // If less than 3 absences, member is active
          if (absenceCount < 3) {
            activeMembersCount++;
          }
        });
        
        const activePercentage = totalDcgMembers > 0 ? (activeMembersCount / totalDcgMembers) * 100 : 0;
        
        // Calculate growth for selected period for DCG members
        const newDcgMembersInPeriod = regionDcgMembers.filter(
          dm => dm.created_at && new Date(dm.created_at) >= startDate && new Date(dm.created_at) <= endDate
        ).length;
        const previousDcgMemberCount = totalDcgMembers - newDcgMembersInPeriod;
        const dcgPeriodGrowth = previousDcgMemberCount > 0 
          ? (newDcgMembersInPeriod / previousDcgMemberCount) * 100 
          : (newDcgMembersInPeriod > 0 ? 100 : 0);
        
        return {
          id: region.id,
          name: region.name,
          dcgCount: (dcgsByRegion || []).filter(d => d.region_id === region.id).length,
          dcgMembers: totalDcgMembers,
          activePercentage: isNaN(activePercentage) || !isFinite(activePercentage) ? 0 : activePercentage,
          periodGrowth: isNaN(dcgPeriodGrowth) || !isFinite(dcgPeriodGrowth) ? 0 : dcgPeriodGrowth
        };
      });

      // Calculate Global Active Percentage
      const totalActiveMembers = regionalData.reduce((sum, region) => {
        const activeCount = Math.round((region.activePercentage / 100) * region.members);
        return sum + activeCount;
      }, 0);

      const globalActivePercentage = (totalMembers ?? 0) > 0 
        ? (totalActiveMembers / (totalMembers ?? 0)) * 100 
        : 0;

      // --- Regional Events Data ---
      // Fetch events (excluding DCG events and special events) within time frame
      const { data: eventsData, error: eventsDataError } = await supabase
        .from('events')
        .select('id, region_id, capacity, attendance_target, start_datetime, is_special')
        .is('dcg_id', null)
        .eq('is_special', false)
        .gte('start_datetime', startDateStr)
        .lte('start_datetime', endDateStr);

      if (eventsDataError) throw eventsDataError;

      // Fetch attendance events with their records
      const { data: eventAttendance } = await supabase
        .from('attendance_events')
        .select('source_event_id, id')
        .not('source_event_id', 'is', null);

      // Count attendance for each event
      const { data: attendanceRecords } = await supabase
        .from('attendance_records')
        .select('event_id, is_present')
        .eq('is_present', true);

      // Calculate per-region aggregates with averages
      const regionalEventsData = regions.map(region => {
        const regionEvents = eventsData?.filter(e => 
          e.region_id === region.id && 
          new Date(e.start_datetime) < new Date()
        ) || [];
        
        const eventCount = regionEvents.length;
        
        let totalTarget = 0;
        let totalAttendance = 0;
        let eventsWithTargets = 0;
        
        regionEvents.forEach(event => {
          const target = event.attendance_target || event.capacity || 0;
          if (target > 0) {
            totalTarget += target;
            eventsWithTargets++;
          }
          
          // Calculate attendance from linked attendance_events
          const linkedAttendanceEvents = eventAttendance?.filter(ae => ae.source_event_id === event.id) || [];
          linkedAttendanceEvents.forEach(ae => {
            const count = attendanceRecords?.filter(ar => ar.event_id === ae.id).length || 0;
            totalAttendance += count;
          });
        });
        
        const avgTarget = eventsWithTargets > 0 ? Math.round(totalTarget / eventsWithTargets) : 0;
        const avgAttendance = eventCount > 0 ? Math.round(totalAttendance / eventCount) : 0;
        const performance = avgTarget > 0 ? (avgAttendance / avgTarget) * 100 : 0;
        
        return {
          id: region.id,
          name: region.name,
          eventCount,
          avgTarget,
          avgAttendance,
          performance
        };
      });

      return {
        kpis: {
          totalMembers: totalMembers ?? 0,
          totalVisitors: totalVisitors ?? 0,
          newMembersInPeriod: newMembersInPeriod ?? 0,
          memberGrowthPercentage: isNaN(memberGrowthPercentage) || !isFinite(memberGrowthPercentage) ? 0 : memberGrowthPercentage,
          globalActivePercentage: isNaN(globalActivePercentage) || !isFinite(globalActivePercentage) ? 0 : globalActivePercentage,
          totalDcgs: totalDcgs ?? 0,
          totalRegions: totalRegions ?? 0
        },
        regionalData,
        regionalDcgData,
        regionalEventsData,
      };
    },
  });
};
