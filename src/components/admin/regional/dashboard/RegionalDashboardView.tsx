import React, { useState, useMemo } from "react";
import { useMembers } from "@/hooks/useMembers";
import { useRegionalEvents } from "@/hooks/useEvents";
import { useFinancialSummary, useFinancialTransactions } from "@/hooks/useFinancials";
import { useDiscipleshipRelationships } from "@/hooks/useDiscipleship";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useCurrentMemberTarget } from "@/hooks/useMemberTargets";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { useFundraisingCampaigns } from "@/hooks/useFundraisingCampaigns";
import { useActivePlanTargets } from "@/hooks/useActivePlanTargets";
import { useDcgRegionMembership } from "@/hooks/useDcgRegionMembership";
import { isChildMember } from "@/utils/childUtils";
import { fetchMemberRelationshipsForMembers } from "@/utils/fetchMemberRelationships";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GlassKPICard } from "@/components/ui/GlassSection";
import {
  Users, Baby, Heart, CalendarDays, UsersRound, Target,
  TrendingUp, TrendingDown, Search, CalendarIcon, Banknote, HandCoins, Crosshair, AlertCircle
} from "lucide-react";
import { format, subMonths, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, BarChart, Bar, Legend, Area, AreaChart, Cell
} from "recharts";

interface RegionLike {
  id: string;
  name?: string | null;
}

interface RegionalDashboardViewProps {
  region: RegionLike | null | undefined;
  /** When provided, shown as a notice if region is missing instead of the auth-bound retry banner. */
  missingRegionMessage?: string;
}

const RegionalDashboardView: React.FC<RegionalDashboardViewProps> = ({ region, missingRegionMessage }) => {
  const regionId = region?.id;
  const { data: regionCurrency } = useRegionCurrency(regionId);

  // Filter state
  const [quickPeriod, setQuickPeriod] = useState("1-month");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [eventType, setEventType] = useState("regional");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Data hooks — all scoped to the passed-in region.
  const { data: members, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useMembers(regionId);
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useRegionalEvents(regionId);
  const { data: financialSummary } = useFinancialSummary(dateFilters, regionId);
  const { data: prevFinancialSummary } = useFinancialSummary(prevDateFilters, regionId);
  const { data: financialTransactions, error: financialError, refetch: refetchFinancial } = useFinancialTransactions(dateFilters, regionId);
  const { data: discipleshipRelationships, error: discipleshipError, refetch: refetchDiscipleship } = useDiscipleshipRelationships(regionId);
  const { data: attendanceData, error: attendanceError, refetch: refetchAttendance } = useAttendanceHistoryWithMemberTypes(regionId);
  const { data: memberTarget } = useCurrentMemberTarget(regionId);
  const { data: fundraisingCampaigns } = useFundraisingCampaigns(undefined, regionId);
  const { data: activePlan } = useActivePlanTargets(regionId);
  const { data: dcgMembership } = useDcgRegionMembership(regionId);

  const memberIds = React.useMemo(() => members?.map(m => m.id) || [], [members]);
  const sortedMemberIdsKey = React.useMemo(() => [...memberIds].sort().join(','), [memberIds]);
  const { data: memberRelationships = [] } = useQuery({
    queryKey: ['dashboard-member-relationships', sortedMemberIdsKey],
    queryFn: () => fetchMemberRelationshipsForMembers(memberIds),
    enabled: memberIds.length > 0,
  });

  const adultDobLookup = React.useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    (members || []).forEach(m => map.set(m.id, m.profiles?.date_of_birth));
    return map;
  }, [members]);

  const { data: specialEventIds } = useQuery({
    queryKey: ['special-event-ids', regionId],
    queryFn: async () => {
      if (!regionId) return new Set<string>();
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('region_id', regionId)
        .eq('is_special', true);
      return new Set((data || []).map(e => e.id));
    },
    enabled: !!regionId,
  });

  const { data: allProgress } = useQuery({
    queryKey: ['all-discipleship-progress', regionId],
    queryFn: async () => {
      if (!regionId) return [];
      const { data, error } = await supabase
        .from('discipleship_progress')
        .select('relationship_id, milestone')
        .in('relationship_id', (discipleshipRelationships || []).map(r => r.id));
      if (error) throw error;
      return data || [];
    },
    enabled: !!regionId && (discipleshipRelationships || []).length > 0,
  });

  const kpis = useMemo(() => {
    if (!members) return null;

    const rels = (memberRelationships || []).map(r => ({
      member_id: r.member_id,
      related_member_id: r.related_member_id,
    }));

    const specIds = specialEventIds || new Set<string>();

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
        return;
      } else {
        adultMembersAndVisitors.push(m);
      }
    });

    const memberCount = adultMembersAndVisitors.filter(m => m.member_type === 'member').length;
    const visitorCount = adultMembersAndVisitors.filter(m => m.member_type === 'visitor').length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixtyDaysAgo = subDays(new Date(), 60);
    const newAdults30 = adultMembersAndVisitors.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newAdultsPrev = adultMembersAndVisitors.filter(m => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const adultGrowth = newAdultsPrev > 0 ? Math.round(((newAdults30 - newAdultsPrev) / newAdultsPrev) * 100) : newAdults30 > 0 ? 100 : 0;

    const newChildren30 = childrenList.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;
    const newChildrenPrev = childrenList.filter(m => m.created_at && new Date(m.created_at) >= sixtyDaysAgo && new Date(m.created_at) < thirtyDaysAgo).length;
    const childGrowth = newChildrenPrev > 0 ? Math.round(((newChildren30 - newChildrenPrev) / newChildrenPrev) * 100) : newChildren30 > 0 ? 100 : 0;

    const periodFilteredEvents = (events || []).filter(e => {
      if (dateRange.from && new Date(e.start_datetime) < dateRange.from) return false;
      if (dateRange.to && new Date(e.start_datetime) > dateRange.to) return false;
      if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    const filteredEvents = periodFilteredEvents.filter(e => {
      if (eventType === "regional") return !e.dcg_id && !e.is_special;
      if (eventType === "dcg") return !!e.dcg_id;
      return true;
    });

    const regionalEvents = filteredEvents.filter(e => !e.dcg_id && !e.is_special);
    const dcgEvents = filteredEvents.filter(e => !!e.dcg_id);

    const allEventsById = new Map((events || []).map(e => [e.id, e] as const));
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

    const filteredAttendance = (attendanceData || []).filter(a => {
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
      ? Math.round(regionalAttendance.reduce((s, a) => s + a.total_present, 0) / regionalAttendance.length) : 0;
    const avgDcgAttendees = dcgAttendance.length > 0
      ? Math.round(dcgAttendance.reduce((s, a) => s + a.total_present, 0) / dcgAttendance.length) : 0;

    const planTargets = activePlan?.targetsByKey || {};
    const totalActualRegional = regionalAttendance.reduce((s, a) => s + a.total_present, 0);
    const planTotalEventAttendees = planTargets['total_event_attendees'];
    const planAvgEventAttendance = planTargets['avg_event_attendance'];
    const planAvgDcgAttendance = planTargets['avg_dcg_attendance'];

    let regionalAttendanceTargetPct = 0;
    let regionalAttendanceTargetMissing = true;
    let regionalAttendanceTargetSubtitle = 'No target set in Plan Management';
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
      (allProgress || []).filter(p => p.milestone === 'became_member').map(p => p.relationship_id)
    );
    const successRate = totalRelationships > 0 ? Math.round((successSet.size / totalRelationships) * 100) : 0;

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

    const titheTransactions = (financialTransactions || []).filter(
      (t: any) => t.category?.name === 'Tithes'
    );
    const uniqueTithers = new Set(titheTransactions.map((t: any) => t.recorded_by)).size;

    const incomeTransactions = (financialTransactions || []).filter(
      (t: any) => t.category?.type?.toLowerCase() === 'income'
    );
    const uniqueGivers = new Set(incomeTransactions.map((t: any) => t.recorded_by)).size;

    const currentIncome = financialSummary?.total_income || 0;
    const previousIncome = prevFinancialSummary?.total_income || 0;
    const incomeGrowthPct = previousIncome > 0
      ? Math.round(((currentIncome - previousIncome) / previousIncome) * 100)
      : currentIncome > 0 ? 100 : 0;

    const campaigns = fundraisingCampaigns || [];
    const totalGoal = campaigns.reduce((s, c) => s + (c.goal || 0), 0);
    const totalRaised = campaigns.reduce((s, c) => s + (c.raised || 0), 0);
    const fundraisingTargetPct = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    const uniqMembers = new Set<string>();
    const uniqVisitors = new Set<string>();
    const uniqChildren = new Set<string>();
    filteredAttendance.forEach((a: any) => {
      (a.present_member_ids || []).forEach((id: string) => uniqMembers.add(id));
      (a.present_visitor_ids || []).forEach((id: string) => uniqVisitors.add(id));
      (a.present_children_ids || []).forEach((id: string) => uniqChildren.add(id));
    });
    const uniqueMemberAttendees = uniqMembers.size;
    const uniqueVisitorAttendees = uniqVisitors.size;
    const uniqueAdultAttendees = uniqueMemberAttendees + uniqueVisitorAttendees;
    const uniqueChildAttendees = uniqChildren.size;

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
      regionalAttendanceTargetPct,
      regionalAttendanceTargetMissing,
      regionalAttendanceTargetSubtitle,
      dcgAttendanceTargetPct,
      dcgAttendanceTargetMissing,
      dcgAttendanceTargetSubtitle,
      dcgTotalMembers,
      dcgAdults,
      dcgChildren,
      genderCounts,
      uniqueTithers,
      uniqueGivers,
      incomeGrowthPct,
      fundraisingTargetPct,
      filteredAttendance,
      filteredEvents,
      targetMembers: memberTarget?.target_members || 0,
      uniqueAdultAttendees,
      uniqueMemberAttendees,
      uniqueVisitorAttendees,
      uniqueChildAttendees,
    };
  }, [members, events, attendanceData, discipleshipRelationships, allProgress, financialTransactions, financialSummary, prevFinancialSummary, fundraisingCampaigns, memberRelationships, adultDobLookup, specialEventIds, dateRange, searchQuery, eventType, memberTarget, activePlan, dcgMembership]);

  const trendChartData = useMemo(() => {
    if (!kpis?.filteredEvents) return [];
    const eventsInPeriod = kpis.filteredEvents;
    const attendance = kpis.filteredAttendance || [];

    const aggBySourceId = new Map<string, { m: Set<string>; v: Set<string>; c: Set<string> }>();
    attendance.forEach((a: any) => {
      if (!a.source_event_id) return;
      const cur = aggBySourceId.get(a.source_event_id) || {
        m: new Set<string>(), v: new Set<string>(), c: new Set<string>(),
      };
      (a.present_member_ids || []).forEach((id: string) => cur.m.add(id));
      (a.present_visitor_ids || []).forEach((id: string) => cur.v.add(id));
      (a.present_children_ids || []).forEach((id: string) => cur.c.add(id));
      aggBySourceId.set(a.source_event_id, cur);
    });

    const perEventPoints = [...eventsInPeriod]
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
      .map(e => {
        const agg = aggBySourceId.get(e.id);
        return {
          eventId: e.id,
          dcgId: (e as any).dcg_id as string | null | undefined,
          eventDate: new Date(e.start_datetime),
          Members: agg?.m.size || 0,
          "Regular Visitors": agg?.v.size || 0,
          Children: agg?.c.size || 0,
        };
      });

    if (eventType === "regional") {
      return perEventPoints.map(p => ({
        date: format(p.eventDate, "MMM d"),
        Members: p.Members,
        "Regular Visitors": p["Regular Visitors"],
        Children: p.Children,
      }));
    }

    const bucketDays = 7;
    const endDate = dateRange.to || new Date();
    const startDate = dateRange.from || subMonths(endDate, 1);

    const buckets: { start: Date; end: Date; label: string; partial: boolean;
      m: number; v: number; c: number; count: number }[] = [];
    const periodEnd = new Date(endDate);
    periodEnd.setHours(23, 59, 59, 999);
    let cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= periodEnd) {
      const next = new Date(cursor);
      next.setDate(next.getDate() + bucketDays);
      const partial = next > periodEnd;
      const end = partial ? new Date(periodEnd.getTime() + 1) : next;
      buckets.push({
        start: new Date(cursor),
        end,
        label: format(cursor, "MMM d"),
        partial,
        m: 0, v: 0, c: 0,
        count: 0,
      });
      cursor = next;
    }

    perEventPoints.forEach(p => {
      const t = p.eventDate.getTime();
      const b = buckets.find(bk => t >= bk.start.getTime() && t < bk.end.getTime());
      if (!b) return;
      b.count += 1;
      b.m += p.Members;
      b.v += p["Regular Visitors"];
      b.c += p.Children;
    });

    while (buckets.length > 0) {
      const last = buckets[buckets.length - 1];
      if (last.partial && last.count === 0) buckets.pop();
      else break;
    }

    return buckets.map(b => ({
      date: b.label,
      Members: b.m,
      "Regular Visitors": b.v,
      Children: b.c,
    }));
  }, [kpis?.filteredEvents, kpis?.filteredAttendance, eventType, dateRange]);

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

  const dataErrorEntries = [
    { error: membersError, hasData: !!members, refetch: refetchMembers },
    { error: eventsError, hasData: !!events, refetch: refetchEvents },
    { error: financialError, hasData: !!financialTransactions, refetch: refetchFinancial },
    { error: discipleshipError, hasData: !!discipleshipRelationships, refetch: refetchDiscipleship },
    { error: attendanceError, hasData: !!attendanceData, refetch: refetchAttendance },
  ].filter((e) => e.error && !e.hasData);

  const dataErrors = dataErrorEntries.map(
    (e: any) => e.error?.message || 'A dashboard data request failed.',
  );

  const retryFailedQueries = () => {
    dataErrorEntries.forEach((e) => {
      try { e.refetch?.(); } catch { /* noop */ }
    });
  };

  const regionMissingNotice = !region ? (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-card/85 p-4 shadow-card backdrop-blur-xl">
      <div className="text-sm">
        <p className="font-medium">{missingRegionMessage || 'No region selected.'}</p>
      </div>
    </div>
  ) : null;

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 z-20 bg-background/98 backdrop-blur-md border-b border-border/30 px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 p-1">
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

      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {regionMissingNotice}
        {dataErrorNotice}

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
            <GlassKPICard icon={<Heart className="h-5 w-5" />} label="Discipleship Success" value={`${kpis.successRate}%`}
              subtitle="Reached membership milestone" />
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
            <GlassKPICard icon={<Heart className="h-5 w-5" />} label="Discipleship Success" value={`${kpis.successRate}%`}
              subtitle="Reached membership milestone" />
          </div>
        )}

        <div className="rounded-md border border-border/70 bg-card/85 p-6 shadow-card backdrop-blur-xl">
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
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const total = payload.reduce((sum, p: any) => sum + (Number(p.value) || 0), 0);
                    return (
                      <div style={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        padding: "8px 12px",
                        boxShadow: "0 4px 12px hsl(var(--foreground) / 0.08)",
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: "hsl(var(--foreground))" }}>{label}</div>
                        {payload.map((p: any) => (
                          <div key={p.dataKey} style={{ color: p.color }}>
                            {p.dataKey} : {p.value}
                          </div>
                        ))}
                        <div style={{
                          marginTop: 6,
                          paddingTop: 6,
                          borderTop: "1px solid hsl(var(--border))",
                          fontWeight: 600,
                          color: "hsl(var(--foreground))",
                        }}>
                          Total : {total}
                        </div>
                      </div>
                    );
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-md border border-border/70 bg-card/85 p-6 shadow-card backdrop-blur-xl lg:col-span-2">
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

export default RegionalDashboardView;
