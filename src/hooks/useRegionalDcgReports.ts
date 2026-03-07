import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRegionCurrency } from './useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { format, subMonths } from 'date-fns';

export interface DcgReportData {
  dcgId: string;
  dcgName: string;
  leaderName: string;
  memberCount: number;
  totalEvents: number;
  totalPresent: number;
  totalRecords: number;
  attendanceRate: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  memberGrowth: number; // new members in period
}

export interface DcgReportTrendPoint {
  month: string;
  monthLabel: string;
  attendanceRate: number;
  totalPresent: number;
  totalMembers: number;
  income: number;
  expenses: number;
}

export interface DcgReportSummary {
  totalDcgs: number;
  totalMembers: number;
  avgAttendanceRate: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  memberGrowthRate: number;
  dcgBreakdown: DcgReportData[];
  trendData: DcgReportTrendPoint[];
}

interface DcgReportFilters {
  dcgId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const useRegionalDcgReports = (filters?: DcgReportFilters) => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['regional-dcg-reports', regionId, filters?.dcgId, filters?.startDate?.toISOString(), filters?.endDate?.toISOString()],
    queryFn: async (): Promise<DcgReportSummary> => {
      if (!regionId) throw new Error('No region found');

      const endDate = filters?.endDate || new Date();
      const startDate = filters?.startDate || subMonths(endDate, 6);
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // 1. Get DCGs
      let dcgQuery = supabase
        .from('dcgs')
        .select('id, name, leader_id, leader:leader_id(profiles:profiles(first_name, last_name))')
        .eq('region_id', regionId);
      
      if (filters?.dcgId) {
        dcgQuery = dcgQuery.eq('id', filters.dcgId);
      }

      const { data: dcgs, error: dcgError } = await dcgQuery;
      if (dcgError) throw dcgError;

      const dcgIds = (dcgs || []).map(d => d.id);
      if (dcgIds.length === 0) {
        return {
          totalDcgs: 0, totalMembers: 0, avgAttendanceRate: 0,
          totalIncome: 0, totalExpenses: 0, netBalance: 0,
          memberGrowthRate: 0, dcgBreakdown: [], trendData: [],
        };
      }

      // 2. Get DCG members
      const { data: dcgMembers, error: membersError } = await supabase
        .from('dcg_members')
        .select('id, dcg_id, member_id, is_active, created_at')
        .in('dcg_id', dcgIds);
      if (membersError) throw membersError;

      // 3. Get attendance events for these DCGs
      const { data: attEvents, error: attEventsError } = await supabase
        .from('attendance_events')
        .select('id, dcg_id, event_date')
        .in('dcg_id', dcgIds)
        .gte('event_date', startStr)
        .lte('event_date', endStr);
      if (attEventsError) throw attEventsError;

      // 4. Get attendance records
      const eventIds = (attEvents || []).map(e => e.id);
      let attRecords: any[] = [];
      if (eventIds.length > 0) {
        const { data: records, error: recError } = await supabase
          .from('attendance_records')
          .select('event_id, member_id, is_present')
          .in('event_id', eventIds);
        if (recError) throw recError;
        attRecords = records || [];
      }

      // 5. Get financial transactions for these DCGs
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select('id, dcg_id, amount, transaction_date, category:financial_transaction_categories(type)')
        .eq('region_id', regionId)
        .in('dcg_id', dcgIds)
        .gte('transaction_date', startStr)
        .lte('transaction_date', endStr);
      if (txError) throw txError;

      // 6. Build per-DCG breakdown
      const dcgBreakdown: DcgReportData[] = (dcgs || []).map(dcg => {
        const members = (dcgMembers || []).filter(m => m.dcg_id === dcg.id && m.is_active);
        const events = (attEvents || []).filter(e => e.dcg_id === dcg.id);
        const eIds = events.map(e => e.id);
        const records = attRecords.filter(r => eIds.includes(r.event_id));
        const present = records.filter(r => r.is_present).length;
        const totalRec = records.length;

        const dcgTxs = (transactions || []).filter(t => t.dcg_id === dcg.id);
        const income = dcgTxs
          .filter(t => t.category?.type?.toLowerCase() === 'income')
          .reduce((s, t) => s + Number(t.amount), 0);
        const expenses = dcgTxs
          .filter(t => t.category?.type?.toLowerCase() === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);

        const newMembers = (dcgMembers || []).filter(
          m => m.dcg_id === dcg.id && m.created_at && new Date(m.created_at) >= startDate && new Date(m.created_at) <= endDate
        ).length;

        const leader = (dcg as any).leader?.profiles;
        const leaderName = leader
          ? `${leader.last_name || ''} ${leader.first_name || ''}`.trim()
          : 'No leader';

        return {
          dcgId: dcg.id,
          dcgName: dcg.name,
          leaderName,
          memberCount: members.length,
          totalEvents: events.length,
          totalPresent: present,
          totalRecords: totalRec,
          attendanceRate: totalRec > 0 ? (present / totalRec) * 100 : 0,
          totalIncome: income,
          totalExpenses: expenses,
          netBalance: income - expenses,
          memberGrowth: newMembers,
        };
      });

      // 7. Build trend data (last 6 months)
      const trendData: DcgReportTrendPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(endDate, i);
        const monthStr = format(monthDate, 'yyyy-MM');
        const monthLabel = format(monthDate, 'MMM yyyy');

        const monthEvents = (attEvents || []).filter(e => e.event_date.startsWith(monthStr));
        const monthEventIds = monthEvents.map(e => e.id);
        const monthRecords = attRecords.filter(r => monthEventIds.includes(r.event_id));
        const monthPresent = monthRecords.filter(r => r.is_present).length;
        const monthTotal = monthRecords.length;

        const monthTxs = (transactions || []).filter(t => t.transaction_date.startsWith(monthStr));
        const monthIncome = monthTxs
          .filter(t => t.category?.type?.toLowerCase() === 'income')
          .reduce((s, t) => s + Number(t.amount), 0);
        const monthExpenses = monthTxs
          .filter(t => t.category?.type?.toLowerCase() === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);

        trendData.push({
          month: monthStr,
          monthLabel,
          attendanceRate: monthTotal > 0 ? (monthPresent / monthTotal) * 100 : 0,
          totalPresent: monthPresent,
          totalMembers: monthTotal,
          income: monthIncome,
          expenses: monthExpenses,
        });
      }

      // 8. Aggregates
      const totalMembers = dcgBreakdown.reduce((s, d) => s + d.memberCount, 0);
      const totalIncome = dcgBreakdown.reduce((s, d) => s + d.totalIncome, 0);
      const totalExpenses = dcgBreakdown.reduce((s, d) => s + d.totalExpenses, 0);
      const totalPresent = dcgBreakdown.reduce((s, d) => s + d.totalPresent, 0);
      const totalRecords = dcgBreakdown.reduce((s, d) => s + d.totalRecords, 0);
      const avgAttendanceRate = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
      const totalNewMembers = dcgBreakdown.reduce((s, d) => s + d.memberGrowth, 0);
      const previousMembers = totalMembers - totalNewMembers;
      const memberGrowthRate = previousMembers > 0 ? (totalNewMembers / previousMembers) * 100 : totalNewMembers > 0 ? 100 : 0;

      return {
        totalDcgs: dcgBreakdown.length,
        totalMembers,
        avgAttendanceRate,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        memberGrowthRate,
        dcgBreakdown,
        trendData,
      };
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000,
  });
};

// Super admin version - fetches across all regions
export const useGlobalDcgReports = (filters?: { startDate?: Date; endDate?: Date }) => {
  return useQuery({
    queryKey: ['global-dcg-reports', filters?.startDate?.toISOString(), filters?.endDate?.toISOString()],
    queryFn: async () => {
      const endDate = filters?.endDate || new Date();
      const startDate = filters?.startDate || subMonths(endDate, 6);
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Get all regions
      const { data: regions, error: regError } = await supabase
        .from('regions')
        .select('id, name, currency_code');
      if (regError) throw regError;

      // Get all DCGs
      const { data: allDcgs, error: dcgError } = await supabase
        .from('dcgs')
        .select('id, name, region_id, is_active');
      if (dcgError) throw dcgError;

      // Get all DCG members
      const { data: allDcgMembers, error: memError } = await supabase
        .from('dcg_members')
        .select('dcg_id, is_active, created_at');
      if (memError) throw memError;

      // Get DCG attendance events in range
      const { data: attEvents, error: attError } = await supabase
        .from('attendance_events')
        .select('id, dcg_id, event_date')
        .not('dcg_id', 'is', null)
        .gte('event_date', startStr)
        .lte('event_date', endStr);
      if (attError) throw attError;

      // Get attendance records
      const eventIds = (attEvents || []).map(e => e.id);
      let attRecords: any[] = [];
      if (eventIds.length > 0) {
        const { data: records, error: recError } = await supabase
          .from('attendance_records')
          .select('event_id, is_present')
          .in('event_id', eventIds);
        if (recError) throw recError;
        attRecords = records || [];
      }

      // Get DCG financial transactions
      const { data: transactions, error: txError } = await supabase
        .from('financial_transactions')
        .select('dcg_id, amount, transaction_date, region_id, category:financial_transaction_categories(type)')
        .not('dcg_id', 'is', null)
        .gte('transaction_date', startStr)
        .lte('transaction_date', endStr);
      if (txError) throw txError;

      // Build per-region summary with DCG drill-down
      const regionSummaries = (regions || []).map(region => {
        const regionDcgs = (allDcgs || []).filter(d => d.region_id === region.id);
        const regionDcgIds = regionDcgs.map(d => d.id);

        const regionMembers = (allDcgMembers || []).filter(m => regionDcgIds.includes(m.dcg_id) && m.is_active);
        const regionEvents = (attEvents || []).filter(e => regionDcgIds.includes(e.dcg_id!));
        const regionEventIds = regionEvents.map(e => e.id);
        const regionRecords = attRecords.filter(r => regionEventIds.includes(r.event_id));
        const regionPresent = regionRecords.filter(r => r.is_present).length;
        const regionTotalRec = regionRecords.length;

        const regionTxs = (transactions || []).filter(t => regionDcgIds.includes(t.dcg_id!));
        const regionIncome = regionTxs.filter(t => t.category?.type?.toLowerCase() === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const regionExpenses = regionTxs.filter(t => t.category?.type?.toLowerCase() === 'expense').reduce((s, t) => s + Number(t.amount), 0);

        // Per-DCG breakdown within region
        const dcgDetails = regionDcgs.map(dcg => {
          const members = (allDcgMembers || []).filter(m => m.dcg_id === dcg.id && m.is_active);
          const events = regionEvents.filter(e => e.dcg_id === dcg.id);
          const eIds = events.map(e => e.id);
          const records = attRecords.filter(r => eIds.includes(r.event_id));
          const present = records.filter(r => r.is_present).length;
          const total = records.length;

          const dcgTxs = regionTxs.filter(t => t.dcg_id === dcg.id);
          const income = dcgTxs.filter(t => t.category?.type?.toLowerCase() === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const expenses = dcgTxs.filter(t => t.category?.type?.toLowerCase() === 'expense').reduce((s, t) => s + Number(t.amount), 0);

          return {
            dcgId: dcg.id,
            dcgName: dcg.name,
            isActive: dcg.is_active,
            memberCount: members.length,
            attendanceRate: total > 0 ? (present / total) * 100 : 0,
            totalIncome: income,
            totalExpenses: expenses,
            netBalance: income - expenses,
          };
        });

        return {
          regionId: region.id,
          regionName: region.name,
          currencyCode: region.currency_code,
          dcgCount: regionDcgs.length,
          totalMembers: regionMembers.length,
          attendanceRate: regionTotalRec > 0 ? (regionPresent / regionTotalRec) * 100 : 0,
          totalIncome: regionIncome,
          totalExpenses: regionExpenses,
          netBalance: regionIncome - regionExpenses,
          dcgDetails,
        };
      });

      // Global aggregates
      const globalDcgs = regionSummaries.reduce((s, r) => s + r.dcgCount, 0);
      const globalMembers = regionSummaries.reduce((s, r) => s + r.totalMembers, 0);
      const globalPresent = attRecords.filter(r => r.is_present).length;
      const globalTotal = attRecords.length;
      const globalAttendanceRate = globalTotal > 0 ? (globalPresent / globalTotal) * 100 : 0;
      const globalIncome = regionSummaries.reduce((s, r) => s + r.totalIncome, 0);
      const globalExpenses = regionSummaries.reduce((s, r) => s + r.totalExpenses, 0);

      return {
        globalSummary: {
          totalDcgs: globalDcgs,
          totalMembers: globalMembers,
          attendanceRate: globalAttendanceRate,
          totalIncome: globalIncome,
          totalExpenses: globalExpenses,
          netBalance: globalIncome - globalExpenses,
        },
        regionSummaries,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};
