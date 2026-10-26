import React, { useState, useMemo } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Users, UserCheck, UserPlus, Search, AlertCircle, Calendar, MapPin, Download } from "lucide-react";
import { useEventReport } from "@/hooks/useEventReport";
import EventFeedbackPanel from "@/components/admin/EventFeedbackPanel";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  eventId?: string;
  regionId?: string | null;
  backTo: string;
  headerSuffix?: React.ReactNode;
  showRegionFilter?: boolean;
}

const isSameLocalDate = (iso: string) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  } catch { return false; }
};

const EventReportView: React.FC<Props> = ({ eventId, regionId, backTo, headerSuffix, showRegionFilter }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [sectionTab, setSectionTab] = useState<string>("overview");

  const { data: reportData, isLoading, error } = useEventReport(
    eventId,
    regionId ?? undefined,
    dayFilter !== "all" ? dayFilter : undefined,
  );
  const isMultiDay = (reportData?.totalDays || 0) > 1;
  const regionOptions = reportData?.regions || [];

  const filteredAttendees = useMemo(() => {
    if (!reportData?.attendees) return [];
    return reportData.attendees.filter(attendee => {
      const profile = attendee.member?.profile;
      const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.toLowerCase();
      const email = profile?.email?.toLowerCase() || '';
      const memberId = attendee.member?.member_id?.toLowerCase() || '';
      const matchesSearch = searchTerm === "" ||
        fullName.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase()) ||
        memberId.includes(searchTerm.toLowerCase());
      const matchesGender = genderFilter === "all" || profile?.gender?.toLowerCase() === genderFilter.toLowerCase();
      const memberType = attendee.member?.member_type || '';
      const matchesMemberType = memberTypeFilter === "all" || memberType === memberTypeFilter;
      const matchesRegion = !showRegionFilter || regionFilter === "all" || attendee.region_id === regionFilter;
      return matchesSearch && matchesGender && matchesMemberType && matchesRegion;
    });
  }, [reportData?.attendees, searchTerm, genderFilter, memberTypeFilter, regionFilter, showRegionFilter]);




  const exportToCSV = () => {
    if (!filteredAttendees.length) return;
    const daySuffix = dayFilter !== "all" && reportData?.days
      ? (() => {
          const d = reportData.days.find(x => x.attendanceEventId === dayFilter);
          return d ? `-day${d.dayIndex}` : "";
        })()
      : "";
    const headers = ['Name', 'Email', 'Phone', 'Gender', 'Member Type', 'Member ID', 'Join Interest'];
    if (showRegionFilter) headers.splice(5, 0, 'Region');
    if (isMultiDay && dayFilter === "all") headers.push('Days Attended', 'Days Present');
    const rows = filteredAttendees.map(a => {
      const base = [
        `${a.member?.profile?.last_name || ''} ${a.member?.profile?.first_name || ''}`.trim(),
        a.member?.profile?.email || '',
        a.member?.profile?.phone || '',
        a.member?.profile?.gender || '',
        a.member?.member_type || '',
        ...(showRegionFilter ? [a.region_name || ''] : []),
        a.member?.member_id || '',
        a.member?.join_interest || 'not_specified',
      ];
      if (isMultiDay && dayFilter === "all") {
        base.push(`${a.days_attended}/${reportData?.totalDays || 0}`);
        base.push(a.days_present.map(d => `D${d}`).join(' '));
      }
      return base;
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-report-${reportData?.event?.name || eventId}${daySuffix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading report</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
      </Alert>
    );
  }

  const stats = reportData?.stats;
  const ev = reportData?.event;
  const pct = stats && ev?.attendance_target ? Math.round(stats.attendanceRate) : null;
  const ring = Math.min(pct ?? 0, 100);
  const pill = (active: boolean) => cn('whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', active ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground');
  const sections = [
    { v: 'overview', l: 'Overview' },
    ...(isMultiDay ? [{ v: 'daily', l: 'Daily' }] : []),
    { v: 'participants', l: 'People' },
    { v: 'feedback', l: 'Feedback' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={() => navigate(backTo)} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Event report</p>
          <h1 className="truncate font-heading text-lg font-bold text-foreground sm:text-2xl">{ev?.name || 'Loading…'}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">{headerSuffix}</div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary-foreground/10 blur-2xl" />
            <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/75">Total attendees</p>
                <p className="mt-1 font-heading text-4xl font-bold leading-none">{stats?.totalAttendees || 0}</p>
                {ev && (
                  <div className="mt-3 space-y-1 text-xs text-primary-foreground/85">
                    <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{format(new Date(ev.start_datetime), 'dd/MM/yyyy · HH:mm')}</span></p>
                    {ev.location_name && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{ev.location_name}</span></p>}
                  </div>
                )}
              </div>
              {pct !== null && (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(currentColor ${ring * 3.6}deg, color-mix(in oklab, currentColor 20%, transparent) 0deg)` }}>
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-primary text-center">
                    <span className="font-heading text-lg font-bold leading-none">{pct}%<span className="mt-0.5 block text-[9px] font-medium opacity-80">of {ev?.attendance_target}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Day chips */}
          {isMultiDay && reportData?.days && (
            <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <button type="button" className={pill(dayFilter === 'all')} onClick={() => setDayFilter('all')}>All days</button>
              {reportData.days.map(d => (
                <button key={d.attendanceEventId} type="button" className={pill(dayFilter === d.attendanceEventId)} onClick={() => setDayFilter(d.attendanceEventId)}>
                  Day {d.dayIndex} · {format(new Date(d.eventDate), 'dd/MM')}{isSameLocalDate(d.eventDate) ? ' · Today' : ''}
                </button>
              ))}
            </div>
          )}

          {/* Section tabs */}
          <div className="grid gap-1 rounded-2xl border border-border bg-muted/50 p-1" style={{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }}>
            {sections.map(s => (
              <button key={s.v} type="button" onClick={() => setSectionTab(s.v)}
                className={cn('truncate rounded-xl px-2 py-2 text-sm font-semibold transition-all', sectionTab === s.v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {s.l}
              </button>
            ))}
          </div>

          {sectionTab === 'overview' && (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                { icon: UserCheck, label: 'Members', value: stats?.members || 0 },
                { icon: UserPlus, label: 'Visitors', value: stats?.visitors || 0 },
                { icon: Users, label: 'Children', value: stats?.children || 0 },
                { icon: Users, label: 'Male · Female', value: `${stats?.maleCount || 0} · ${stats?.femaleCount || 0}` },
              ].map(k => (
                <div key={k.label} className="min-w-0 rounded-2xl border border-border bg-card p-3">
                  <k.icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 font-heading text-xl font-bold leading-none text-foreground">{k.value}</p>
                  <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{k.label}</p>
                </div>
              ))}
              <div className="col-span-2 rounded-2xl border border-border bg-card p-4 lg:col-span-4">
                <p className="text-sm font-semibold text-foreground">Visitors who want to join</p>
                <p className="text-xs text-muted-foreground">Based on {stats?.visitorsTotal || 0} visitors</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[['Yes', stats?.wantToJoin], ['No', stats?.notWantToJoin], ['Undecided', stats?.undecided]].map(([l, v]) => (
                    <div key={l as string} className="rounded-xl bg-muted/50 py-2">
                      <p className="font-heading text-lg font-bold text-foreground">{(v as number) || 0}</p>
                      <p className="text-[11px] text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
                {((stats?.unknownType || 0) > 0 || (stats?.unknownGender || 0) > 0 || (stats?.joinInterestNotSpecified || 0) > 0) && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Missing info: {stats?.unknownType || 0} type · {stats?.unknownGender || 0} gender · {stats?.joinInterestNotSpecified || 0} join interest
                  </p>
                )}
              </div>
            </div>
          )}

          {sectionTab === 'daily' && isMultiDay && (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {(reportData?.days || []).map(d => (
                <li key={d.attendanceEventId}>
                  <button type="button" onClick={() => setDayFilter(d.attendanceEventId)} className={cn('grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 text-left', d.attendanceEventId === dayFilter && 'bg-primary/5')}>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 font-heading text-sm font-bold text-primary">D{d.dayIndex}</span>
                    <span className="truncate text-sm text-foreground">{format(new Date(d.eventDate), 'EEE dd/MM/yyyy')}</span>
                    <span className="font-heading text-lg font-bold text-foreground">{d.presentCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {sectionTab === 'participants' && (
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <div className="relative min-w-0">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="search" placeholder="Search name, email, ID…" className="h-11 rounded-full bg-card pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-full sm:w-auto sm:px-4" onClick={exportToCSV} disabled={!filteredAttendees.length} aria-label="Export CSV">
                  <Download className="h-4 w-4" /><span className="hidden sm:ml-2 sm:inline">Export CSV</span>
                </Button>
              </div>
              <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                {[['all', 'Everyone'], ['member', 'Members'], ['visitor', 'Visitors']].map(([v, l]) => (
                  <button key={v} type="button" className={pill(memberTypeFilter === v)} onClick={() => setMemberTypeFilter(v)}>{l}</button>
                ))}
                <span className="mx-1 w-px shrink-0 bg-border" />
                {[['all', 'All genders'], ['male', 'Male'], ['female', 'Female']].map(([v, l]) => (
                  <button key={v} type="button" className={pill(genderFilter === v)} onClick={() => setGenderFilter(v)}>{l}</button>
                ))}
                {showRegionFilter && (
                  <>
                    <span className="mx-1 w-px shrink-0 bg-border" />
                    <button type="button" className={pill(regionFilter === 'all')} onClick={() => setRegionFilter('all')}>All regions</button>
                    {regionOptions.map(r => (
                      <button key={r.id} type="button" className={pill(regionFilter === r.id)} onClick={() => setRegionFilter(r.id)}>{r.name}</button>
                    ))}
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{filteredAttendees.length} of {reportData?.attendees.length || 0} shown</p>
              {filteredAttendees.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No participants match your filters.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                  {filteredAttendees.map(a => {
                    const p = a.member?.profile;
                    const visitor = a.member?.member_type === 'visitor';
                    return (
                      <li key={a.id || a.member_id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(p?.last_name?.[0] || '') + (p?.first_name?.[0] || '')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{p?.last_name} {p?.first_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{[p?.phone, p?.email].filter(Boolean).join(' · ') || '—'}</p>
                          {showRegionFilter && a.region_name && <p className="truncate text-[11px] text-muted-foreground">{a.region_name}</p>}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', visitor ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary')}>{visitor ? 'Visitor' : 'Member'}</span>
                          {isMultiDay && dayFilter === 'all' && <span className="text-[11px] text-muted-foreground">{a.days_attended}/{reportData?.totalDays} days</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {sectionTab === 'feedback' && <EventFeedbackPanel eventId={eventId} />}
        </>
      )}
    </div>
  );
};

export default EventReportView;
