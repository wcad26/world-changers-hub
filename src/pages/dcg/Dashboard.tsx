import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import {
  Users,
  Baby,
  Wallet,
  Heart,
  MapPin,
  Clock,
  Phone,
  Calendar as CalendarIcon,
  TrendingUp,
  UserPlus,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { useCurrentDcg, useDcgFinancialTransactions } from '@/hooks/useDcgFinancials';
import { useDcgs } from '@/hooks/useDCGs';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths } from 'date-fns';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import {
  HeroCard,
  RingTile,
  SearchBar,
  PeriodChipBar,
  InfoRow,
  Panel,
  EmptyState,
  StatusPill,
  type DateRangeValue,
} from '@/components/admin/dcg/DcgUI';

type PeriodKey = '1-month' | '3-months' | '6-months' | '1-year' | 'custom';

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: '1-month', label: '1 month' },
  { value: '3-months', label: '3 months' },
  { value: '6-months', label: '6 months' },
  { value: '1-year', label: '1 year' },
  { value: 'custom', label: 'Custom' },
];

const formatMeetingTime = (time?: string | null): string => {
  if (!time) return 'Schedule TBD';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  if (isNaN(hour)) return time;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes || '00'} ${ampm}`;
};

const DcgDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, userDcg } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const { data: dcgs } = useDcgs();

  const dcgId = userDcg?.id || resolvedDcg?.id;
  const currentDcg = useMemo(
    () => dcgs?.find((d) => d.id === dcgId) || resolvedDcg || userDcg,
    [dcgs, dcgId, resolvedDcg, userDcg],
  );
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);

  const { data: dcgMembers = [] } = useDcgMembers(dcgId);
  const { data: attendanceHistory = [] } = useDcgAttendanceHistory(dcgId);

  // ── Period filter ──
  const [quickPeriod, setQuickPeriod] = useState<PeriodKey>('1-month');
  const [customRange, setCustomRange] = useState<DateRangeValue>({});
  const [searchQuery, setSearchQuery] = useState('');

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (quickPeriod) {
      case '1-month':
        return { from: subMonths(now, 1), to: now };
      case '3-months':
        return { from: subMonths(now, 3), to: now };
      case '6-months':
        return { from: subMonths(now, 6), to: now };
      case '1-year':
        return { from: subMonths(now, 12), to: now };
      case 'custom':
        return { from: customRange.from, to: customRange.to || now };
      default:
        return { from: subMonths(now, 1), to: now };
    }
  }, [quickPeriod, customRange]);

  const dateFilters = useMemo(() => {
    if (!dateRange.from) return undefined;
    return {
      from: format(dateRange.from, 'yyyy-MM-dd'),
      to: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    };
  }, [dateRange]);

  const { data: dcgTransactions = [] } = useDcgFinancialTransactions(dcgId, dateFilters);

  // ── Members + strict child rule ──
  const activeMembersAll = useMemo(() => dcgMembers.filter((m) => m.is_active), [dcgMembers]);
  const dcgMemberIds = useMemo(
    () => activeMembersAll.map((m) => m.member_id).filter(Boolean) as string[],
    [activeMembersAll],
  );
  const sortedIdsKey = useMemo(() => [...dcgMemberIds].sort().join(','), [dcgMemberIds]);

  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dcg-dashboard-relationships', sortedIdsKey],
    queryFn: () => fetchMemberRelationshipsForMembers(dcgMemberIds),
    enabled: dcgMemberIds.length > 0,
  });

  const childrenSet = useMemo(
    () =>
      buildChildrenSet(
        activeMembersAll.map((m) => ({
          id: m.member_id,
          profiles: { date_of_birth: m.members?.profiles?.date_of_birth ?? null },
        })),
        memberRelationships,
      ),
    [activeMembersAll, memberRelationships],
  );

  const totalAdults = activeMembersAll.filter((m) => !childrenSet.has(m.member_id)).length;
  const totalChildren = childrenSet.size;

  // ── Net balance (period-scoped, DCG-only) ──
  const financeTotals = useMemo(
    () =>
      dcgTransactions.reduce(
        (acc, t) => {
          const amount = Number(t.amount) || 0;
          const type = t.category?.type?.toLowerCase();
          if (type === 'income') acc.income += amount;
          else if (type === 'expense') acc.expenses += amount;
          return acc;
        },
        { income: 0, expenses: 0 },
      ),
    [dcgTransactions],
  );
  const netBalance = financeTotals.income - financeTotals.expenses;

  // ── Discipleship Success (DCG mentors) ──
  const { data: discipleshipStats } = useQuery({
    queryKey: ['dcg-discipleship-stats', dcgId, sortedIdsKey],
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
    enabled: !!dcgId && dcgMemberIds.length > 0,
  });

  const successRate =
    discipleshipStats && discipleshipStats.totalRelationships > 0
      ? Math.round((discipleshipStats.becameMembers / discipleshipStats.totalRelationships) * 100)
      : 0;

  // ── Attendance trend (period + search filtered) ──
  const filteredAttendance = useMemo(() => {
    return (attendanceHistory || []).filter((a) => {
      const d = new Date(a.event_date);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to) {
        const end = new Date(dateRange.to);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      if (searchQuery && !a.event_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [attendanceHistory, dateRange, searchQuery]);

  const trendChartData = useMemo(() => {
    return [...filteredAttendance]
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .map((a) => ({
        date: format(new Date(a.event_date), 'MMM d'),
        eventName: a.event_name,
        Members: a.members_present || 0,
        'Regular Visitors': a.visitors_present || 0,
      }));
  }, [filteredAttendance]);

  // Latest gathering fill rate
  const latestGathering = filteredAttendance[0] || attendanceHistory[0];
  const latestTotal = latestGathering ? latestGathering.total_present || 0 : 0;
  const fillRate =
    activeMembersAll.length > 0 ? Math.min(100, Math.round((latestTotal / activeMembersAll.length) * 100)) : 0;

  const leaderName = useMemo(() => {
    const d = currentDcg as any;
    if (d?.leader?.profiles) {
      const p = d.leader.profiles;
      return `${p.last_name || ''} ${p.first_name || ''}`.trim() || 'DCG Leader';
    }
    if (profile?.first_name || profile?.last_name) {
      return `${profile.last_name || ''} ${profile.first_name || ''}`.trim();
    }
    return 'Assigned Leader';
  }, [currentDcg, profile]);

  const fc = (n: number) => formatWithCurrency(n, regionCurrency);

  return (
    <DcgAdminLayout>
      <div className="space-y-5">
        {/* Period Filter */}
        <PeriodChipBar
          value={quickPeriod}
          onChange={setQuickPeriod}
          options={PERIOD_OPTIONS}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />

        {/* Hero Summary Card */}
        <HeroCard
          eyebrow={`${(currentDcg as any)?.meeting_day || 'Weekly Gathering'} · ${formatMeetingTime((currentDcg as any)?.meeting_time)}`}
          value={activeMembersAll.length}
          sub={`${totalAdults} adults · ${totalChildren} children · Led by ${leaderName}`}
          ring={fillRate}
          ringLabel="Last gathering"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dcg/members')}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/25"
            >
              <UserPlus className="h-3.5 w-3.5" /> Manage Members
            </button>
            <button
              type="button"
              onClick={() => navigate('/dcg/events')}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/25"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Event
            </button>
            <button
              type="button"
              onClick={() => navigate('/dcg/finances')}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur transition hover:bg-primary-foreground/25"
            >
              <Wallet className="h-3.5 w-3.5" /> Record Finance
            </button>
          </div>
        </HeroCard>

        {/* KPI Ring Tiles */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <RingTile
            icon={Users}
            label="Adult members"
            value={totalAdults}
            ring={fillRate}
            ringLabel="fill"
            tone="var(--chart-1)"
            onClick={() => navigate('/dcg/members')}
          />
          <RingTile
            icon={Baby}
            label="Children in DCG"
            value={totalChildren}
            tone="var(--chart-5)"
            onClick={() => navigate('/dcg/members')}
          />
          <RingTile
            icon={Wallet}
            label={`${fc(financeTotals.income)} in · ${fc(financeTotals.expenses)} out`}
            value={fc(netBalance)}
            tone={netBalance >= 0 ? 'var(--chart-2)' : 'var(--destructive)'}
            onClick={() => navigate('/dcg/finances')}
          />
          <RingTile
            icon={Heart}
            label="Discipleship milestone"
            value={`${successRate}%`}
            ring={successRate}
            ringLabel="success"
            tone="var(--chart-4)"
          />
        </div>

        {/* Group Details Card */}
        {currentDcg && (
          <Panel
            title="Group Information"
            action={<StatusPill status={(currentDcg as any).is_active !== false ? 'active' : 'inactive'} />}
            bodyClassName="py-2"
          >
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0 lg:grid-cols-4">
              <InfoRow icon={Users} label="Leader" value={leaderName} />
              <InfoRow icon={MapPin} label="Location" value={(currentDcg as any).location || 'Not set'} />
              <InfoRow
                icon={CalendarIcon}
                label="Meeting day"
                value={(currentDcg as any).meeting_day || 'Not set'}
              />
              <InfoRow
                icon={Clock}
                label="Time"
                value={formatMeetingTime((currentDcg as any).meeting_time)}
              />
              {(currentDcg as any).contact_phone && (
                <InfoRow icon={Phone} label="Contact" value={(currentDcg as any).contact_phone} />
              )}
            </div>
            {(currentDcg as any).description && (
              <p className="mt-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                {(currentDcg as any).description}
              </p>
            )}
          </Panel>
        )}

        {/* Attendance Trend */}
        <Panel
          title="Attendance Trend"
          action={
            <span className="text-xs font-medium text-muted-foreground">
              {trendChartData.length} {trendChartData.length === 1 ? 'gathering' : 'gatherings'}
            </span>
          }
          bodyClassName="space-y-4"
        >
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Filter attendance by event name…"
          />

          {trendChartData.length > 0 ? (
            <div className="h-[280px] sm:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dcgDashGradMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dcgDashGradVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const total = payload.reduce((sum, p: any) => sum + (Number(p.value) || 0), 0);
                      const eventTitle = payload[0]?.payload?.eventName;
                      return (
                        <div
                          style={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '14px',
                            fontSize: '12px',
                            padding: '10px 14px',
                            boxShadow:
                              '0 6px 20px color-mix(in oklab, var(--foreground) calc(0.1 * 100%), transparent)',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{label}</div>
                          {eventTitle && (
                            <div
                              style={{
                                fontSize: '11px',
                                marginBottom: 6,
                                color: 'var(--muted-foreground)',
                              }}
                            >
                              {eventTitle}
                            </div>
                          )}
                          {payload.map((p: any) => (
                            <div key={p.dataKey} style={{ color: p.color }}>
                              {p.dataKey}: <strong>{p.value}</strong>
                            </div>
                          ))}
                          <div
                            style={{
                              marginTop: 6,
                              paddingTop: 6,
                              borderTop: '1px solid var(--border)',
                              fontWeight: 600,
                              color: 'var(--foreground)',
                            }}
                          >
                            Total: {total}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Members"
                    stroke="var(--chart-1)"
                    fill="url(#dcgDashGradMembers)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="Regular Visitors"
                    stroke="var(--chart-2)"
                    fill="url(#dcgDashGradVisitors)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={TrendingUp}
              title={searchQuery ? 'No gatherings match your search' : 'No attendance data for this period'}
              hint="Record attendance on the Events page to visualize your group's growth over time."
            />
          )}
        </Panel>
      </div>
    </DcgAdminLayout>
  );
};

export default DcgDashboard;
