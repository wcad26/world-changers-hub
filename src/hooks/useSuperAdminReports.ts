
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfYear, subDays } from 'date-fns';

export const useSuperAdminReports = () => {
  return useQuery({
    queryKey: ['superAdminReports'],
    queryFn: async () => {
      // --- Global KPIs ---

      // Total Members
      const { count: totalMembers, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      if (membersError) throw membersError;

      // New Members (last 30 days)
      const oneMonthAgo = subMonths(new Date(), 1).toISOString();
      const { count: newMembersLast30Days, error: newMembersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneMonthAgo);
      if (newMembersError) throw newMembersError;

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

      // --- Financial Data ---
      const now = new Date();
      const yearStart = startOfYear(now);
      const { data: financialDataYear, error: financialYearError } = await supabase
        .from('financial_transactions')
        .select('amount, category:financial_transaction_categories(name, type), region_id')
        .gte('transaction_date', format(yearStart, 'yyyy-MM-dd'));
      if (financialYearError) throw financialYearError;

      let totalIncomeYTD = 0;
      (financialDataYear || []).forEach(t => {
        if (t.category?.type === 'Income') {
          totalIncomeYTD += t.amount;
        }
      });
      
      // --- Regional Overview Data ---
      const { data: regions, error: regionsDataError } = await supabase
        .from('regions')
        .select('id, name');
      if (regionsDataError) throw regionsDataError;
      
      const { data: membersByRegion, error: membersByRegionError } = await supabase
        .from('members')
        .select('id, region_id, created_at, member_type');
      if (membersByRegionError) throw membersByRegionError;
      
      const { data: dcgsByRegion, error: dcgsByRegionError } = await supabase
        .from('dcgs')
        .select('id, region_id');
      if (dcgsByRegionError) throw dcgsByRegionError;
      
      // Fetch regional attendance events (dcg_id IS NULL) for last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: regionalAttendanceEvents, error: regionalAttendanceEventsError } = await supabase
        .from('attendance_events')
        .select('id, region_id, event_date')
        .is('dcg_id', null)
        .gte('event_date', format(thirtyDaysAgo, 'yyyy-MM-dd'));
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
          
          // Calculate YTD growth (from start of year) - only for members
          const yearStart = startOfYear(now);
          const newMembersYTD = members.filter(m => m.created_at && new Date(m.created_at) >= yearStart).length;
          const totalMembers = members.length;
          const previousMemberCount = totalMembers - newMembersYTD;
          const ytdGrowth = previousMemberCount > 0 ? (newMembersYTD / previousMemberCount) * 100 : (newMembersYTD > 0 ? 100 : 0);

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
              ytdGrowth: isNaN(ytdGrowth) || !isFinite(ytdGrowth) ? 0 : ytdGrowth
          }
      });
      
      // --- DCG Regional Overview Data ---
      const { data: dcgMembersData, error: dcgMembersError } = await supabase
        .from('dcg_members')
        .select('id, member_id, dcg_id, created_at, is_active, dcgs(region_id)');
      if (dcgMembersError) throw dcgMembersError;
      
      // Get attendance events for last month (DCG only)
      const lastMonth = subDays(new Date(), 30);
      const { data: dcgAttendanceEvents, error: dcgAttendanceEventsError } = await supabase
        .from('attendance_events')
        .select('id, dcg_id, event_date')
        .not('dcg_id', 'is', null)
        .gte('event_date', format(lastMonth, 'yyyy-MM-dd'));
      if (dcgAttendanceEventsError) throw dcgAttendanceEventsError;
      
      // Get attendance records for those events
      const eventIds = (dcgAttendanceEvents || []).map(e => e.id);
      let attendanceRecords: any[] = [];
      if (eventIds.length > 0) {
        const { data: records, error: recordsError } = await supabase
          .from('attendance_records')
          .select('event_id, member_id, is_present')
          .in('event_id', eventIds);
        if (recordsError) throw recordsError;
        attendanceRecords = records || [];
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
            const record = attendanceRecords.find(
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
        
        // Calculate YTD growth for DCG members
        const yearStart = startOfYear(now);
        const newDcgMembersYTD = regionDcgMembers.filter(
          dm => dm.created_at && new Date(dm.created_at) >= yearStart
        ).length;
        const previousDcgMemberCount = totalDcgMembers - newDcgMembersYTD;
        const dcgYtdGrowth = previousDcgMemberCount > 0 
          ? (newDcgMembersYTD / previousDcgMemberCount) * 100 
          : (newDcgMembersYTD > 0 ? 100 : 0);
        
        return {
          id: region.id,
          name: region.name,
          dcgCount: (dcgsByRegion || []).filter(d => d.region_id === region.id).length,
          dcgMembers: totalDcgMembers,
          activePercentage: isNaN(activePercentage) || !isFinite(activePercentage) ? 0 : activePercentage,
          ytdGrowth: isNaN(dcgYtdGrowth) || !isFinite(dcgYtdGrowth) ? 0 : dcgYtdGrowth
        };
      });

      return {
        kpis: {
          totalMembers: totalMembers ?? 0,
          newMembersLast30Days: newMembersLast30Days ?? 0,
          totalDcgs: totalDcgs ?? 0,
          totalRegions: totalRegions ?? 0,
          totalIncomeYTD: totalIncomeYTD
        },
        regionalData,
        regionalDcgData
      };
    },
  });
};
