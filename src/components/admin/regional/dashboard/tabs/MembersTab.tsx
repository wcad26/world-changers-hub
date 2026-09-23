import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, TrendingUp, TrendingDown, Target, Calendar, Baby } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { useCurrentMemberTarget } from '@/hooks/useMemberTargets';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import TrendChart from '../TrendChart';
import PeriodFilter, { PeriodFilters } from '../PeriodFilter';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, subMonths, differenceInDays, differenceInYears, eachMonthOfInterval } from 'date-fns';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { isChildMember, CHILD_AGE_THRESHOLD } from '@/utils/childUtils';

interface MembersTabProps {
  selectedPeriod: string;
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-neutral)'];

const GlassCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-gradient-to-br from-card/95 to-muted/20 backdrop-blur-sm border border-border/30 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all duration-300">
    {children}
  </div>
);

const TrendBadge = ({ value }: { value: number }) => {
  if (value === 0) return <span className="text-xs text-muted-foreground">0%</span>;
  const pos = value > 0;
  return (
    <div className={`flex items-center gap-1 ${pos ? 'text-green-600' : 'text-red-600'}`}>
      {pos ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      <span className="text-xs font-medium">{pos ? '+' : ''}{value}%</span>
    </div>
  );
};

// Hook to fetch all member relationships for a region's members
const useRegionMemberRelationships = (memberIds: string[]) => {
  return useQuery({
    queryKey: ['region-member-relationships', memberIds.sort().join(',')],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });
};

const MembersTab: React.FC<MembersTabProps> = ({ selectedPeriod }) => {
  const [filters, setFilters] = useState<PeriodFilters>({
    dateRange: { from: subMonths(new Date(), 1), to: new Date() },
    quickDateRange: '1-month'
  });
  const { userRegion } = useAuth();
  const { data: members, isLoading, error } = useMembers(userRegion?.id);
  const { data: attendanceWithTypes, isLoading: isLoadingWithTypes } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: currentTarget, isLoading: isLoadingTarget } = useCurrentMemberTarget();

  // Fetch relationships for child detection
  const memberIds = useMemo(() => members?.map(m => m.id) || [], [members]);
  const { data: relationships = [] } = useRegionMemberRelationships(memberIds);

  // Adult DOB lookup so isChildMember can verify the related party is an adult.
  const adultDobLookup = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    (members || []).forEach(m => map.set(m.id, m.profiles?.date_of_birth));
    return map;
  }, [members]);

  // Separate children (under 16 + has adult relationship) from adult members and visitors
  const { totalMembers, totalVisitors, activeMembers, childrenCount } = useMemo(() => {
    if (!members) return { totalMembers: 0, totalVisitors: 0, activeMembers: 0, childrenCount: 0 };
    let mem = 0, vis = 0, active = 0, children = 0;
    members.forEach(m => {
      const dob = m.profiles?.date_of_birth;
      const child = isChildMember(dob, m.id, relationships, adultDobLookup);
      if (child) {
        children++;
      } else if (m.member_type === 'member') {
        mem++;
        if (m.status === 'active') active++;
      } else if (m.member_type === 'visitor') {
        vis++;
      }
    });
    return { totalMembers: mem, totalVisitors: vis, activeMembers: active, childrenCount: children };
  }, [members, relationships, adultDobLookup]);

  // Period-filtered new joiners
  const newInPeriod = useMemo(() => {
    if (!members || !filters.dateRange?.from) return 0;
    const from = filters.dateRange.from;
    const to = filters.dateRange.to || new Date();
    return members.filter(m => {
      if (!m.join_date) return false;
      const d = new Date(m.join_date);
      return d >= from && d <= to;
    }).length;
  }, [members, filters.dateRange]);

  // Growth trends from attendance data
  const growthTrends = useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length < 2) {
      return { memberGrowth: 0, visitorGrowth: 0 };
    }
    const half = Math.ceil(attendanceWithTypes.length / 2);
    const recent = attendanceWithTypes.slice(0, half);
    const prev = attendanceWithTypes.slice(half);
    if (!recent.length || !prev.length) return { memberGrowth: 0, visitorGrowth: 0 };

    const recentAvgM = recent.reduce((s, e) => s + e.members_present, 0) / recent.length;
    const prevAvgM = prev.reduce((s, e) => s + e.members_present, 0) / prev.length;
    const recentAvgV = recent.reduce((s, e) => s + e.visitors_present, 0) / recent.length;
    const prevAvgV = prev.reduce((s, e) => s + e.visitors_present, 0) / prev.length;

    return {
      memberGrowth: prevAvgM > 0 ? Math.round(((recentAvgM - prevAvgM) / prevAvgM) * 100) : 0,
      visitorGrowth: prevAvgV > 0 ? Math.round(((recentAvgV - prevAvgV) / prevAvgV) * 100) : 0,
    };
  }, [attendanceWithTypes]);

  // Target progress
  const targetProgress = currentTarget ? Math.round((totalMembers / currentTarget.target_members) * 100) : null;
  const daysLeft = currentTarget ? differenceInDays(new Date(currentTarget.target_date), new Date()) : null;

  // Gender distribution: 5 categories (Adult Male, Adult Female, Young Male, Young Female, Unknown)
  const genderData = useMemo(() => {
    if (!members) return [];
    const counts: Record<string, number> = {};
    
    members.forEach(m => {
      const dob = m.profiles?.date_of_birth;
      const gender = m.profiles?.gender?.toLowerCase();
      const child = isChildMember(dob, m.id, relationships, adultDobLookup);
      
      let category: string;
      if (!gender || (gender !== 'male' && gender !== 'female')) {
        category = 'Unknown';
      } else if (child) {
        category = gender === 'male' ? 'Young Male' : 'Young Female';
      } else {
        category = gender === 'male' ? 'Adult Male' : 'Adult Female';
      }
      
      counts[category] = (counts[category] || 0) + 1;
    });
    
    // Only include Unknown if there are actually unknown entries
    return Object.entries(counts)
      .filter(([name, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [members, relationships, adultDobLookup]);

  // Monthly growth chart filtered by period
  const monthlyGrowth = useMemo(() => {
    if (!members) return [];
    const from = filters.dateRange?.from || subMonths(new Date(), 5);
    const to = filters.dateRange?.to || new Date();
    const monthStarts = eachMonthOfInterval({ start: from, end: to });
    
    const months: Record<string, { members: number; visitors: number }> = {};
    monthStarts.forEach(d => {
      const key = format(d, 'MMM yyyy');
      months[key] = { members: 0, visitors: 0 };
    });

    members.forEach(m => {
      if (m.join_date) {
        const jd = new Date(m.join_date);
        if (jd >= from && jd <= to) {
          const key = format(jd, 'MMM yyyy');
          if (months[key]) {
            if (m.member_type === 'member') months[key].members++;
            else months[key].visitors++;
          }
        }
      }
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }, [members, filters.dateRange]);

  // Recent joiners filtered by period
  const recentJoiners = useMemo(() => {
    if (!members) return [];
    const from = filters.dateRange?.from;
    const to = filters.dateRange?.to || new Date();
    return [...members]
      .filter(m => {
        if (!from) return true;
        if (!m.join_date) return false;
        const d = new Date(m.join_date);
        return d >= from && d <= to;
      })
      .sort((a, b) => new Date(b.join_date || 0).getTime() - new Date(a.join_date || 0).getTime())
      .slice(0, 8);
  }, [members, filters.dateRange]);

  // Period label
  const periodLabel = useMemo(() => {
    const q = filters.quickDateRange;
    if (q === '1-month') return 'This month';
    if (q === '3-months') return 'Last 3 months';
    if (q === '6-months') return 'Last 6 months';
    if (q === '1-year') return 'Last year';
    if (filters.dateRange?.from && filters.dateRange?.to) {
      return `${format(filters.dateRange.from, 'MMM d')} - ${format(filters.dateRange.to, 'MMM d')}`;
    }
    return 'Selected period';
  }, [filters]);

  if (isLoading || isLoadingWithTypes || isLoadingTarget) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading members</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'An unknown error occurred'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Members Analytics</h3>
        <PeriodFilter filters={filters} onFiltersChange={(f) => setFilters({ ...filters, ...f })} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Members */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Members</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold">{totalMembers}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{activeMembers} active</p>
            <TrendBadge value={growthTrends.memberGrowth} />
          </div>
        </GlassCard>

        {/* Total Visitors */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Total Visitors</span>
            <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{totalVisitors}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">Registered visitors</p>
            <TrendBadge value={growthTrends.visitorGrowth} />
          </div>
        </GlassCard>

        {/* New In Period */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">New Joiners</span>
            <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{newInPeriod}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </div>
        </GlassCard>

        {/* Member Target */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Member Target</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{targetProgress !== null ? `${targetProgress}%` : 'No Target'}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              {currentTarget ? `${totalMembers} of ${currentTarget.target_members}` : 'Set a target'}
            </p>
            {daysLeft !== null && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                daysLeft < 0 ? 'text-red-600' : daysLeft < 30 ? 'text-orange-500' : 'text-blue-600'
              }`}>
                <Calendar className="h-3 w-3" />
                {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Children */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Children</span>
            <div className="h-8 w-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Baby className="h-4 w-4 text-pink-600" />
            </div>
          </div>
          <div className="text-2xl font-bold">{childrenCount}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">Under {CHILD_AGE_THRESHOLD} years</p>
          </div>
        </GlassCard>
      </div>

      {/* Attendance Trend */}
      <TrendChart />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gender Distribution */}
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">No gender data available</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">New Joiners ({periodLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="members" fill="var(--chart-1)" name="Members" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visitors" fill="var(--chart-2)" name="Visitors" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Joiners */}
      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm">Recent Joiners</CardTitle>
          <CardDescription>Latest members and visitors ({periodLabel})</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentJoiners.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/10">
                <div>
                  <p className="text-sm font-medium">{m.profiles?.last_name} {m.profiles?.first_name}</p>
                  <p className="text-xs text-muted-foreground">{m.member_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.member_type === 'member' ? 'default' : 'secondary'}>
                    {m.member_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {m.join_date ? format(new Date(m.join_date), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
            {recentJoiners.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No members found in this period</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersTab;
