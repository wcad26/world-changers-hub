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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HeroCard, RingTile, Ring, SearchBar, ChipRow } from "@/components/admin/regional/RegionalUI";
import { Link } from "@/lib/router-compat";
import {
  Users, Baby, Heart, CalendarDays, UsersRound, Target,
  TrendingUp, TrendingDown, CalendarIcon, Banknote, HandCoins, AlertCircle
} from "lucide-react";
import { format, subMonths, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart
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
    { value: "1-month", label: "1 month" },
    { value: "3-months", label: "3 months" },
    { value: "6-months", label: "6 months" },
    { value: "1-year", label: "1 year" },
    { value: "custom", label: "Custom" },
  ];

  const isDcg = eventType === "dcg";
  const targetPct = kpis ? (isDcg ? kpis.dcgAttendanceTargetPct : kpis.regionalAttendanceTargetPct) : 0;
  const targetMissing = kpis ? (isDcg ? kpis.dcgAttendanceTargetMissing : kpis.regionalAttendanceTargetMissing) : true;
  const targetSub = kpis ? (isDcg ? kpis.dcgAttendanceTargetSubtitle : kpis.regionalAttendanceTargetSubtitle) : '';
  const totalAttendees = (kpis?.uniqueAdultAttendees ?? 0) + (kpis?.uniqueChildAttendees ?? 0);
  const memberShare = totalAttendees ? Math.round(((kpis?.uniqueMemberAttendees ?? 0) / totalAttendees) * 100) : 0;
  const growth = kpis?.incomeGrowthPct ?? 0;
  const genderTotal = genderChartData.reduce((s, g) => s + g.count, 0);
  const periodLabel = periodOptions.find(p => p.value === quickPeriod)?.label.toLowerCase();

  const quickLinks = [
    { label: 'Members', href: '/admin/regional/members', icon: Users, tone: 'var(--chart-1)' },
    { label: 'Events', href: '/admin/regional/events', icon: CalendarDays, tone: 'var(--chart-2)' },
    { label: 'Discipleship', href: '/admin/regional/discipleship', icon: Heart, tone: 'var(--chart-4)' },
    { label: 'Finances', href: '/admin/regional/finances', icon: Banknote, tone: 'var(--chart-5)' },
  ];

  const Tile = ({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: React.ReactNode; sub: string; tone: string }) => (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl" style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)` }} />
      <span className="relative grid h-8 w-8 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}><Icon className="h-4 w-4" /></span>
      <p className="relative mt-2 font-heading text-2xl font-bold leading-none text-foreground">{value}</p>
      <p className="relative mt-1 truncate text-xs font-medium text-foreground">{label}</p>
      <p className="relative truncate text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-5 px-4 pb-24 pt-4 md:px-6 lg:pb-8">
        {regionMissingNotice}
        {dataErrorNotice}

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events…" />
            {quickPeriod === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" aria-label="Pick dates" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-muted">
                    <CalendarIcon className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="range" selected={{ from: customRange.from, to: customRange.to }}
                    onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/50 p-1">
            {[{ v: 'regional', l: 'Regional events' }, { v: 'dcg', l: 'DCG events' }].map(o => (
              <button key={o.v} type="button" onClick={() => setEventType(o.v)}
                className={cn('rounded-full py-2 text-sm font-semibold transition',
                  eventType === o.v ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground')}>
                {o.l}
              </button>
            ))}
          </div>
          <ChipRow value={quickPeriod} onChange={setQuickPeriod} options={periodOptions} />
          {quickPeriod === "custom" && customRange.from && (
            <p className="px-1 text-xs text-muted-foreground">
              {format(customRange.from, "dd/MM/yyyy")}{customRange.to ? ` – ${format(customRange.to, "dd/MM/yyyy")}` : ''}
            </p>
          )}
        </div>

        {/* Hero + KPIs */}
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <HeroCard
              eyebrow={`${region?.name ?? 'Region'} · ${isDcg ? 'DCG' : 'Regional'} reach`}
              value={totalAttendees}
              sub={`${kpis?.uniqueMemberAttendees ?? 0} members · ${kpis?.uniqueVisitorAttendees ?? 0} visitors · ${kpis?.uniqueChildAttendees ?? 0} children`}
              ring={targetMissing ? memberShare : targetPct}
              ringLabel={targetMissing ? 'Members' : 'Target'}
            >
              <p className="text-xs opacity-85">{targetMissing ? 'Unique people who attended in this period' : targetSub}</p>
            </HeroCard>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            <Tile icon={isDcg ? UsersRound : CalendarDays} label={isDcg ? 'DCG events' : 'Regional events'}
              value={isDcg ? kpis?.dcgEventsCount ?? 0 : kpis?.regionalEventsCount ?? 0}
              sub={`Avg ${isDcg ? kpis?.avgDcgAttendees ?? 0 : kpis?.avgRegionalAttendees ?? 0} attending`} tone="var(--chart-2)" />
            <RingTile icon={Target} label="Attendance target" value={targetMissing ? '—' : `${targetPct}%`}
              ring={targetMissing ? undefined : Math.min(targetPct, 100)} tone="var(--chart-1)" />
            <RingTile icon={Heart} label="Discipleship success" value={`${kpis?.successRate ?? 0}%`}
              ring={kpis?.successRate ?? 0} tone="var(--chart-4)" />
            <Tile icon={Baby} label="Children" value={kpis?.uniqueChildAttendees ?? 0} sub="Attended this period" tone="var(--chart-3)" />
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {quickLinks.map(a => (
            <Link key={a.href} to={a.href} className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-10 w-10 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${a.tone} 15%, transparent)`, color: a.tone }}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="truncate text-[11px] font-semibold text-foreground sm:text-xs">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Trend */}
        <section className="rounded-3xl border border-border bg-card p-4 sm:p-6">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <h3 className="font-heading text-lg font-semibold text-foreground">Attendance rhythm</h3>
              <p className="text-xs text-muted-foreground">{isDcg ? 'Weekly totals' : 'Per event'} · last {periodLabel}</p>
            </div>
            {kpis && kpis.targetMembers > 0 && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">Target {kpis.targetMembers}</span>}
          </div>
          {trendChartData.length > 0 ? (
            <div className="h-[240px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    {['1', '2', '3'].map(n => (
                      <linearGradient key={n} id={`grad${n}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={`var(--chart-${n})`} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={`var(--chart-${n})`} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const total = payload.reduce((s, p: any) => s + (Number(p.value) || 0), 0);
                    return (
                      <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
                        <p className="mb-1 font-semibold text-foreground">{label}</p>
                        {payload.map((p: any) => <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {p.value}</p>)}
                        <p className="mt-1 border-t border-border pt-1 font-semibold text-foreground">Total: {total}</p>
                      </div>
                    );
                  }} />
                  {kpis && kpis.targetMembers > 0 && <ReferenceLine y={kpis.targetMembers} stroke="var(--destructive)" strokeDasharray="6 4" />}
                  <Area type="monotone" dataKey="Members" stroke="var(--chart-1)" fill="url(#grad1)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="Regular Visitors" stroke="var(--chart-2)" fill="url(#grad2)" strokeWidth={2.5} dot={false} />
                  <Area type="monotone" dataKey="Children" stroke="var(--chart-3)" fill="url(#grad3)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid h-[200px] place-items-center text-sm text-muted-foreground">No attendance in this period</div>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground">
            {[['Members', '1'], ['Visitors', '2'], ['Children', '3']].map(([l, n]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: `var(--chart-${n})` }} />{l}</span>
            ))}
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-3">
          {/* People mix as smart bars */}
          <section className="rounded-3xl border border-border bg-card p-4 sm:p-6 lg:col-span-2">
            <h3 className="font-heading text-lg font-semibold text-foreground">People mix</h3>
            <p className="mb-4 text-xs text-muted-foreground">{genderTotal} people on file by gender and age</p>
            <div className="space-y-3">
              {genderChartData.map(g => {
                const pct = genderTotal ? Math.round((g.count / genderTotal) * 100) : 0;
                return (
                  <div key={g.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{g.name}</span>
                      <span className="text-muted-foreground"><b className="text-foreground">{g.count}</b> · {pct}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: g.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Giving snapshot */}
          <section className="rounded-3xl border border-border bg-card p-4 sm:p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground">Giving snapshot</h3>
            <p className="mb-4 text-xs text-muted-foreground">Last {periodLabel}</p>
            <div className="flex items-center gap-4">
              <Ring value={kpis?.fundraisingTargetPct ?? 0} size={80} tone="var(--chart-5)" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Fundraising</p>
                <p className="text-sm font-semibold text-foreground">of all campaign goals</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-muted/50 p-3">
                <HandCoins className="h-4 w-4 text-primary" />
                <p className="mt-1 font-heading text-xl font-bold text-foreground">{kpis?.uniqueGivers ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Givers</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-3">
                <Banknote className="h-4 w-4 text-primary" />
                <p className="mt-1 font-heading text-xl font-bold text-foreground">{kpis?.uniqueTithers ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Tithers</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-3">
                {growth >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                <p className={cn("mt-1 font-heading text-xl font-bold", growth >= 0 ? "text-foreground" : "text-destructive")}>{growth > 0 ? '+' : ''}{growth}%</p>
                <p className="text-[10px] text-muted-foreground">Income</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RegionalDashboardView;
