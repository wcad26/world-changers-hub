import React, { useEffect, useMemo, useState } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { GlassKPICard } from '@/components/ui/GlassSection';
import { Users, Baby, Wallet, Heart, CalendarIcon, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { useFinancialTransactions } from '@/hooks/useFinancials';
import { useDcgs } from '@/hooks/useDCGs';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { buildChildrenSet } from '@/utils/childUtils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend,
} from 'recharts';

const DcgDashboard = () => {
  const { profile, userDcg } = useAuth();
  const { data: dcgs } = useDcgs();
  const currentDcg = dcgs?.find((d) => d.id === userDcg?.id);
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);

  const { data: dcgMembers = [] } = useDcgMembers(userDcg?.id);
  const { data: attendanceHistory = [] } = useDcgAttendanceHistory(userDcg?.id);

  // ── Period filter ──
  const [quickPeriod, setQuickPeriod] = useState('1-month');
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    let from: Date;
    switch (quickPeriod) {
      case '1-month': from = subMonths(now, 1); break;
      case '3-months': from = subMonths(now, 3); break;
      case '6-months': from = subMonths(now, 6); break;
      case '1-year': from = subMonths(now, 12); break;
      case 'custom': return { from: customRange.from, to: customRange.to || now };
      default: from = subMonths(now, 1);
    }
    return { from, to: now };
  }, [quickPeriod, customRange]);

  const dateFilters = useMemo(() => {
    if (!dateRange.from) return undefined;
    return {
      from: format(dateRange.from, 'yyyy-MM-dd'),
      to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    };
  }, [dateRange]);

  const { data: periodTransactions = [] } = useFinancialTransactions(dateFilters);

  // ── Members + strict child rule ──
  const activeMembersAll = dcgMembers.filter((m) => m.is_active);
  const [childrenSet, setChildrenSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    const ids = activeMembersAll.map((m) => m.member_id).filter(Boolean) as string[];
    if (ids.length === 0) { setChildrenSet(new Set()); return; }
    let cancelled = false;
    (async () => {
      const { fetchMemberRelationshipsForMembers } = await import('@/utils/fetchMemberRelationships');
      const rels = await fetchMemberRelationshipsForMembers(ids);
      const set = buildChildrenSet(
        activeMembersAll.map((m) => ({
          id: m.member_id,
          profiles: { date_of_birth: m.members?.profiles?.date_of_birth ?? null },
        })),
        rels,
      );
      if (!cancelled) setChildrenSet(set);
    })();
    return () => { cancelled = true; };
  }, [activeMembersAll.length]);

  const adultMembers = activeMembersAll.filter((m) => !childrenSet.has(m.member_id));
  const totalAdults = adultMembers.length;
  const totalChildren = childrenSet.size;

  // ── Net balance (period-scoped, DCG-only) ──
  const dcgTxns = periodTransactions.filter((t: any) => t.dcg_id === userDcg?.id);
  const financeTotals = dcgTxns.reduce(
    (acc, t: any) => {
      const amount = Number(t.amount) || 0;
      const type = t.category?.type?.toLowerCase();
      if (type === 'income') acc.income += amount;
      else if (type === 'expense') acc.expenses += amount;
      return acc;
    },
    { income: 0, expenses: 0 },
  );
  const netBalance = financeTotals.income - financeTotals.expenses;

  // ── Discipleship Success (DCG mentors) ──
  const dcgMemberIds = useMemo(
    () => activeMembersAll.map((m) => m.member_id).filter(Boolean) as string[],
    [activeMembersAll],
  );
  const sortedIdsKey = useMemo(() => [...dcgMemberIds].sort().join(','), [dcgMemberIds]);

  const { data: discipleshipStats } = useQuery({
    queryKey: ['dcg-discipleship-stats', userDcg?.id, sortedIdsKey],
    queryFn: async () => {
      if (!dcgMemberIds.length) return { totalRelationships: 0, becameMembers: 0 };
      const { data: rels, error } = await supabase
        .from('discipleship_relationships')
        .select('id')
        .in('mentor_id', dcgMemberIds);
      if (error) throw error;
      const relIds = (rels || []).map((r) => r.id);
      if (!relIds.length) return { totalRelationships: 0, becameMembers: 0 };
      const { data: progress, error: pErr } = await supabase
        .from('discipleship_progress')
        .select('relationship_id, milestone')
        .in('relationship_id', relIds)
        .eq('milestone', 'became_member');
      if (pErr) throw pErr;
      const successSet = new Set((progress || []).map((p) => p.relationship_id));
      return { totalRelationships: relIds.length, becameMembers: successSet.size };
    },
    enabled: !!userDcg?.id && dcgMemberIds.length > 0,
  });

  const successRate = discipleshipStats && discipleshipStats.totalRelationships > 0
    ? Math.round((discipleshipStats.becameMembers / discipleshipStats.totalRelationships) * 100)
    : 0;

  // ── Attendance trend (period + search filtered) ──
  const filteredAttendance = useMemo(() => {
    return (attendanceHistory || []).filter((a) => {
      const d = new Date(a.event_date);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to && d > dateRange.to) return false;
      if (searchQuery && !a.event_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [attendanceHistory, dateRange, searchQuery]);

  const trendChartData = useMemo(() => {
    return [...filteredAttendance]
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .map((a) => ({
        date: format(new Date(a.event_date), 'MMM d'),
        Members: a.members_present || 0,
        'Regular Visitors': a.visitors_present || 0,
      }));
  }, [filteredAttendance]);

  const periodOptions = [
    { value: '1-month', label: '1M' },
    { value: '3-months', label: '3M' },
    { value: '6-months', label: '6M' },
    { value: '1-year', label: '1Y' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <DcgAdminLayout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* ── FIXED FILTER BAR ── */}
        <div className="shrink-0 z-20 bg-background/98 backdrop-blur-md border-b border-border/30 px-4 md:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
              {periodOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={quickPeriod === opt.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setQuickPeriod(opt.value)}
                  className={cn(
                    'h-8 px-3 rounded-lg text-xs',
                    quickPeriod === opt.value && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {quickPeriod === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {customRange.from
                      ? `${format(customRange.from, 'MMM d')}${customRange.to ? ` - ${format(customRange.to, 'MMM d, y')}` : ''}`
                      : 'Pick dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: customRange.from, to: customRange.to }}
                    onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="relative flex-1 sm:min-w-[180px] sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
          {/* Header */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold">DCG Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile?.first_name}! Here's your {userDcg?.name} overview.
            </p>
          </div>

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassKPICard
              icon={<Users className="h-5 w-5" />}
              label="Members"
              value={totalAdults}
              subtitle={`${totalAdults} adults · ${totalChildren} children`}
            />
            <GlassKPICard
              icon={<Baby className="h-5 w-5" />}
              label="Children"
              value={totalChildren}
              subtitle="In DCG"
            />
            <GlassKPICard
              icon={<Wallet className="h-5 w-5" />}
              label="Net Balance"
              value={formatWithCurrency(netBalance, regionCurrency)}
              subtitle={`${formatWithCurrency(financeTotals.income, regionCurrency)} in · ${formatWithCurrency(financeTotals.expenses, regionCurrency)} out`}
            />
            <GlassKPICard
              icon={<Heart className="h-5 w-5" />}
              label="Discipleship Success"
              value={`${successRate}%`}
              subtitle="Reached membership milestone"
            />
          </div>

          {/* ── ATTENDANCE TREND ── */}
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
            <h3 className="text-base font-semibold mb-4 text-foreground">Attendance Trend</h3>
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dcgGradMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dcgGradVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const total = payload.reduce((sum, p: any) => sum + (Number(p.value) || 0), 0);
                      return (
                        <div style={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          fontSize: '12px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 4, color: 'hsl(var(--foreground))' }}>{label}</div>
                          {payload.map((p: any) => (
                            <div key={p.dataKey} style={{ color: p.color }}>{p.dataKey} : {p.value}</div>
                          ))}
                          <div style={{
                            marginTop: 6, paddingTop: 6,
                            borderTop: '1px solid hsl(var(--border))',
                            fontWeight: 600, color: 'hsl(var(--foreground))',
                          }}>Total : {total}</div>
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="Members" stroke="hsl(var(--chart-1))" fill="url(#dcgGradMembers)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="Regular Visitors" stroke="hsl(var(--chart-2))" fill="url(#dcgGradVisitors)" strokeWidth={2.5} dot={false} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
                No attendance data for this period.
              </div>
            )}
          </div>
        </div>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgDashboard;
