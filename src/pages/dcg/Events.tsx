import React, { useState, useMemo } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import { useDcgEvents, useRegionalEventsForDcg, useDeleteDcgEvent } from '@/hooks/useDcgEvents';
import { useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import {
  Calendar,
  Plus,
  MapPin,
  Users,
  UserCheck,
  Copy,
  Trash2,
  AlertCircle,
  MoreHorizontal,
  Star,
  Repeat,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CreateEventDialog } from '@/components/admin/dcg/CreateEventDialog';
import { RecurringSeriesDialog } from '@/components/admin/events/RecurringSeriesDialog';
import { MakeRecurringDialog } from '@/components/admin/events/MakeRecurringDialog';
import { EventAttendanceDialog } from '@/components/admin/dcg/EventAttendanceDialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatTimeRange } from '@/utils/dateUtils';
import { toast } from 'sonner';
import {
  HeroCard,
  SearchBar,
  PeriodChipBar,
  EmptyState,
  TypePill,
  type DateRangeValue,
} from '@/components/admin/dcg/DcgUI';

type PeriodKey = 'all' | '1-month' | '3-months' | '6-months' | '1-year' | 'custom';
type TimeKey = 'upcoming' | 'past' | 'all';

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1-month', label: '1 month' },
  { value: '3-months', label: '3 months' },
  { value: '6-months', label: '6 months' },
  { value: '1-year', label: '1 year' },
  { value: 'custom', label: 'Custom' },
];

const DcgEvents: React.FC = () => {
  const { userRegion, userDcg } = useAuth();
  const { data: resolvedDcg, isLoading: resolvingDcg } = useCurrentDcg();
  const activeDcg = userDcg || resolvedDcg;
  const dcgId = activeDcg?.id;
  const regionId = activeDcg?.region_id || userRegion?.id;

  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [customRange, setCustomRange] = useState<DateRangeValue>({});
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'dcg' | 'regional' | 'special'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeKey>('all');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<any>(null);
  const [eventForRecurrence, setEventForRecurrence] = useState<any | null>(null);
  const [eventToDelete, setEventToDelete] = useState<any | null>(null);

  const { data: dcgEvents, isLoading: loadingDcg, error: dcgError } = useDcgEvents(dcgId);
  const { data: regionalEvents, isLoading: loadingRegional } = useRegionalEventsForDcg(regionId);
  const { data: dcgAttendanceHistory } = useDcgAttendanceHistory(dcgId);
  const { data: regionalAttendanceHistory } = useAttendanceHistoryWithMemberTypes(regionId);
  const deleteEvent = useDeleteDcgEvent();

  const allEvents = useMemo(() => {
    const combined = [...(dcgEvents || []), ...(regionalEvents || [])];
    return Array.from(new Map(combined.map((e) => [e.id, e])).values());
  }, [dcgEvents, regionalEvents]);

  // Helper to get attendance count for an event
  const getAttendanceCount = useMemo(() => {
    const map = new Map<string, number>();
    (regionalAttendanceHistory || []).forEach((a: any) => {
      if (a.source_event_id) {
        map.set(a.source_event_id, (map.get(a.source_event_id) || 0) + (a.total_present || 0));
      }
    });
    (dcgAttendanceHistory || []).forEach((a: any) => {
      // Fallback match by event name + date if not already counted
      if (a.event_id && !map.has(a.event_id)) {
        map.set(a.event_id, a.total_present || 0);
      }
    });
    return (ev: any) => {
      if (map.has(ev.id)) return map.get(ev.id) || 0;
      const byNameDate = (dcgAttendanceHistory || []).find(
        (a: any) =>
          a.event_name === ev.name &&
          ev.start_datetime &&
          a.event_date === new Date(ev.start_datetime).toISOString().split('T')[0],
      );
      return byNameDate?.total_present || 0;
    };
  }, [regionalAttendanceHistory, dcgAttendanceHistory]);

  // Period-filtered events
  const periodFilteredEvents = useMemo(() => {
    if (period === 'all') return allEvents;
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = now;

    if (period === '1-month') from = subMonths(now, 1);
    else if (period === '3-months') from = subMonths(now, 3);
    else if (period === '6-months') from = subMonths(now, 6);
    else if (period === '1-year') from = subMonths(now, 12);
    else if (period === 'custom') {
      from = customRange.from;
      to = customRange.to;
    }

    return allEvents.filter((ev) => {
      if (!ev.start_datetime) return false;
      const d = new Date(ev.start_datetime);
      if (from && d < from) return false;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    });
  }, [allEvents, period, customRange]);

  // Analytics over period
  const analyticsData = useMemo(() => {
    const calcStats = (list: any[]) => {
      const count = list.length;
      if (count === 0) return { count: 0, avgAttendance: 0 };
      const totalAtt = list.reduce((sum, e) => sum + getAttendanceCount(e), 0);
      return { count, avgAttendance: Math.round(totalAtt / count) };
    };

    const dcgOnly = periodFilteredEvents.filter((e) => !!e.dcg_id && !e.is_special);
    const regionalOnly = periodFilteredEvents.filter((e) => !e.dcg_id && !e.is_special);
    const specialOnly = periodFilteredEvents.filter((e) => !!e.is_special);

    const dcgCapacity = dcgOnly.reduce((s, e) => s + (e.attendance_target || e.capacity || 0), 0);
    const dcgActual = dcgOnly.reduce((s, e) => s + getAttendanceCount(e), 0);
    const fillPct = dcgCapacity > 0 ? Math.min(100, Math.round((dcgActual / dcgCapacity) * 100)) : 0;

    return {
      total: calcStats(periodFilteredEvents),
      dcg: calcStats(dcgOnly),
      regional: calcStats(regionalOnly),
      special: calcStats(specialOnly),
      fillPct,
    };
  }, [periodFilteredEvents, getAttendanceCount]);

  // Search + Type filtered (before time tab split, so time tab counts stay accurate)
  const searchAndTypePool = useMemo(() => {
    return periodFilteredEvents.filter((e) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          (e.name || '').toLowerCase().includes(q) ||
          (e.location_name || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (eventTypeFilter === 'dcg' && (!e.dcg_id || e.is_special)) return false;
      if (eventTypeFilter === 'regional' && (!!e.dcg_id || e.is_special)) return false;
      if (eventTypeFilter === 'special' && !e.is_special) return false;

      return true;
    });
  }, [periodFilteredEvents, searchTerm, eventTypeFilter]);

  const timeCounts = useMemo(() => {
    const now = new Date();
    return {
      upcoming: searchAndTypePool.filter((e) => e.start_datetime && new Date(e.start_datetime) >= now).length,
      past: searchAndTypePool.filter((e) => e.start_datetime && new Date(e.start_datetime) < now).length,
      all: searchAndTypePool.length,
    };
  }, [searchAndTypePool]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let result = [...searchAndTypePool];
    if (timeFilter === 'upcoming') {
      result = result.filter((e) => e.start_datetime && new Date(e.start_datetime) >= now);
      return result.sort(
        (a, b) => new Date(a.start_datetime || 0).getTime() - new Date(b.start_datetime || 0).getTime(),
      );
    }
    if (timeFilter === 'past') {
      result = result.filter((e) => e.start_datetime && new Date(e.start_datetime) < now);
    }
    return result.sort(
      (a, b) => new Date(b.start_datetime || 0).getTime() - new Date(a.start_datetime || 0).getTime(),
    );
  }, [searchAndTypePool, timeFilter]);

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;
    try {
      await deleteEvent.mutateAsync(eventToDelete.id);
      setEventToDelete(null);
    } catch {
      // handled by hook toast
    }
  };

  const handleQuickAttendance = () => {
    const ownEvents = allEvents.filter((e) => e.dcg_id === dcgId);
    const target = ownEvents[0] || allEvents[0];
    if (target) {
      setSelectedEventForAttendance(target);
    } else {
      toast.info('Create an event first to record attendance.');
    }
  };

  const renderActions = (event: any) => {
    const isOwnDcg = !!dcgId && event.dcg_id === dcgId;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
            aria-label="Event actions"
            className="h-9 w-9 shrink-0 rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setSelectedEventForAttendance(event)}>
            <UserCheck className="mr-2 h-4 w-4" /> Record Attendance
          </DropdownMenuItem>
          {isOwnDcg && (
            <>
              <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDuplicateSource(event)}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate Event
              </DropdownMenuItem>
              {!event.recurrence_rule_id ? (
                <DropdownMenuItem onClick={() => setEventForRecurrence(event)}>
                  <Repeat className="mr-2 h-4 w-4" /> Make Recurrent
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setShowSeriesDialog(true)}>
                  <Repeat className="mr-2 h-4 w-4" /> Recurring Series
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setEventToDelete(event)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Event
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const isLoading = resolvingDcg || loadingDcg || loadingRegional;

  if (!resolvingDcg && !activeDcg) {
    return (
      <DcgAdminLayout>
        <EmptyState
          icon={AlertCircle}
          title="No DCG assigned"
          hint="Please contact your regional administrator to link your account to an active DCG."
        />
      </DcgAdminLayout>
    );
  }

  return (
    <DcgAdminLayout>
      <div className="space-y-4">
        {/* Search + Add Event */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search events or locations…" />
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full shadow-regal sm:w-auto sm:px-5"
            aria-label="Add event"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:ml-1.5 sm:inline">Add Event</span>
          </Button>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleQuickAttendance}
            className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">Attendance</span>
              <span className="block truncate text-[11px] text-muted-foreground">Mark latest gathering</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowSeriesDialog(true)}
            className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/15 text-secondary">
              <Repeat className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">Recurring</span>
              <span className="block truncate text-[11px] text-muted-foreground">Manage series</span>
            </span>
          </button>
        </div>

        {/* Hero KPI Card */}
        <HeroCard
          eyebrow="Events in selected period"
          value={analyticsData.total.count}
          sub={`Avg ${analyticsData.total.avgAttendance} attendees per event`}
          ring={analyticsData.fillPct}
          ringLabel="of target"
        />

        {/* Interactive Type Filter Tiles */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: 'dcg', label: 'DCG', data: analyticsData.dcg, icon: Users },
              { key: 'regional', label: 'Regional', data: analyticsData.regional, icon: MapPin },
              { key: 'special', label: 'Special', data: analyticsData.special, icon: Star },
            ] as const
          ).map(({ key, label, data, icon: Icon }) => {
            const active = eventTypeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setEventTypeFilter(active ? 'all' : key)}
                className={cn(
                  'min-w-0 rounded-2xl border p-3 text-left transition-all',
                  active
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <Icon className={cn('h-4 w-4', active ? 'text-primary-foreground' : 'text-primary')} />
                <p className="mt-2 font-heading text-xl font-bold leading-none">{data.count}</p>
                <p
                  className={cn(
                    'mt-1 truncate text-[11px] font-medium',
                    active ? 'text-primary-foreground/85' : 'text-muted-foreground',
                  )}
                >
                  {label} · avg {data.avgAttendance}
                </p>
              </button>
            );
          })}
        </div>

        {/* Period Filter */}
        <PeriodChipBar
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />

        {/* Time Segmented Tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-muted/50 p-1">
          {(['upcoming', 'past', 'all'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setTimeFilter(v)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-semibold capitalize transition-all',
                timeFilter === v
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v}
              <span
                className={cn(
                  'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px]',
                  timeFilter === v ? 'bg-primary-foreground/20' : 'bg-background',
                )}
              >
                {timeCounts[v]}
              </span>
            </button>
          ))}
        </div>

        {dcgError && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading events</AlertTitle>
            <AlertDescription>{(dcgError as Error).message}</AlertDescription>
          </Alert>
        )}

        {/* Mobile / Tablet Event Card List */}
        <div className="lg:hidden">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title={searchTerm ? 'No events match your search' : 'No events here yet'}
              hint="Create a DCG event or adjust your period and time filters."
              action={
                <Button size="sm" className="rounded-full" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Add Event
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {filteredEvents.map((ev) => {
                const d = ev.start_datetime ? new Date(ev.start_datetime) : null;
                const valid = !!(d && !isNaN(d.getTime()));
                const future = valid && d! >= new Date();
                const type = ev.is_special ? 'Special' : ev.dcg_id ? 'DCG' : 'Regional';
                const att = getAttendanceCount(ev);

                return (
                  <li
                    key={ev.id}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 p-3 transition hover:bg-muted/20"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEventForAttendance(ev)}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary"
                    >
                      {ev.image_url && (
                        <img
                          src={ev.image_url}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <span className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/35 text-background">
                        <span className="text-[9px] font-bold uppercase leading-none">
                          {valid ? format(d!, 'MMM') : '—'}
                        </span>
                        <span className="font-heading text-lg font-bold leading-none">
                          {valid ? format(d!, 'dd') : ''}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedEventForAttendance(ev)}
                      className="min-w-0 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-foreground">{ev.name ?? '—'}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatTimeRange(ev.start_datetime, ev.end_datetime)}
                        {ev.location_name ? ` · ${ev.location_name}` : ''}
                      </p>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            type === 'Special'
                              ? 'bg-secondary/15 text-secondary'
                              : type === 'DCG'
                                ? 'bg-primary/12 text-primary'
                                : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {type}
                        </span>
                        {ev.recurrence_rule_id && <Repeat className="h-3 w-3 shrink-0 text-primary" />}
                        <span className="truncate text-[11px] text-muted-foreground">
                          {future
                            ? ev.capacity
                              ? `Cap ${ev.capacity}`
                              : 'Upcoming'
                            : `${att} attended`}
                        </span>
                      </div>
                    </button>

                    {renderActions(ev)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Capacity</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-6 w-full rounded-lg" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      {searchTerm ? 'No events match your search.' : 'No events found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const attendanceCount = getAttendanceCount(event);
                    const eventType = event.is_special ? 'Special' : event.dcg_id ? 'DCG' : 'Regional';
                    const typeTone =
                      eventType === 'Special'
                        ? 'var(--chart-4)'
                        : eventType === 'DCG'
                          ? 'var(--primary)'
                          : 'var(--chart-3)';

                    return (
                      <TableRow
                        key={event.id}
                        className="cursor-pointer transition-colors hover:bg-muted/30"
                        onClick={() => setSelectedEventForAttendance(event)}
                      >
                        <TableCell className="font-medium text-foreground">
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span>{event.name || '—'}</span>
                              {event.recurrence_rule_id && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] text-primary"
                                >
                                  <Repeat className="h-2.5 w-2.5" /> Recurring
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="line-clamp-1 text-xs font-normal text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TypePill label={eventType} tone={typeTone} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {event.start_datetime ? format(new Date(event.start_datetime), 'dd MMM yyyy') : '—'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {event.start_datetime ? format(new Date(event.start_datetime), 'h:mm a') : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="max-w-[160px] truncate">{event.location_name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {event.capacity || '∞'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="border-none bg-primary/10 text-primary">
                            {attendanceCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {renderActions(event)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Create Event Dialog */}
      <CreateEventDialog isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} />

      {/* Edit Event Dialog */}
      <CreateEventDialog
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        editEvent={editingEvent}
      />

      {/* Duplicate Event Dialog */}
      <CreateEventDialog
        isOpen={!!duplicateSource}
        onClose={() => setDuplicateSource(null)}
        duplicateFrom={duplicateSource}
      />

      {/* Recurring Series Management Dialog */}
      {dcgId && (
        <RecurringSeriesDialog open={showSeriesDialog} onOpenChange={setShowSeriesDialog} dcgId={dcgId} />
      )}

      {/* Make Recurrent Dialog */}
      <MakeRecurringDialog
        open={!!eventForRecurrence}
        onOpenChange={(open) => !open && setEventForRecurrence(null)}
        event={eventForRecurrence}
        regionId={regionId ?? null}
        dcgId={dcgId ?? null}
        onOpenSeriesDialog={() => setShowSeriesDialog(true)}
      />

      {/* Attendance Recording Dialog */}
      {selectedEventForAttendance && dcgId && (
        <EventAttendanceDialog
          isOpen={!!selectedEventForAttendance}
          onClose={() => setSelectedEventForAttendance(null)}
          event={selectedEventForAttendance}
          dcgId={dcgId}
        />
      )}

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{eventToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DcgAdminLayout>
  );
};

export default DcgEvents;
