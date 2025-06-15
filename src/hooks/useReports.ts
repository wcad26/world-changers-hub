
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subMonths, format, parseISO, getYear, differenceInYears } from 'date-fns';

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

      // Attendance Data
      const { data: attendanceSummary, error: attendanceError } = await supabase.rpc(
        'get_attendance_summary',
        { p_region_id: regionId }
      );
      if (attendanceError) throw attendanceError;
      
      const averageAttendance = attendanceSummary?.[0]?.present_count ?? 0;
      
      const attendanceTrends = attendanceSummary
        ? [...attendanceSummary].reverse().map(item => ({
          month: format(parseISO(item.event_date), 'MMM'),
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

      return {
        kpis: {
          totalMembers: totalMembers ?? 0,
          newMembersLast30Days: newMembersLast30Days ?? 0,
          averageAttendance,
        },
        attendanceTrends,
        membershipGrowth,
        membershipDemographics
      };
    },
    enabled: !!regionId,
  });
};
