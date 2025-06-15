
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, format, startOfYear } from 'date-fns';

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
        .select('region_id, created_at');
      if (membersByRegionError) throw membersByRegionError;
      
      const { data: dcgsByRegion, error: dcgsByRegionError } = await supabase
        .from('dcgs')
        .select('region_id');
      if (dcgsByRegionError) throw dcgsByRegionError;
      
      const regionalData = (regions || []).map(region => {
          const members = (membersByRegion || []).filter(m => m.region_id === region.id);
          const quarterAgo = subMonths(new Date(), 3);
          const newMembersLastQuarter = members.filter(m => m.created_at && new Date(m.created_at) > quarterAgo).length;
          const totalMembersInRegion = members.length;
          const previousMemberCount = totalMembersInRegion - newMembersLastQuarter;
          const growth = previousMemberCount > 0 ? (newMembersLastQuarter / previousMemberCount) * 100 : (newMembersLastQuarter > 0 ? 100 : 0);

          const giving = (financialDataYear || [])
            .filter(t => t.region_id === region.id && t.category?.type === 'Income')
            .reduce((sum, t) => sum + t.amount, 0);

          return {
              id: region.id,
              name: region.name,
              members: totalMembersInRegion,
              growth: isNaN(growth) || !isFinite(growth) ? 0 : growth,
              dcgs: (dcgsByRegion || []).filter(d => d.region_id === region.id).length,
              giving: giving
          }
      });

      return {
        kpis: {
          totalMembers: totalMembers ?? 0,
          newMembersLast30Days: newMembersLast30Days ?? 0,
          totalDcgs: totalDcgs ?? 0,
          totalRegions: totalRegions ?? 0,
          totalIncomeYTD: totalIncomeYTD
        },
        regionalData
      };
    },
  });
};
