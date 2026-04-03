import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, CalendarCheck2, TrendingUp, TrendingDown, UserCheck, Percent } from 'lucide-react';
import { useMembers } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import TrendChart from '../TrendChart';
import PeriodFilter, { PeriodFilters } from '../PeriodFilter';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface MembersTabProps {
  selectedPeriod: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const MembersTab: React.FC<MembersTabProps> = ({ selectedPeriod }) => {
  const [filters, setFilters] = useState<PeriodFilters>({
    dateRange: { from: subMonths(new Date(), 1), to: new Date() },
    quickDateRange: '1-month'
  });
  const { userRegion } = useAuth();
  const { data: members, isLoading, error } = useMembers(userRegion?.id);
  const { data: attendanceWithTypes, isLoading: isLoadingWithTypes } = useAttendanceHistoryWithMemberTypes(userRegion?.id);

  const totalMembers = members?.filter(m => m.member_type === 'member').length || 0;
  const totalVisitors = members?.filter(m => m.member_type === 'visitor').length || 0;

  const newThisMonth = useMemo(() => {
    if (!members) return 0;
    const now = new Date();
    const monthStart = startOfMonth(now);
    return members.filter(m => m.join_date && new Date(m.join_date) >= monthStart).length;
  }, [members]);

  const memberToVisitorRatio = useMemo(() => {
    if (totalVisitors === 0) return totalMembers > 0 ? '∞' : '0';
    return (totalMembers / totalVisitors).toFixed(1);
  }, [totalMembers, totalVisitors]);

  const avgAttendance = useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length === 0) return 0;
    const total = attendanceWithTypes.reduce((sum, e) => sum + e.total_present, 0);
    return Math.round(total / attendanceWithTypes.length);
  }, [attendanceWithTypes]);

  const attendanceRate = useMemo(() => {
    if (!attendanceWithTypes || attendanceWithTypes.length === 0 || totalMembers === 0) return 0;
    const latestEvent = attendanceWithTypes[0];
    return Math.round((latestEvent.total_present / totalMembers) * 100);
  }, [attendanceWithTypes, totalMembers]);

  // Gender distribution from profiles
  const genderData = useMemo(() => {
    if (!members) return [];
    const genderCounts: Record<string, number> = {};
    members.forEach(m => {
      const gender = m.profiles?.gender || 'Unknown';
      const capitalized = gender.charAt(0).toUpperCase() + gender.slice(1);
      genderCounts[capitalized] = (genderCounts[capitalized] || 0) + 1;
    });
    return Object.entries(genderCounts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Monthly growth chart
  const monthlyGrowth = useMemo(() => {
    if (!members) return [];
    const months: Record<string, { members: number; visitors: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, 'MMM yyyy');
      months[key] = { members: 0, visitors: 0 };
    }
    members.forEach(m => {
      if (m.join_date) {
        const key = format(new Date(m.join_date), 'MMM yyyy');
        if (months[key]) {
          if (m.member_type === 'member') months[key].members++;
          else months[key].visitors++;
        }
      }
    });
    return Object.entries(months).map(([month, data]) => ({ month, ...data }));
  }, [members]);

  // Recent joiners
  const recentJoiners = useMemo(() => {
    if (!members) return [];
    return [...members]
      .sort((a, b) => new Date(b.join_date || 0).getTime() - new Date(a.join_date || 0).getTime())
      .slice(0, 8);
  }, [members]);

  if (isLoading || isLoadingWithTypes) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
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

  const kpis = [
    { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Visitors', value: totalVisitors, icon: UserPlus, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'New This Month', value: newThisMonth, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Avg Attendance', value: avgAttendance, icon: CalendarCheck2, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Member:Visitor', value: memberToVisitorRatio, icon: UserCheck, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: Percent, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Members Analytics</h3>
        <PeriodFilter filters={filters} onFiltersChange={(f) => setFilters({ ...filters, ...f })} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
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
            <CardTitle className="text-sm">Monthly New Joiners (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="members" fill="hsl(var(--primary))" name="Members" radius={[4, 4, 0, 0]} />
                <Bar dataKey="visitors" fill="hsl(var(--secondary))" name="Visitors" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Joiners */}
      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm">Recent Joiners</CardTitle>
          <CardDescription>Latest members and visitors</CardDescription>
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
              <p className="text-center text-sm text-muted-foreground py-4">No members found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembersTab;
