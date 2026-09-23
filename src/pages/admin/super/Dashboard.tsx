import React, { useState, useMemo } from "react";
import {
  useGlobalMembersScoped,
  useGlobalEventsScoped,
  useGlobalFinancialSummaryScoped,
  useGlobalFinancialTransactionsScoped,
  useGlobalDiscipleshipRelationshipsScoped,
  useGlobalFundraisingCampaignsScoped,
  useGlobalActivePlanTargetsScoped,
  useGlobalDcgMembershipScoped,
  useGlobalAttendanceScoped,
  useGlobalSpecialEventIds,
  useGlobalDiscipleshipProgress,
} from "@/hooks/useGlobalDashboardData";
import { useAllRegions } from "@/hooks/useAllRegions";
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
  TrendingUp, TrendingDown, Search, CalendarIcon, Banknote, HandCoins, Crosshair, AlertCircle, Globe,
} from "lucide-react";
import { format, subMonths, subDays, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Legend, Area, AreaChart, Cell,
} from "recharts";

const SuperDashboard: React.FC = () => {
  // ── Filter state ──
  const [quickPeriod, setQuickPeriod] = useState("1-month");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [regionId, setRegionId] = useState<string>("all");
  const [eventType, setEventType] = useState("regional");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: regions } = useAllRegions({ includeInactive: false });

  // ── Date range ──
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

  // ── Data hooks (scoped) ──
  const { data: members, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useGlobalMembersScoped(regionId);
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useGlobalEventsScoped(regionId);
  const { data: financialSummary } = useGlobalFinancialSummaryScoped(regionId, dateFilters);
  const { data: prevFinancialSummary } = useGlobalFinancialSummaryScoped(regionId, prevDateFilters);
  const { data: financialTransactions, error: financialError, refetch: refetchFinancial } = useGlobalFinancialTransactionsScoped(regionId, dateFilters);
  const { data: discipleshipRelationships, error: discipleshipError, refetch: refetchDiscipleship } = useGlobalDiscipleshipRelationshipsScoped(regionId);
  const { data: attendanceData, error: attendanceError, refetch: refetchAttendance } = useGlobalAttendanceScoped(regionId);
  const { data: fundraisingCampaigns } = useGlobalFundraisingCampaignsScoped(regionId);
  const { data: activePlan } = useGlobalActivePlanTargetsScoped(regionId);
  const { data: dcgMembership } = useGlobalDcgMembershipScoped(regionId);
  const { data: specialEventIds } = useGlobalSpecialEventIds(regionId);

  // Member relationships for strict child detection
  const memberIds = useMemo(() => members?.map((m: any) => m.id) || [], [members]);
  const sortedKey = useMemo(() => [...memberIds].sort().join(","), [memberIds]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ["super-dashboard-member-rels", sortedKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  const adultDobLookup = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    (members || []).forEach((m: any) => map.set(m.id, m.profiles?.date_of_birth));
    return map;
  }, [members]);

  const relationshipIds = useMemo(
    () => (discipleshipRelationships || []).map((r: any) => r.id),
    [discipleshipRelationships],
  );
  const { data: allProgress } = useGlobalDiscipleshipProgress(relationshipIds);

  // ───── KPIs (mirror regional 1:1) ─────
  const kpis = useMemo(() => {
    if (!members) return null;

    const rels = (memberRelationships || []).map((r: any) => ({
      member_id: r.member_id,
      related_member_id: r.related_member_id,
    }));
    const specIds = specialEventIds || new Set<string>();

    const childrenSet = new Set<string>();
    members.forEach((m: any) => {
      if (isChildMember(m.profiles?.date_of_birth, m.id, rels, adultDobLookup)) {
        childrenSet.add(m.id);
      }
    });

    const adultMembersAndVisitors: any[] = [];
    const childrenList: any[] = [];
    members.forEach((m: any) => {
      if (childrenSet.has(m.id)) {
        childrenList.push(m);
      } else if (m.member_type === "visitor" && m.rated_event_id && specIds.has(m.rated_event_id)) {
        return;
      } else {
        adultMembersAndVisitors.push(m);
      }
    });

    const memberCount = adultMembersAndVisitors.filter((m) => m.member_type === "member").length;
    const visitorCount = adultMembersAndVisitors.filter((m) => m.member_type === "visitor").length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const newAdults30 = adultMembersAndVisitors.filter((m) => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newAdultsPrev = adultMembersAndVisitors.filter((m) => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const adultGrowth = newAdultsPrev > 0 ? Math.round(((newAdults30 - newAdultsPrev) / newAdultsPrev) * 100) : newAdults30 > 0 ? 100 : 0;
    const newChildren30 = childrenList.filter((m) => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newChildrenPrev = childrenList.filter((m) => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const childGrowth = newChildrenPrev > 0 ? Math.round(((newChildren30 - newChildrenPrev) / newChildrenPrev) * 100) : newChildren30 > 0 ? 100 : 0;

    const periodFilteredEvents = (events || []).filter((e: any) => {
      if (dateRange.from && new Date(e.start_datetime) < dateRange.from) return false;
      if (dateRange.to && new Date(e.start_datetime) > dateRange.to) return false;
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    const filteredEvents = periodFilteredEvents.filter((e: any) => {
      if (eventType === "regional") return !e.dcg_id && !e.is_special;
      if (eventType === "dcg") return !!e.dcg_id;
      return true;
    });

    const regionalEvents = filteredEvents.filter((e: any) => !e.dcg_id && !e.is_special);
    const dcgEvents = filteredEvents.filter((e: any) => !!e.dcg_id);

    const allEventsById = new Map((events || []).map((e: any) => [e.id, e] as const));
    const isRegionalSource = (a: any) => {
      if (!a.source_event_id) return !a.dcg_id;
      const src = allEventsById.get(a.source_event_id);
      if (!src) return !a.dcg_id;
      return !src.dcg_id && !src.is_special;
    };
    const isDcgSource = (a: any) => {
      if (a.source_event_id) {
        const src = allEventsById.get(a.source_event_id);
        if (src) return !!src.dcg_id;
      }
      return !!a.dcg_id;
    };

    const filteredAttendance = (attendanceData || []).filter((a: any) => {
      if (dateRange.from && new Date(a.event_date) < dateRange.from) return false;
      if (dateRange.to && new Date(a.event_date) > dateRange.to) return false;
      if (searchQuery && !a.event_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (eventType === "regional") return isRegionalSource(a);
      if (eventType === "dcg") return isDcgSource(a);
      return true;
    });

    const regionalAttendance = filteredAttendance.filter(isRegionalSource);
    const dcgAttendance = filteredAttendance.filter(isDcgSource);

    const avgRegionalAttendees = regionalAttendance.length > 0
      ? Math.round(regionalAttendance.reduce((s: number, a: any) => s + a.total_present, 0) / regionalAttendance.length) : 0;
    const avgDcgAttendees = dcgAttendance.length > 0
      ? Math.round(dcgAttendance.reduce((s: number, a: any) => s + a.total_present, 0) / dcgAttendance.length) : 0;

    const planTargets = activePlan?.targetsByKey || {};
    const totalActualRegional = regionalAttendance.reduce((s: number, a: any) => s + a.total_present, 0);
    const planTotalEventAttendees = planTargets["total_event_attendees"];
    const planAvgEventAttendance = planTargets["avg_event_attendance"];
    const planAvgDcgAttendance = planTargets["avg_dcg_attendance"];

    let regionalAttendanceTargetPct = 0;
    let regionalAttendanceTargetMissing = true;
    let regionalAttendanceTargetSubtitle = "No target set in Plan Management";
    if (planTotalEventAttendees && planTotalEventAttendees > 0) {
      regionalAttendanceTargetPct = Math.round((totalActualRegional / planTotalEventAttendees) * 100);
      regionalAttendanceTargetMissing = false;
      regionalAttendanceTargetSubtitle = `${totalActualRegional} / ${planTotalEventAttendees} target`;
    } else if (planAvgEventAttendance && planAvgEventAttendance > 0) {
      regionalAttendanceTargetPct = Math.round((avgRegionalAttendees / planAvgEventAttendance) * 100);
      regionalAttendanceTargetMissing = false;
      regionalAttendanceTargetSubtitle = `Avg ${avgRegionalAttendees} / ${planAvgEventAttendance} target`;
    }

    let dcgAttendanceTargetPct = 0;
    let dcgAttendanceTargetMissing = true;
    let dcgAttendanceTargetSubtitle = `Avg ${avgDcgAttendees} attendees — no target set`;
    if (planAvgDcgAttendance && planAvgDcgAttendance > 0) {
      dcgAttendanceTargetPct = Math.round((avgDcgAttendees / planAvgDcgAttendance) * 100);
      dcgAttendanceTargetMissing = false;
      dcgAttendanceTargetSubtitle = `Avg ${avgDcgAttendees} / ${planAvgDcgAttendance} target`;
    }

    const dcgTotalMembers = dcgMembership?.totalDcgMembers ?? 0;
    const dcgChildren = dcgMembership?.totalDcgChildren ?? 0;
    const dcgAdults = dcgMembership?.totalDcgAdults ?? 0;

    const totalRelationships = discipleshipRelationships?.length || 0;
    const successSet = new Set(
      (allProgress || []).filter((p: any) => p.milestone === "became_member").map((p: any) => p.relationship_id),
    );
    const successRate = totalRelationships > 0 ? Math.round((successSet.size / totalRelationships) * 100) : 0;

    const included = [...adultMembersAndVisitors, ...childrenList];
    const genderCounts = { adultFemale: 0, youngFemale: 0, adultMale: 0, youngMale: 0, unknown: 0 };
    included.forEach((m: any) => {
      const gender = m.profiles?.gender?.toLowerCase();
      const isChild = childrenSet.has(m.id);
      if (!gender || (gender !== "male" && gender !== "female")) genderCounts.unknown++;
      else if (gender === "female") isChild ? genderCounts.youngFemale++ : genderCounts.adultFemale++;
      else isChild ? genderCounts.youngMale++ : genderCounts.adultMale++;
    });

    const titheTx = (financialTransactions || []).filter((t: any) => t.category?.name === "Tithes");
    const uniqueTithers = new Set(titheTx.map((t: any) => t.recorded_by)).size;
    const incomeTx = (financialTransactions || []).filter((t: any) => t.category?.type?.toLowerCase() === "income");
    const uniqueGivers = new Set(incomeTx.map((t: any) => t.recorded_by)).size;

    const currentIncome = financialSummary?.total_income || 0;
    const previousIncome = prevFinancialSummary?.total_income || 0;
    const incomeGrowthPct = previousIncome > 0
      ? Math.round(((currentIncome - previousIncome) / previousIncome) * 100)
      : currentIncome > 0 ? 100 : 0;

    const campaigns = fundraisingCampaigns || [];
    const totalGoal = campaigns.reduce((s: number, c: any) => s + (c.goal || 0), 0);
    const totalRaised = campaigns.reduce((s: number, c: any) => s + (c.raised || 0), 0);
    const fundraisingTargetPct = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    // Target members (for trend reference line) — use plan total_event_attendees
    const targetMembers = planTotalEventAttendees && planTotalEventAttendees > 0 ? planTotalEventAttendees : 0;

    // Unique attendees within the filtered period (any event in scope)
    const uniqMembers = new Set<string>();
    const uniqVisitors = new Set<string>();
    const uniqChildren = new Set<string>();
    filteredAttendance.forEach((a: any) => {
      (a.present_member_ids || []).forEach((id: string) => uniqMembers.add(id));
      (a.present_visitor_ids || []).forEach((id: string) => uniqVisitors.add(id));
      (a.present_children_ids || []).forEach((id: string) => uniqChildren.add(id));
    });
    const uniqueAdultAttendees = uniqMembers.size + uniqVisitors.size;
    const uniqueMemberAttendees = uniqMembers.size;
    const uniqueVisitorAttendees = uniqVisitors.size;
    const uniqueChildAttendees = uniqChildren.size;

    return {
      totalAdults: adultMembersAndVisitors.length,
      memberCount, visitorCount, adultGrowth,
      totalChildren: childrenList.length, childGrowth,
      successRate,
      regionalEventsCount: regionalEvents.length,
      avgRegionalAttendees,
      dcgEventsCount: dcgEvents.length,
      avgDcgAttendees,
      regionalAttendanceTargetPct, regionalAttendanceTargetMissing, regionalAttendanceTargetSubtitle,
      dcgAttendanceTargetPct, dcgAttendanceTargetMissing, dcgAttendanceTargetSubtitle,
      dcgTotalMembers, dcgAdults, dcgChildren,
      genderCounts,
      uniqueTithers, uniqueGivers, incomeGrowthPct, fundraisingTargetPct,
      filteredAttendance, filteredEvents,
      targetMembers,
      uniqueAdultAttendees, uniqueMemberAttendees, uniqueVisitorAttendees, uniqueChildAttendees,
    };
  }, [members, events, attendanceData, discipleshipRelationships, allProgress, financialTransactions, financialSummary, prevFinancialSummary, fundraisingCampaigns, memberRelationships, adultDobLookup, specialEventIds, dateRange, searchQuery, eventType, activePlan, dcgMembership]);

  // ───── Trend chart data: weekly unique attendees by category ─────
  const trendChartData = useMemo(() => {
    const attendance = kpis?.filteredAttendance || [];
    if (attendance.length === 0) return [];

    type Bucket = { weekStart: Date; members: Set<string>; visitors: Set<string>; children: Set<string> };
    const buckets = new Map<number, Bucket>();

    attendance.forEach((a: any) => {
      const d = new Date(a.event_date);
      if (isNaN(d.getTime())) return;
      const ws = startOfWeek(d, { weekStartsOn: 1 });
      const key = ws.getTime();
      let b = buckets.get(key);
      if (!b) {
        b = { weekStart: ws, members: new Set(), visitors: new Set(), children: new Set() };
        buckets.set(key, b);
      }
      (a.present_member_ids || []).forEach((id: string) => b!.members.add(id));
      (a.present_visitor_ids || []).forEach((id: string) => b!.visitors.add(id));
      (a.present_children_ids || []).forEach((id: string) => b!.children.add(id));
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())
      .map((b) => ({
        date: format(b.weekStart, "MMM d"),
        Members: b.members.size,
        "Regular Visitors": b.visitors.size,
        Children: b.children.size,
      }));
  }, [kpis?.filteredAttendance]);


  const genderChartData = useMemo(() => {
    if (!kpis) return [];
    const data = [
      { name: "Adult Females", count: kpis.genderCounts.adultFemale, fill: "var(--chart-1)" },
      { name: "Young Females", count: kpis.genderCounts.youngFemale, fill: "var(--chart-4)" },
      { name: "Adult Males", count: kpis.genderCounts.adultMale, fill: "var(--chart-3)" },
      { name: "Young Males", count: kpis.genderCounts.youngMale, fill: "var(--chart-2)" },
    ];
    if (kpis.genderCounts.unknown > 0) {
      data.push({ name: "Unknown", count: kpis.genderCounts.unknown, fill: "var(--chart-5)" });
    }
    return data;
  }, [kpis]);

  // Initial skeleton (only when no data at all)
  if (membersLoading && !members) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-md" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    );
  }

  const dataErrorEntries = [
    { error: membersError, hasData: !!members, refetch: refetchMembers },
    { error: eventsError, hasData: !!events, refetch: refetchEvents },
    { error: financialError, hasData: !!financialTransactions, refetch: refetchFinancial },
    { error: discipleshipError, hasData: !!discipleshipRelationships, refetch: refetchDiscipleship },
    { error: attendanceError, hasData: !!attendanceData, refetch: refetchAttendance },
  ].filter((e) => e.error && !e.hasData);
  const dataErrors = dataErrorEntries.map((e: any) => e.error?.message || "A dashboard data request failed.");
  const retryFailedQueries = () => dataErrorEntries.forEach((e) => { try { e.refetch?.(); } catch { /* noop */ } });

  const dataErrorNotice = dataErrors.length > 0 ? (
    <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
      <div className="text-sm min-w-0 flex-1">
        <p className="font-medium text-destructive">Some dashboard data could not load.</p>
        <p className="text-xs text-muted-foreground break-words">{dataErrors[0]}</p>
        <p className="text-xs text-muted-foreground mt-1">This is usually a temporary network issue.</p>
      </div>
      <Button size="sm" variant="outline" onClick={retryFailedQueries}>Retry</Button>
    </div>
  ) : null;

  const periodOptions = [
    { value: "1-month", label: "1M" },
    { value: "3-months", label: "3M" },
    { value: "6-months", label: "6M" },
    { value: "1-year", label: "1Y" },
    { value: "custom", label: "Custom" },
  ];

  const selectedRegionName = regionId === "all"
    ? "All Regions"
    : (regions || []).find((r) => r.id === regionId)?.name || "Region";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* FIXED FILTER BAR */}
      <div className="shrink-0 z-20 bg-background/98 backdrop-blur-md border-b border-border/30 px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 p-1">
            {periodOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={quickPeriod === opt.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setQuickPeriod(opt.value)}
                className={cn("h-8 px-3 rounded-lg text-xs",
                  quickPeriod === opt.value && "bg-primary text-primary-foreground hover:bg-primary/90")}
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

          {/* Region filter */}
          <Select value={regionId} onValueChange={setRegionId}>
            <SelectTrigger className="w-full sm:w-[200px] h-8 text-xs rounded-lg">
              <Globe className="h-3.5 w-3.5 mr-1.5 opacity-70" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {(regions || []).map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regional">Regional Events</SelectItem>
              <SelectItem value="dcg">DCG Events</SelectItem>
            </SelectContent>
          </Select>

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

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {dataErrorNotice}

        {/* KPI CARDS */}
        {kpis && eventType === "regional" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <GlassKPICard icon={<Users className="h-5 w-5" />} label="Members" value={kpis.uniqueAdultAttendees}
              subtitle={`${kpis.uniqueMemberAttendees} members · ${kpis.uniqueVisitorAttendees} visitors attended`} />
            <GlassKPICard icon={<Baby className="h-5 w-5" />} label="Children" value={kpis.uniqueChildAttendees}
              subtitle="Unique attendees in period" />
            <GlassKPICard icon={<CalendarDays className="h-5 w-5" />} label="Regional Events" value={kpis.regionalEventsCount}
              subtitle={`Avg: ${kpis.avgRegionalAttendees} attendees`} />
            <GlassKPICard icon={<Target className="h-5 w-5" />} label="Attendance Target"
              value={kpis.regionalAttendanceTargetMissing ? "—" : `${kpis.regionalAttendanceTargetPct}%`}
              subtitle={kpis.regionalAttendanceTargetSubtitle} />
            <GlassKPICard icon={<Heart className="h-5 w-5" />} label="Discipleship Success"
              value={`${kpis.successRate}%`} subtitle="Reached membership milestone" />
          </div>
        )}

        {kpis && eventType === "dcg" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <GlassKPICard icon={<Users className="h-5 w-5" />} label="Members" value={kpis.uniqueAdultAttendees}
              subtitle={`${kpis.uniqueMemberAttendees} members · ${kpis.uniqueVisitorAttendees} visitors attended`} />
            <GlassKPICard icon={<Baby className="h-5 w-5" />} label="Children" value={kpis.uniqueChildAttendees}
              subtitle="Unique attendees in period" />
            <GlassKPICard icon={<UsersRound className="h-5 w-5" />} label="DCG Events" value={kpis.dcgEventsCount}
              subtitle={`Avg: ${kpis.avgDcgAttendees} attendees`} />
            <GlassKPICard icon={<Target className="h-5 w-5" />} label="Attendance Target"
              value={kpis.dcgAttendanceTargetMissing ? "—" : `${kpis.dcgAttendanceTargetPct}%`}
              subtitle={kpis.dcgAttendanceTargetSubtitle} />
            <GlassKPICard icon={<Heart className="h-5 w-5" />} label="Discipleship Success"
              value={`${kpis.successRate}%`} subtitle="Reached membership milestone" />
          </div>
        )}

        {/* ATTENDANCE TREND */}
        <div className="rounded-md border border-border/70 bg-card/85 p-6 shadow-card backdrop-blur-xl">
          <h3 className="text-base font-semibold text-foreground">Attendance Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Unique members, regular visitors and children attending at least one {eventType === "dcg" ? "DCG" : "regional"} event per week.
          </p>
          {trendChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={380}>
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="superGradMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="superGradVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="superGradChildren" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const total = payload.reduce((sum, p: any) => sum + (Number(p.value) || 0), 0);
                    return (
                      <div style={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px", fontSize: "12px",
                        padding: "8px 12px",
                        boxShadow: "0 4px 12px color-mix(in oklab, var(--foreground) calc(0.08 * 100%), transparent)",
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: "var(--foreground)" }}>Week of {label}</div>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} style={{ color: p.color }}>{p.dataKey} : {p.value}</div>
                        ))}
                        <div style={{
                          marginTop: 6, paddingTop: 6,
                          borderTop: "1px solid var(--border)",
                          fontWeight: 600, color: "var(--foreground)",
                        }}>Total : {total}</div>
                      </div>
                    );
                  }}
                />
                {kpis && kpis.targetMembers > 0 && (
                  <ReferenceLine y={kpis.targetMembers} stroke="var(--destructive)" strokeDasharray="6 4"
                    label={{ value: `Target: ${kpis.targetMembers}`, position: "insideTopRight", fontSize: 11, fill: "var(--destructive)" }} />
                )}
                <Area type="monotone" dataKey="Members" stroke="var(--chart-1)" fill="url(#superGradMembers)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="Regular Visitors" stroke="var(--chart-2)" fill="url(#superGradVisitors)" strokeWidth={2.5} dot={false} />
                <Area type="monotone" dataKey="Children" stroke="var(--chart-3)" fill="url(#superGradChildren)" strokeWidth={2.5} dot={false} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[380px] flex items-center justify-center text-muted-foreground text-sm">
              No attendance data for the selected period
            </div>
          )}
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-md border border-border/70 bg-card/85 p-6 shadow-card backdrop-blur-xl lg:col-span-2">
            <h3 className="text-base font-semibold mb-4 text-foreground">Gender & Age Distribution</h3>
            {genderChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genderChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "12px" }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {genderChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No member data available
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-md border border-border/70 bg-card/85 shadow-card backdrop-blur-xl">
            <div className="grid grid-cols-2 grid-rows-2 h-full">
              <div className="p-5 border-r border-b border-border/30 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Banknote className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Tithers</span>
                </div>
                <p className="font-bold text-foreground text-lg">{kpis?.uniqueTithers ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Unique this period</p>
              </div>

              <div className="p-5 border-b border-border/30 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <HandCoins className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Givers</span>
                </div>
                <p className="font-bold text-foreground text-lg">{kpis?.uniqueGivers ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Unique this period</p>
              </div>

              <div className="p-5 border-r border-border/30 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg",
                    (kpis?.incomeGrowthPct ?? 0) >= 0 ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive")}>
                    {(kpis?.incomeGrowthPct ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Income Growth</span>
                </div>
                <p className={cn("text-2xl font-bold",
                  (kpis?.incomeGrowthPct ?? 0) >= 0 ? "text-green-600" : "text-destructive")}>
                  {(kpis?.incomeGrowthPct ?? 0) > 0 ? "+" : ""}{kpis?.incomeGrowthPct ?? 0}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">vs previous period</p>
              </div>

              <div className="p-5 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Crosshair className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Fundraising</span>
                </div>
                <p className="font-bold text-foreground text-lg">{kpis?.fundraisingTargetPct ?? 0}%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Of all campaign goals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperDashboard;
