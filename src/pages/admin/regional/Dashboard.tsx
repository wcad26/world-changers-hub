import React, { useState, useMemo } from "react";
import { useRegionalSession } from "@/contexts/RegionalSessionContext";
import { useMembers } from "@/hooks/useMembers";
import { useRegionalEvents } from "@/hooks/useEvents";
import { useFinancialSummary, useFinancialTransactions } from "@/hooks/useFinancials";
import { useDiscipleshipRelationships } from "@/hooks/useDiscipleship";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useCurrentMemberTarget } from "@/hooks/useMemberTargets";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { useFundraisingCampaigns } from "@/hooks/useFundraisingCampaigns";
import { isChildMember } from "@/utils/childUtils";
import { fetchMemberRelationshipsForMembers } from "@/utils/fetchMemberRelationships";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlassKPICard } from "@/components/ui/GlassSection";
import {
  Users, Baby, Heart, CalendarDays, UsersRound, Target,
  TrendingUp, TrendingDown, Search, CalendarIcon, Banknote, HandCoins, BarChart3, Crosshair, AlertCircle
} from "lucide-react";
import { format, subMonths, subDays, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Legend, Area, AreaChart, Cell
} from "recharts";

const CHILD_AGE = 16;

const RegionalDashboard: React.FC = () => {
  const { region: userRegion, profile, ready, user, retry: retryRegional, signOut, bootstrapAvailable } = useRegionalSession();
  // Only show the auth-loading skeleton until session restoration completes.
  // After that, render the dashboard even if region/profile are still being
  // fetched — region-dependent widgets gracefully handle missing region.
  const authLoading = !ready;
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);

  // Filter state
  const [quickPeriod, setQuickPeriod] = useState("1-month");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [eventType, setEventType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute date range
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

  // Previous period for income growth comparison
  const prevDateFilters = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return undefined;
    const duration = dateRange.to.getTime() - dateRange.from.getTime();
    const prevTo = new Date(dateRange.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - duration);
    return {
      from: format(prevFrom, "yyyy-MM-dd"),
      to: format(prevTo, "yyyy-MM-dd"),
    };
  }, [dateRange]);

  // Data hooks
  const { data: members, isLoading: membersLoading, error: membersError } = useMembers(userRegion?.id);
  const { data: events, isLoading: eventsLoading, error: eventsError } = useRegionalEvents();
  const { data: financialSummary } = useFinancialSummary(dateFilters);
  const { data: prevFinancialSummary } = useFinancialSummary(prevDateFilters);
  const { data: financialTransactions, error: financialError } = useFinancialTransactions(dateFilters);
  const { data: discipleshipRelationships, error: discipleshipError } = useDiscipleshipRelationships(userRegion?.id);
  const { data: attendanceData, error: attendanceError } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const { data: memberTarget } = useCurrentMemberTarget();
  const { data: fundraisingCampaigns } = useFundraisingCampaigns();

  // Fetch member relationships for strict child detection (age <16 AND adult relationship).
  const memberIds = React.useMemo(() => members?.map(m => m.id) || [], [members]);
  const sortedMemberIdsKey = React.useMemo(() => [...memberIds].sort().join(','), [memberIds]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dashboard-member-relationships', sortedMemberIdsKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  // Lookup of member id → date_of_birth, used to verify the related party is an adult.
  const adultDobLookup = React.useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    (members || []).forEach(m => map.set(m.id, m.profiles?.date_of_birth));
    return map;
  }, [members]);

  // Fetch special event IDs to exclude special event visitors
  const { data: specialEventIds } = useQuery({
    queryKey: ['special-event-ids', userRegion?.id],
    queryFn: async () => {
      if (!userRegion?.id) return new Set<string>();
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('region_id', userRegion.id)
        .eq('is_special', true);
      return new Set((data || []).map(e => e.id));
    },
    enabled: !!userRegion?.id,
  });

  // Discipleship progress
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

    const rels = (memberRelationships || []).map(r => ({
      member_id: r.member_id,
      related_member_id: r.related_member_id,
    }));

    const specIds = specialEventIds || new Set<string>();

    // Categorize members exactly like MemberKPICards
    const childrenSet = new Set<string>();
    members.forEach(m => {
      if (isChildMember(m.profiles?.date_of_birth, m.id, rels, adultDobLookup)) {
        childrenSet.add(m.id);
      }
    });

    const adultMembersAndVisitors: typeof members = [];
    const childrenList: typeof members = [];

    members.forEach(m => {
      if (childrenSet.has(m.id)) {
        childrenList.push(m);
      } else if (m.member_type === 'visitor' && m.rated_event_id && specIds.has(m.rated_event_id)) {
        // Special event visitor — EXCLUDED from dashboard
        return;
      } else {
        adultMembersAndVisitors.push(m);
      }
    });

    const memberCount = adultMembersAndVisitors.filter(m => m.member_type === 'member').length;
    const visitorCount = adultMembersAndVisitors.filter(m => m.member_type === 'visitor').length;

    // 30-day growth
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const newAdults30 = adultMembersAndVisitors.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newAdultsPrev = adultMembersAndVisitors.filter(m => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const adultGrowth = newAdultsPrev > 0 ? Math.round(((newAdults30 - newAdultsPrev) / newAdultsPrev) * 100) : newAdults30 > 0 ? 100 : 0;

    const newChildren30 = childrenList.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newChildrenPrev = childrenList.filter(m => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const childGrowth = newChildrenPrev > 0 ? Math.round(((newChildren30 - newChildrenPrev) / newChildrenPrev) * 100) : newChildren30 > 0 ? 100 : 0;

    // Filter events by period, search, and type
    const periodFilteredEvents = (events || []).filter(e => {
      if (dateRange.from && new Date(e.start_datetime) < dateRange.from) return false;
      if (dateRange.to && new Date(e.start_datetime) > dateRange.to) return false;
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    // Apply eventType filter to events
    const filteredEvents = periodFilteredEvents.filter(e => {
      if (eventType === "regional") return !e.dcg_id && !e.is_special;
      if (eventType === "dcg") return !!e.dcg_id;
      return true;
    });

    const regionalEvents = filteredEvents.filter(e => !e.dcg_id && !e.is_special);
    const dcgEvents = filteredEvents.filter(e => !!e.dcg_id);

    // Filter attendance data — apply ALL filters uniformly
    const filteredAttendance = (attendanceData || []).filter(a => {
      if (dateRange.from && new Date(a.event_date) < dateRange.from) return false;
      if (dateRange.to && new Date(a.event_date) > dateRange.to) return false;
      if (searchQuery && !a.event_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (eventType === "regional") return !a.dcg_id;
      if (eventType === "dcg") return !!a.dcg_id;
      return true;
    });

    const regionalAttendance = filteredAttendance.filter(a => !a.dcg_id);
    const dcgAttendance = filteredAttendance.filter(a => !!a.dcg_id);

    const avgRegionalAttendees = regionalAttendance.length > 0
      ? Math.round(regionalAttendance.reduce((s, a) => s + a.total_present, 0) / regionalAttendance.length) : 0;
    const avgDcgAttendees = dcgAttendance.length > 0
      ? Math.round(dcgAttendance.reduce((s, a) => s + a.total_present, 0) / dcgAttendance.length) : 0;

    // Attendance target % — use filtered attendance and events
    const totalCapacity = regionalEvents.reduce((s, e) => s + (e.attendance_target || e.capacity || 0), 0);
    const totalActual = regionalAttendance.reduce((s, a) => s + a.total_present, 0);
    const attendanceTargetPct = totalCapacity > 0 ? Math.round((totalActual / totalCapacity) * 100) : 0;

    // Discipleship success rate
    const totalRelationships = discipleshipRelationships?.length || 0;
    const successSet = new Set(
      (allProgress || []).filter(p => p.milestone === 'became_member').map(p => p.relationship_id)
    );
    const successRate = totalRelationships > 0 ? Math.round((successSet.size / totalRelationships) * 100) : 0;

    // Gender distribution — exclude special event visitors, include members+regular visitors+children
    const includedMembers = [...adultMembersAndVisitors, ...childrenList];
    const genderCounts = { adultFemale: 0, youngFemale: 0, adultMale: 0, youngMale: 0, unknown: 0 };
    includedMembers.forEach(m => {
      const gender = m.profiles?.gender?.toLowerCase();
      const isChild = childrenSet.has(m.id);
      if (!gender || (gender !== 'male' && gender !== 'female')) {
        genderCounts.unknown++;
      } else if (gender === 'female') {
        isChild ? genderCounts.youngFemale++ : genderCounts.adultFemale++;
      } else {
        isChild ? genderCounts.youngMale++ : genderCounts.adultMale++;
      }
    });

    // Tithers & Givers
    const titheTransactions = (financialTransactions || []).filter(
      (t: any) => t.category?.name === 'Tithes'
    );
    const uniqueTithers = new Set(titheTransactions.map((t: any) => t.recorded_by)).size;

    const incomeTransactions = (financialTransactions || []).filter(
      (t: any) => t.category?.type?.toLowerCase() === 'income'
    );
    const uniqueGivers = new Set(incomeTransactions.map((t: any) => t.recorded_by)).size;

    // Income growth %
    const currentIncome = financialSummary?.total_income || 0;
    const previousIncome = prevFinancialSummary?.total_income || 0;
    const incomeGrowthPct = previousIncome > 0
      ? Math.round(((currentIncome - previousIncome) / previousIncome) * 100)
      : currentIncome > 0 ? 100 : 0;

    // Fundraising target %
    const campaigns = fundraisingCampaigns || [];
    const totalGoal = campaigns.reduce((s, c) => s + (c.goal || 0), 0);
    const totalRaised = campaigns.reduce((s, c) => s + (c.raised || 0), 0);
    const fundraisingTargetPct = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    return {
      totalAdults: adultMembersAndVisitors.length,
      memberCount,
      visitorCount,
      adultGrowth,
      totalChildren: childrenList.length,
      childGrowth,
      successRate,
      regionalEventsCount: regionalEvents.length,
      avgRegionalAttendees,
      dcgEventsCount: dcgEvents.length,
      avgDcgAttendees,
      attendanceTargetPct,
      genderCounts,
      uniqueTithers,
      uniqueGivers,
      incomeGrowthPct,
      fundraisingTargetPct,
      filteredAttendance,
      targetMembers: memberTarget?.target_members || 0,
    };
  }, [members, events, attendanceData, discipleshipRelationships, allProgress, financialTransactions, financialSummary, prevFinancialSummary, fundraisingCampaigns, memberRelationships, adultDobLookup, specialEventIds, dateRange, searchQuery, eventType, memberTarget]);

  // ========== CHART DATA ==========
  const trendChartData = useMemo(() => {
    if (!kpis?.filteredAttendance) return [];
    const records = kpis.filteredAttendance;

    // Decide aggregation mode based on selected period
    let monthsCount = 0;
    if (quickPeriod === "1-month") monthsCount = 0;
    else if (quickPeriod === "3-months") monthsCount = 3;
    else if (quickPeriod === "6-months") monthsCount = 6;
    else if (quickPeriod === "1-year") monthsCount = 12;
    else if (quickPeriod === "custom" && dateRange.from && dateRange.to) {
      const days = (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24);
      if (days > 31) {
        monthsCount = Math.max(
          1,
          (dateRange.to.getFullYear() - dateRange.from.getFullYear()) * 12 +
            (dateRange.to.getMonth() - dateRange.from.getMonth()) + 1
        );
      }
    }

    // Per-event mode (1M or short custom range)
    if (monthsCount === 0) {
      return [...records]
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .map(a => ({
          date: format(new Date(a.event_date), "MMM d"),
          Members: a.members_present,
          "Regular Visitors": a.visitors_present,
          Children: a.children_present,
        }));
    }

    // Monthly mode: build target month buckets ending at dateRange.to (or now)
    const endDate = dateRange.to || new Date();
    const buckets: { key: string; label: string; year: number; month: number }[] = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = monthsCount > 12
        ? format(d, "MMM yyyy")
        : format(d, "MMM");
      buckets.push({ key, label, year: d.getFullYear(), month: d.getMonth() });
    }

    // Group records by yyyy-MM
    const groups = new Map<string, { m: number; v: number; c: number; n: number }>();
    records.forEach(a => {
      const d = new Date(a.event_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const g = groups.get(key) || { m: 0, v: 0, c: 0, n: 0 };
      g.m += a.members_present || 0;
      g.v += a.visitors_present || 0;
      g.c += a.children_present || 0;
      g.n += 1;
      groups.set(key, g);
    });

    return buckets.map(b => {
      const g = groups.get(b.key);
      return {
        date: b.label,
        Members: g && g.n > 0 ? Math.round(g.m / g.n) : 0,
        "Regular Visitors": g && g.n > 0 ? Math.round(g.v / g.n) : 0,
        Children: g && g.n > 0 ? Math.round(g.c / g.n) : 0,
      };
    });
  }, [kpis?.filteredAttendance, quickPeriod, dateRange]);

  const genderChartData = useMemo(() => {
    if (!kpis) return [];
    const data: { name: string; count: number; fill: string }[] = [
      { name: "Adult Females", count: kpis.genderCounts.adultFemale, fill: "hsl(var(--chart-1))" },
      { name: "Young Females", count: kpis.genderCounts.youngFemale, fill: "hsl(var(--chart-4))" },
      { name: "Adult Males", count: kpis.genderCounts.adultMale, fill: "hsl(var(--chart-3))" },
      { name: "Young Males", count: kpis.genderCounts.youngMale, fill: "hsl(var(--chart-2))" },
    ];
    if (kpis.genderCounts.unknown > 0) {
      data.push({ name: "Unknown", count: kpis.genderCounts.unknown, fill: "hsl(var(--chart-5))" });
    }
    return data;
  }, [kpis]);

  if (authLoading) {
    return (
      <div className="space-y-6 p-6">
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

  // We intentionally do NOT block the dashboard if `userRegion` is still
  // resolving — the inline notice below shows once and the page renders.
  const dataErrors = [membersError, eventsError, financialError, discipleshipError, attendanceError]
    .filter(Boolean)
    .map((error: any) => error?.message || 'A dashboard data request failed.');

  const regionMissingNotice = !userRegion ? (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm">
        <p className="font-medium">We could not resolve your region yet.</p>
        <div className="mt-1 space-y-0.5 text-muted-foreground text-xs">
          <p>{user ? 'Your session exists, but the regional link is still being resolved.' : 'Your session is still loading.'}</p>
          <p>User: {user?.email || user?.id || 'not detected'} · Bootstrap: {bootstrapAvailable ? 'available' : 'missing'}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={retryRegional}>Retry</Button>
        <Button size="sm" variant="ghost" onClick={async () => { try { await signOut(); } finally { if (typeof window !== 'undefined') window.location.replace('/auth/regional'); } }}>Logout</Button>
      </div>
    </div>
  ) : null;

  const dataErrorNotice = dataErrors.length > 0 ? (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
      <div className="text-sm min-w-0">
        <p className="font-medium text-destructive">Some dashboard data could not load.</p>
        <p className="text-xs text-muted-foreground break-words">{dataErrors[0]}</p>
      </div>
    </div>
  ) : null;

  const periodOptions = [
    { value: "1-month", label: "1M" },
    { value: "3-months", label: "3M" },
    { value: "6-months", label: "6M" },
    { value: "1-year", label: "1Y" },
    { value: "custom", label: "Custom" },
  ];

  const GrowthIndicator = ({ value }: { value: number }) => (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
      value > 0 ? "text-green-600" : value < 0 ? "text-destructive" : "text-muted-foreground"
    )}>
      {value > 0 ? <TrendingUp className="h-3 w-3" /> : value < 0 ? <TrendingDown className="h-3 w-3" /> : null}
      {value > 0 ? "+" : ""}{value}%
    </span>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── FIXED FILTER BAR (never scrolls) ── */}
      <div className="shrink-0 z-20 bg-background/98 backdrop-blur-md border-b border-border/30 px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          {/* Period */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {periodOptions.map(opt => (
              <Button
                key={opt.value}
                variant={quickPeriod === opt.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setQuickPeriod(opt.value)}
                className={cn(
                  "h-8 px-3 rounded-lg text-xs",
                  quickPeriod === opt.value && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
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
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="regional">Regional Events</SelectItem>
              <SelectItem value="dcg">DCG Events</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
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
      {regionMissingNotice}
      {dataErrorNotice}
      {/* ── KPI CARDS ── */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <GlassKPICard
            icon={<Users className="h-5 w-5" />}
            label="Members"
            value={kpis.totalAdults}
            subtitle={`${kpis.memberCount} members · ${kpis.visitorCount} visitors`}
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

      {/* ── BOTTOM ROW: Gender Distribution + Tithers/Givers/Income/Fundraising ── */}
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
                    <Cell key={idx} fill={entry.fill} />
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

        {/* 4-Quadrant Card (1/3) */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-2 grid-rows-2 h-full">
            {/* Tithers */}
            <div className="p-5 border-r border-b border-border/30 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Banknote className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Tithers</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis?.uniqueTithers ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Unique this period</p>
            </div>

            {/* Givers */}
            <div className="p-5 border-b border-border/30 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <HandCoins className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Givers</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis?.uniqueGivers ?? 0}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Unique this period</p>
            </div>

            {/* Income Growth */}
            <div className="p-5 border-r border-border/30 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  (kpis?.incomeGrowthPct ?? 0) >= 0 ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                )}>
                  {(kpis?.incomeGrowthPct ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
                <span className="text-xs font-medium text-muted-foreground">Income Growth</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                (kpis?.incomeGrowthPct ?? 0) >= 0 ? "text-green-600" : "text-destructive"
              )}>
                {(kpis?.incomeGrowthPct ?? 0) > 0 ? "+" : ""}{kpis?.incomeGrowthPct ?? 0}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">vs previous period</p>
            </div>

            {/* Fundraising Target */}
            <div className="p-5 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Crosshair className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Fundraising</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpis?.fundraisingTargetPct ?? 0}%</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Of all campaign goals</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RegionalDashboard;
