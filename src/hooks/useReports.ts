
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subMonths, format, parseISO, differenceInYears, startOfYear, startOfMonth, subQuarters } from 'date-fns';
import { buildChildrenSet } from '@/utils/childUtils';

export const useRegionalReports = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['regionalReports', regionId],
    queryFn: async () => {
      if (!regionId) return null;

      // Fetch members + DOB for child rule and member_type breakdown
      const { data: regionMembers, error: membersError } = await supabase
        .from('members')
        .select('id, member_type, created_at, profiles:profile_id(date_of_birth)')
        .eq('region_id', regionId);
      if (membersError) throw membersError;

      // Fetch relationships for these members so we can apply the strict child rule
      const memberIdList = (regionMembers || []).map(m => m.id);
      let regionRelationships: Array<{ member_id: string; related_member_id: string }> = [];
      if (memberIdList.length > 0) {
        const { data: relData } = await supabase
          .from('member_relationships' as any)
          .select('member_id, related_member_id')
          .or(`member_id.in.(${memberIdList.join(',')}),related_member_id.in.(${memberIdList.join(',')})`);
        regionRelationships = (relData as any[]) || [];
      }

      const childrenSet = buildChildrenSet(regionMembers || [], regionRelationships);
      const adultMembersList = (regionMembers || []).filter(m => !childrenSet.has(m.id) && m.member_type === 'member');
      const adultVisitorsList = (regionMembers || []).filter(m => !childrenSet.has(m.id) && m.member_type === 'visitor');
      const totalMembers = adultMembersList.length;
      const totalVisitors = adultVisitorsList.length;
      const totalChildren = childrenSet.size;

      // KPI: New Members (last 30 days, excluding children)
      const oneMonthAgo = subMonths(new Date(), 1);
      const newMembersLast30Days = adultMembersList.filter(
        m => m.created_at && new Date(m.created_at) >= oneMonthAgo
      ).length;

      // KPI: Total DCGs
      const { count: totalDcgs, error: dcgsError } = await supabase
        .from('dcgs')
        .select('*', { count: 'exact', head: true })
        .eq('region_id', regionId);
      if (dcgsError) throw dcgsError;

      // Fetch financial data for the whole year
      const now = new Date();
      const yearStart = startOfYear(now);
      const { data: financialDataYear, error: financialYearError } = await supabase
        .from('financial_transactions')
        .select('amount, transaction_date, description, category:financial_transaction_categories(name, type), dcg_id')
        .eq('region_id', regionId)
        .gte('transaction_date', format(yearStart, 'yyyy-MM-dd'));

      if (financialYearError) throw financialYearError;

      // -- YTD Financials & Distribution --
      let totalIncomeYTD = 0;
      let totalExpensesYTD = 0;
      const incomeDistributionYTD: Record<string, number> = {};
      const expenseDistributionYTD: Record<string, number> = {};

      (financialDataYear || []).forEach(t => {
        const categoryName = t.category?.name || 'Uncategorized';
        if (t.category?.type === 'Income') {
          totalIncomeYTD += t.amount;
          incomeDistributionYTD[categoryName] = (incomeDistributionYTD[categoryName] || 0) + t.amount;
        } else if (t.category?.type === 'Expense') {
          totalExpensesYTD += t.amount;
          expenseDistributionYTD[categoryName] = (expenseDistributionYTD[categoryName] || 0) + t.amount;
        }
      });
      const currentBalance = totalIncomeYTD - totalExpensesYTD;
      const incomeDistributionChartData = Object.entries(incomeDistributionYTD).map(([category, value]) => ({ category, value }));
      const expenseDistributionChartData = Object.entries(expenseDistributionYTD).map(([category, value]) => ({ category, value }));

      const financialChartDataByMonth = (financialDataYear || []).reduce((acc, transaction) => {
          if (!transaction.transaction_date || transaction.category?.type !== 'Income') return acc;
          const month = format(new Date(transaction.transaction_date), 'MMM');
          const categoryName = transaction.category?.name || 'Other Income';

          if (!acc[month]) {
              acc[month] = { month };
          }
          acc[month][categoryName] = (acc[month][categoryName] || 0) + transaction.amount;
          return acc;
      }, {} as Record<string, { month: string; [key: string]: any }>);

      const financialChartData = Object.values(financialChartDataByMonth);
      const financialChartCategories = Array.from(new Set(financialDataYear?.filter(t => t.category?.type === 'Income' && t.category.name).map(t => t.category!.name) || [])).sort();
      
      // -- This/Last Month Financial Summary --
      const thisMonthStart = startOfMonth(now);
      const thisMonthTransactions = financialDataYear.filter(
        t => new Date(t.transaction_date!) >= thisMonthStart
      );
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthTransactions = financialDataYear.filter(
        t => new Date(t.transaction_date!) < thisMonthStart
      );

      const processFinancials = (transactions: typeof financialDataYear) => {
        let totalIncome = 0;
        let totalExpenses = 0;
        const incomeByCategory: Record<string, number> = {};
        
        for (const t of transactions || []) {
          const categoryName = t.category?.name || 'Uncategorized';
          if (t.category?.type === 'Income') {
            totalIncome += t.amount;
            incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + t.amount;
          } else if (t.category?.type === 'Expense') {
            totalExpenses += t.amount;
          }
        }
        return { totalIncome, totalExpenses, incomeByCategory };
      };

      const thisMonthSummary = processFinancials(thisMonthTransactions);
      const lastMonthSummary = processFinancials(lastMonthTransactions);

      // Attendance Data
      const { data: attendanceSummary, error: attendanceError } = await supabase.rpc(
        'get_attendance_summary',
        { p_region_id: regionId }
      );
      if (attendanceError) throw attendanceError;
      
      const averageAttendance = attendanceSummary?.[0]?.present_count ?? 0;
      
      const attendanceTrends = attendanceSummary
        ? [...attendanceSummary].reverse().map(item => ({
          month: item.event_date ? format(parseISO(item.event_date), 'MMM') : 'N/A',
          attendance: item.present_count ?? 0
        }))
        : [];

      // Membership Growth Data — use in-memory members list, exclude children
      const growthByMonth = adultMembersList.reduce((acc, member) => {
        if (!member.created_at) return acc;
        const month = format(new Date(member.created_at), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const membershipGrowth = Object.entries(growthByMonth).map(([month, newMembers]) => ({
        month: month.split(' ')[0],
        newMembers
      }));

      // KPI: New Members YTD (excluding children)
      const newMembersYTD = adultMembersList.filter(
        m => m.created_at && new Date(m.created_at) >= yearStart
      ).length;

      // Membership Demographics — count children only via the strict rule;
      // remaining under-16 records (no adult relationship) drop into 'Unknown'.
      const ageGroups = { 'Children (0-15)': 0, 'Youth (16-17)': 0, 'Adults (18-64)': 0, 'Seniors (65+)': 0, 'Unknown': 0 };
      (regionMembers || []).forEach(m => {
        if (childrenSet.has(m.id)) {
          ageGroups['Children (0-15)']++;
          return;
        }
        const dob = m.profiles?.date_of_birth;
        if (dob) {
          const age = differenceInYears(new Date(), new Date(dob));
          if (age <= 17) ageGroups['Youth (16-17)']++;
          else if (age <= 64) ageGroups['Adults (18-64)']++;
          else ageGroups['Seniors (65+)']++;
        } else {
          ageGroups['Unknown']++;
        }
      });

      const membershipDemographics = Object.entries(ageGroups).map(([category, value]) => ({
        category,
        value
      }));

      // DCG Reports
      const { data: dcgsData, error: dcgsDataError } = await supabase
        .from('dcgs')
        .select('id, name, leader:leader_id(id, profiles:profile_id(first_name, last_name)), dcg_members(count)')
        .eq('region_id', regionId);
      if (dcgsDataError) throw dcgsDataError;

      // DCG Giving (YTD)
      const dcgGiving = (financialDataYear || [])
        .filter(t => t.dcg_id && t.category?.type === 'Income')
        .reduce((acc, t) => {
          if (t.dcg_id) {
            acc[t.dcg_id] = (acc[t.dcg_id] || 0) + t.amount;
          }
          return acc;
        }, {} as Record<string, number>);

      // DCG Growth (new members in last quarter)
      const oneQuarterAgo = subQuarters(new Date(), 1).toISOString();
      const { data: dcgGrowthData, error: dcgGrowthError } = await supabase
        .from('dcg_members')
        .select('dcg_id')
        .gte('joined_date', oneQuarterAgo)
        .in('dcg_id', dcgsData?.map(d => d.id) || []);
      if (dcgGrowthError) throw dcgGrowthError;

      const dcgGrowthMap = (dcgGrowthData || []).reduce((acc, item) => {
        if (item.dcg_id) {
          acc[item.dcg_id] = (acc[item.dcg_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const dcgReports = (dcgsData || []).map(dcg => ({
        id: dcg.id,
        name: dcg.name,
        leader: dcg.leader?.profiles ? `${dcg.leader.profiles.first_name || ''} ${dcg.leader.profiles.last_name || ''}`.trim() : 'N/A',
        members: dcg.dcg_members[0]?.count || 0,
        attendance: 'N/A', // Mocked as getting real data is complex for this query
        growth: `+${dcgGrowthMap[dcg.id] || 0}`,
        giving: dcgGiving[dcg.id] || 0,
      }));
      
      const financialTrendsByMonth = (financialDataYear || []).reduce((acc, transaction) => {
        if (!transaction.transaction_date) return acc;
        const month = format(new Date(transaction.transaction_date), 'MMM yyyy');
        if (!acc[month]) {
          acc[month] = { income: 0, expense: 0 };
        }
        if (transaction.category?.type === 'Income') {
          acc[month].income += transaction.amount;
        } else {
          acc[month].expense += transaction.amount;
        }
        return acc;
      }, {} as Record<string, { income: number, expense: number }>);

      const financialTrends = Object.entries(financialTrendsByMonth).map(([month, totals]) => ({
        month: month.split(' ')[0],
        income: totals.income,
        expense: totals.expense
      }));

      return {
        kpis: {
          totalMembers,
          totalVisitors,
          totalChildren,
          newMembersLast30Days,
          averageAttendance,
          totalDcgs: totalDcgs ?? 0,
          totalIncome: thisMonthSummary.totalIncome,
          totalExpenses: thisMonthSummary.totalExpenses,
          newMembersYTD,
        },
        financialSummary: {
          thisMonth: thisMonthSummary,
          lastMonth: lastMonthSummary,
        },
        financialsYTD: {
          totalIncome: totalIncomeYTD,
          totalExpenses: totalExpensesYTD,
          currentBalance,
          chartData: financialChartData,
          chartCategories: financialChartCategories,
          incomeDistribution: incomeDistributionChartData,
          expenseDistribution: expenseDistributionChartData,
        },
        attendanceTrends,
        membershipGrowth,
        membershipDemographics,
        financialTrends,
        dcgReports,
        financialDataYear,
      };
    },
    enabled: !!regionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
