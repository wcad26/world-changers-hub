import React, { useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import {
  Users,
  Baby,
  MapPin,
  Clock,
  Phone,
  Calendar as CalendarIcon,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import { useDcgs } from '@/hooks/useDCGs';
import { buildChildrenSet } from '@/utils/childUtils';
import { fetchMemberRelationshipsForMembers } from '@/utils/fetchMemberRelationships';
import { useQuery } from '@tanstack/react-query';
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
  SearchBar,
  PeriodChipBar,
  InfoRow,
  Panel,
  EmptyState,
  StatusPill,
  type DateRangeValue,
} from '@/components/admin/dcg/DcgUI';

import { Ring } from '@/components/admin/regional/RegionalUI';
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

const GENDER_TONES = { male: 'var(--chart-1)', female: 'var(--chart-4)' };

/** Total with a male/female breakdown bar. */
function SplitTile({ icon: Icon, label, total, male, female, share, tone = 'var(--chart-1)', onClick }: {
  icon: LucideIcon;
  label: string;
  total: number;
  share?: number;
  male: number;
  female: number;
  other?: number;
  tone?: string;
  onClick?: () => void;
}) {
  const shown = male + female;
  const malePct = shown > 0 ? Math.round((male / shown) * 100) : 0;
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 text-left transition-all',
        onClick && 'hover:border-primary/50 active:scale-[0.98]',
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl"
        style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)` }}
      />
      <div className="relative">
        {share !== undefined && (
          <div className="absolute right-0 top-0">
            <Ring value={share} size={52} tone={tone} label={`${label} share of members`} />
          </div>
        )}
        <span
          className="grid h-8 w-8 place-items-center rounded-xl"
          style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="mt-2 font-heading text-2xl font-bold leading-none text-foreground">{total}</p>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full transition-all duration-700"
            style={{ width: shown ? `${malePct}%` : '0%', background: GENDER_TONES.male }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: shown ? `${100 - malePct}%` : '0%', background: GENDER_TONES.female }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GENDER_TONES.male }} />
            Male <strong className="font-bold text-foreground">{male}</strong>
            <span className="tabular-nums opacity-70">{shown ? `${malePct}%` : '—'}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GENDER_TONES.female }} />
            Female <strong className="font-bold text-foreground">{female}</strong>
            <span className="tabular-nums opacity-70">{shown ? `${100 - malePct}%` : '—'}</span>
          </span>
        </div>
      </div>
    </Comp>
  );
}

function splitByGender(list: { members?: { profiles?: { gender?: string | null } | null } | null }[]) {
  let male = 0;
  let female = 0;
  list.forEach((m) => {
    const g = (m.members?.profiles?.gender || '').toLowerCase();
    if (g === 'male') male += 1;
    else if (g === 'female') female += 1;
  });
  return { male, female, other: list.length - male - female };
}

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

  // ── Gender split (adults & children) ──
  const adultList = useMemo(
    () => activeMembersAll.filter((m) => !childrenSet.has(m.member_id)),
    [activeMembersAll, childrenSet],
  );
  const childList = useMemo(
    () => activeMembersAll.filter((m) => childrenSet.has(m.member_id)),
    [activeMembersAll, childrenSet],
  );
  const adultSplit = useMemo(() => splitByGender(adultList), [adultList]);
  const childSplit = useMemo(() => splitByGender(childList), [childList]);

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
        />

        {/* People mix */}
        <div className="grid grid-cols-2 gap-3">
          <SplitTile
            icon={Users}
            label="Adults"
            tone="var(--chart-1)"
            total={totalAdults}
            {...adultSplit}
            onClick={() => navigate('/dcg/members')}
          />
          <SplitTile
            icon={Baby}
            label="Children"
            tone="var(--chart-5)"
            total={totalChildren}
            {...childSplit}
            onClick={() => navigate('/dcg/members')}
          />
        </div>

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

      </div>
    </DcgAdminLayout>
  );
};

export default DcgDashboard;
