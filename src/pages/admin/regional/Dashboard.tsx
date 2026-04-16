import React, { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { useRegionalEvents } from "@/hooks/useEvents";
import { useFinancialSummary, useFinancialTransactions } from "@/hooks/useFinancials";
import { useDiscipleshipRelationships } from "@/hooks/useDiscipleship";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useCurrentMemberTarget } from "@/hooks/useMemberTargets";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlassKPICard } from "@/components/ui/GlassSection";
import {
  AlertCircle, Users, Baby, Heart, CalendarDays, UsersRound, Target,
  TrendingUp, TrendingDown, Search, CalendarIcon, DollarSign, Banknote
} from "lucide-react";
import { format, differenceInYears, subMonths, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Legend, Area, AreaChart
} from "recharts";

const CHILD_AGE = 16;

const RegionalDashboard: React.FC = () => {
  const { userRegion, loading: authLoading } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const currencySymbol = regionCurrency?.symbol || "$";

  // Filter state
  const [quickPeriod, setQuickPeriod] = useState("1-month");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [eventType, setEventType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute date range from period
  const dateRange = useMemo(() => {
    const now = new Date();
    let from: Date;
    switch (quickPeriod) {
      case "1-month": from = subMonths(now, 1); break;
      case "3-months": from = subMonths(now, 3); break;
      case "6-months": from = subMonths(now, 6); break;
      case "1-year": from = subMonths(now, 12); break;
      case "custom": return { from: customRange.from, to: customRange.to || now };
      default: from = subMonths(now, 1);
    }
    return { from, to: now };
  }, [quickPeriod, customRange]);

  const dateFilters = useMemo(() => {
    if (!dateRange.from) return undefined;
    return {
      from: format(dateRange.from, "yyyy-MM-dd"),
      to: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    };
  }, [dateRange]);

  // Data hooks
  const { data: members, isLoading: membersLoading } = useMembers(userRegion?.id);
  const { data: events, isLoading: eventsLoading } = useRegionalEvents();
  const { data: financialSummary } = useFinancialSummary(dateFilters);
  const { data: financialTransactions } = useFinancialTransactions(dateFilters);
  const { data: discipleshipRelationships } = useDiscipleshipRelationships(userRegion?.id);
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: memberTarget } = useCurrentMemberTarget();

  // Fetch discipleship progress for success rate
  const { data: allProgress } = useQuery({
    queryKey: ['all-discipleship-progress', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return [];
      const { data, error } = await supabase
        .from('discipleship_progress')
        .select('relationship_id, milestone')
        .in('relationship_id', (discipleshipRelationships || []).map(r => r.id));
      if (error) throw error;
      return data || [];
    },
    enabled: !!userRegion?.id && (discipleshipRelationships || []).length > 0,
  });

  // ========== COMPUTED KPIs ==========
  const kpis = useMemo(() => {
    if (!members) return null;

    const isChild = (m: any) => {
      const dob = m.profiles?.date_of_birth;
      if (!dob) return false;
      return differenceInYears(new Date(), new Date(dob)) < CHILD_AGE;
    };

    const adults = members.filter(m => !isChild(m));
    const children = members.filter(m => isChild(m));
    const adultMembers = adults.filter(m => m.member_type === 'member');
    const adultVisitors = adults.filter(m => m.member_type === 'visitor');

    // 30-day growth
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const newAdults30 = adults.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newAdultsPrev = adults.filter(m => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const adultGrowth = newAdultsPrev > 0 ? ((newAdults30 - newAdultsPrev) / newAdultsPrev) * 100 : newAdults30 > 0 ? 100 : 0;

    const newChildren30 = children.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newChildrenPrev = children.filter(m => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const childGrowth = newChildrenPrev > 0 ? ((newChildren30 - newChildrenPrev) / newChildrenPrev) * 100 : newChildren30 > 0 ? 100 : 0;

    // Filter events by period and type
    const filteredEvents = (events || []).filter(e => {
      if (dateRange.from && new Date(e.start_datetime) < dateRange.from) return false;
      if (dateRange.to && new Date(e.start_datetime) > dateRange.to) return false;
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    const regionalEvents = filteredEvents.filter(e => !e.dcg_id && !e.is_special);
    const dcgEvents = filteredEvents.filter(e => !!e.dcg_id);

    // Filter attendance data
    const filteredAttendance = (attendanceData || []).filter(a => {
      if (dateRange.from && new Date(a.event_date) < dateRange.from) return false;
      if (dateRange.to && new Date(a.event_date) > dateRange.to) return false;
      if (searchQuery && !a.event_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (eventType === "regional") return !a.dcg_id;
      if (eventType === "dcg") return !!a.dcg_id;
      return true;
    });

    // Attendance by event type for KPIs
    const regionalAttendance = (attendanceData || []).filter(a => {
      if (dateRange.from && new Date(a.event_date) < dateRange.from) return false;
      if (dateRange.to && new Date(a.event_date) > dateRange.to) return false;
      return !a.dcg_id;
    });
    const dcgAttendance = (attendanceData || []).filter(a => {
      if (dateRange.from && new Date(a.event_date) < dateRange.from) return false;
      if (dateRange.to && new Date(a.event_date) > dateRange.to) return false;
      return !!a.dcg_id;
    });

    const avgRegionalAttendees = regionalAttendance.length > 0
      ? Math.round(regionalAttendance.reduce((s, a) => s + a.total_present, 0) / regionalAttendance.length)
      : 0;
    const avgDcgAttendees = dcgAttendance.length > 0
      ? Math.round(dcgAttendance.reduce((s, a) => s + a.total_present, 0) / dcgAttendance.length)
      : 0;

    // Attendance target %
    const totalCapacity = regionalEvents.reduce((s, e) => s + (e.attendance_target || e.capacity || 0), 0);
    const totalActual = regionalAttendance.reduce((s, a) => s + a.total_present, 0);
    const attendanceTargetPct = totalCapacity > 0 ? Math.round((totalActual / totalCapacity) * 100) : 0;

    // Discipleship success rate
    const totalRelationships = discipleshipRelationships?.length || 0;
    const successSet = new Set(
      (allProgress || []).filter(p => p.milestone === 'became_member').map(p => p.relationship_id)
    );
    const successRate = totalRelationships > 0 ? Math.round((successSet.size / totalRelationships) * 100) : 0;

    // Gender distribution
    const genderCounts = { adultFemale: 0, youngFemale: 0, adultMale: 0, youngMale: 0, unknown: 0 };
    members.forEach(m => {
      const gender = m.profiles?.gender?.toLowerCase();
      const child = isChild(m);
      if (!gender || (gender !== 'male' && gender !== 'female')) {
        genderCounts.unknown++;
      } else if (gender === 'female') {
        child ? genderCounts.youngFemale++ : genderCounts.adultFemale++;
      } else {
        child ? genderCounts.youngMale++ : genderCounts.adultMale++;
      }
    });

    // Tithers count
    const titheTransactions = (financialTransactions || []).filter(
      (t: any) => t.category?.name === 'Tithes'
    );
    const uniqueTithers = new Set(titheTransactions.map((t: any) => t.recorded_by)).size;

    // Income growth
    const totalIncome = financialSummary?.total_income || 0;

    return {
      totalAdults: adults.length,
      adultMembers: adultMembers.length,
      adultVisitors: adultVisitors.length,
      adultGrowth: Math.round(adultGrowth),
      totalChildren: children.length,
      childGrowth: Math.round(childGrowth),
      successRate,
      regionalEventsCount: regionalEvents.length,
      avgRegionalAttendees,
      dcgEventsCount: dcgEvents.length,
      avgDcgAttendees,
      attendanceTargetPct,
      genderCounts,
      uniqueTithers,
      totalIncome,
      filteredAttendance,
      targetMembers: memberTarget?.target_members || 0,
    };
  }, [members, events, attendanceData, discipleshipRelationships, allProgress, financialTransactions, financialSummary, dateRange, searchQuery, eventType, memberTarget]);

  // ========== CHART DATA ==========
  const trendChartData = useMemo(() => {
    if (!kpis?.filteredAttendance) return [];
    return [...kpis.filteredAttendance]
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .map(a => ({
        date: format(new Date(a.event_date), "MMM d"),
        Members: a.members_present,
        "Regular Visitors": a.visitors_present,
        Children: a.children_present,
      }));
  }, [kpis?.filteredAttendance]);

  const genderChartData = useMemo(() => {
    if (!kpis) return [];
    const data: { name: string; count: number; fill: string }[] = [
      { name: "Adult Females", count: kpis.genderCounts.adultFemale, fill: "hsl(var(--chart-1))" },
      { name: "Young Females", count: kpis.genderCounts.youngFemale, fill: "hsl(var(--chart-2))" },
      { name: "Adult Males", count: kpis.genderCounts.adultMale, fill: "hsl(var(--chart-3))" },
      { name: "Young Males", count: kpis.genderCounts.youngMale, fill: "hsl(var(--chart-4))" },
    ];
    if (kpis.genderCounts.unknown > 0) {
      data.push({ name: "Unknown", count: kpis.genderCounts.unknown, fill: "hsl(var(--chart-5))" });
    }
    return data;
  }, [kpis]);

  if (authLoading || !userRegion) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const periodOptions = [
    { value: "1-month", label: "1M" },
    { value: "3-months", label: "3M" },
    { value: "6-months", label: "6M" },
    { value: "1-year", label: "1Y" },
    { value: "custom", label: "Custom" },
  ];

  const GrowthIndicator = ({ value }: { value: number }) => (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
      value > 0 ? "text-emerald-500" : value < 0 ? "text-red-500" : "text-muted-foreground"
    )}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : null}
      {value > 0 ? "+" : ""}{value}%
    </span>
  );

  return (
    <div className="space-y-6">
      {/* ── STICKY FILTER BAR ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4 pt-1 -mt-1 border-b border-border/30">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {periodOptions.map(opt => (
              <Button
                key={opt.value}
                variant={quickPeriod === opt.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setQuickPeriod(opt.value)}
                className="h-8 px-3 rounded-lg text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {quickPeriod === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customRange.from
                    ? `${format(customRange.from, "MMM d")}${customRange.to ? ` - ${format(customRange.to, "MMM d, y")}` : ""}`
                    : "Pick dates"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: customRange.from, to: customRange.to }}
                  onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Event type dropdown */}
          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="regional">Regional Events</SelectItem>
              <SelectItem value="dcg">DCG Events</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
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

      {/* ── KPI CARDS ── */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <GlassKPICard
            icon={<Users className="h-5 w-5" />}
            label="Members"
            value={kpis.totalAdults}
            subtitle={`${kpis.adultMembers} members · ${kpis.adultVisitors} visitors`}
          />
          <GlassKPICard
            icon={<Baby className="h-5 w-5" />}
            label="Children"
            value={kpis.totalChildren}
            subtitle={kpis.childGrowth !== 0 ? `${kpis.childGrowth > 0 ? "+" : ""}${kpis.childGrowth}% (30d)` : "No change (30d)"}
          />
          <GlassKPICard
            icon={<Heart className="h-5 w-5" />}
            label="Discipleship Success"
            value={`${kpis.successRate}%`}
            subtitle="Reached membership milestone"
          />
          <GlassKPICard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Regional Events"
            value={kpis.regionalEventsCount}
            subtitle={`Avg: ${kpis.avgRegionalAttendees} attendees`}
          />
          <GlassKPICard
            icon={<UsersRound className="h-5 w-5" />}
            label="DCG Events"
            value={kpis.dcgEventsCount}
            subtitle={`Avg: ${kpis.avgDcgAttendees} attendees`}
          />
          <GlassKPICard
            icon={<Target className="h-5 w-5" />}
            label="Attendance Target"
            value={`${kpis.attendanceTargetPct}%`}
            subtitle="Of regional event capacity"
          />
        </div>
      )}

      {/* ── ATTENDANCE TREND CHART ── */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold mb-4 text-foreground">Attendance Trend</h3>
        {trendChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradChildren" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              {kpis && kpis.targetMembers > 0 && (
                <ReferenceLine
                  y={kpis.targetMembers}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="6 4"
                  label={{ value: `Target: ${kpis.targetMembers}`, position: "insideTopRight", fontSize: 11, fill: "hsl(var(--destructive))" }}
                />
              )}
              <Area type="monotone" dataKey="Members" stroke="hsl(var(--chart-1))" fill="url(#gradMembers)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="Regular Visitors" stroke="hsl(var(--chart-2))" fill="url(#gradVisitors)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="Children" stroke="hsl(var(--chart-4))" fill="url(#gradChildren)" strokeWidth={2.5} dot={false} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[380px] flex items-center justify-center text-muted-foreground text-sm">
            No attendance data for the selected period
          </div>
        )}
      </div>

      {/* ── BOTTOM ROW: Gender Distribution + Tithers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution (2/3) */}
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
          <h3 className="text-base font-semibold mb-4 text-foreground">Gender & Age Distribution</h3>
          {genderChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={genderChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {genderChartData.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No member data available
            </div>
          )}
        </div>

        {/* Tithers & Income (1/3) */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Banknote className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Tithers</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{kpis?.uniqueTithers ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Unique tithers this period</p>
          </div>

          <div className="border-t border-border/40 pt-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Total Income</span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {currencySymbol}{(kpis?.totalIncome ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">For the selected period</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalDashboard;
