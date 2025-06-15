import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subMonths, format, parseISO, differenceInYears, startOfYear, startOfMonth, subQuarters } from 'date-fns';

export const useRegionalReports = () => {
  const { userRegion } = useAuth();
  const regionId = userRegion?.id;

  return useQuery({
    queryKey: ['regionalReports', regionId],
    queryFn: async () => {
      if (!regionId) return null;

      // KPI: Total Members
      const { count: totalMembers, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('region_id', regionId);
      if (membersError) throw membersError;

      // KPI: New Members (last 30 days)
      const oneMonthAgo = subMonths(new Date(), 1).toISOString();
      const { count: newMembersLast30Days, error: newMembersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('region_id', regionId)
        .gte('created_at', oneMonthAgo);
      if (newMembersError) throw newMembersError;

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
        .select('amount, transaction_date, category:financial_transaction_categories(name, type), dcg_id')
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

      // Membership Growth Data
      const { data: membersGrowthData, error: growthError } = await supabase
        .from('members')
        .select('created_at')
        .eq('region_id', regionId)
        .order('created_at');
      if (growthError) throw growthError;

      const growthByMonth = (membersGrowthData || []).reduce((acc, member) => {
        if (!member.created_at) return acc;
        const month = format(new Date(member.created_at), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const membershipGrowth = Object.entries(growthByMonth).map(([month, newMembers]) => ({
        month: month.split(' ')[0],
        newMembers
      }));

      // KPI: New Members YTD
      const { count: newMembersYTD, error: membersYTDError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('region_id', regionId)
        .gte('created_at', format(yearStart, 'yyyy-MM-dd'));
      if (membersYTDError) throw membersYTDError;

      // Membership Demographics
      const { data: profiles, error: profilesError } = await supabase
        .from('members')
        .select('profiles(date_of_birth)')
        .eq('region_id', regionId);

      if (profilesError) throw profilesError;

      const ageGroups = { 'Children (0-12)': 0, 'Youth (13-17)': 0, 'Adults (18-64)': 0, 'Seniors (65+)': 0, 'Unknown': 0 };
      (profiles || []).forEach(p => {
        if (p.profiles?.date_of_birth) {
          const birthDate = new Date(p.profiles.date_of_birth);
          const age = differenceInYears(new Date(), birthDate);
          if (age <= 12) ageGroups['Children (0-12)']++;
          else if (age <= 17) ageGroups['Youth (13-17)']++;
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
          totalMembers: totalMembers ?? 0,
          newMembersLast30Days: newMembersLast30Days ?? 0,
          averageAttendance,
          totalDcgs: totalDcgs ?? 0,
          totalIncome: thisMonthSummary.totalIncome,
          totalExpenses: thisMonthSummary.totalExpenses,
          newMembersYTD: newMembersYTD ?? 0,
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
      };
    },
    enabled: !!regionId,
  });
};
