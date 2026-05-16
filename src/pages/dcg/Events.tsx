import React, { useMemo, useState } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus, Search, AlertCircle, MoreHorizontal, UserCheck, Copy, Trash2, Loader2,
  Calendar, CalendarDays, Clock, MapPin, Users, Star, Target, TrendingUp, TrendingDown,
} from 'lucide-react';
import PeriodFilter, { PeriodFilters } from '@/components/admin/regional/dashboard/PeriodFilter';
import { useAuth } from '@/hooks/useAuth';
import {
  useDcgEvents, useDeleteDcgEvent, useRegionalEventsForDcg, type Event,
} from '@/hooks/useDcgEvents';
import { useAttendanceHistoryWithMemberTypes } from '@/hooks/useAttendance';
import { CreateEventDialog } from '@/components/admin/dcg/CreateEventDialog';
import { EventAttendanceDialog } from '@/components/admin/dcg/EventAttendanceDialog';
import { formatDateRange, formatTimeRange } from '@/utils/dateUtils';

const DcgEvents: React.FC = () => {
  const { userDcg, userRegion, loading: authLoading } = useAuth();

  const { data: dcgEvents, isLoading: loadingDcg, error: dcgError } = useDcgEvents(userDcg?.id);
  const { data: regionalEvents, isLoading: loadingRegional } = useRegionalEventsForDcg(userDcg?.region_id);
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const deleteEvent = useDeleteDcgEvent();

  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [periodFilters, setPeriodFilters] = useState<PeriodFilters>(() => {
    const now = new Date();
    const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return { dateRange: { from, to: undefined }, quickDateRange: '1-year' };
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<Event | null>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<Event | null>(null);

  const isLoading = loadingDcg || loadingRegional;

  // Merge DCG events + regional events of this region (scoped)
  const allEvents = useMemo<Event[]>(() => {
    const merged = [...(dcgEvents || []), ...(regionalEvents || [])];
    // De-dupe by id just in case
    const seen = new Set<string>();
    return merged.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [dcgEvents, regionalEvents]);

  const periodFilteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      if (!e?.start_datetime) return false;
      const d = new Date(e.start_datetime);
      if (isNaN(d.getTime())) return false;
      if (periodFilters.dateRange.from && d < periodFilters.dateRange.from) return false;
      if (periodFilters.dateRange.to) {
        const endOfDay = new Date(periodFilters.dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      return true;
    });
  }, [allEvents, periodFilters]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const search = searchTerm.toLowerCase();
    return periodFilteredEvents.filter(event => {
      const name = (event.name || '').toLowerCase();
      const category = (event.category || '').toLowerCase();
      const location = (event.location_name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search) || category.includes(search) || location.includes(search);
      if (!matchesSearch) return false;

      if (eventTypeFilter === 'regional' && (event.dcg_id || event.is_special)) return false;
      if (eventTypeFilter === 'dcg' && !event.dcg_id) return false;
      if (eventTypeFilter === 'special' && !event.is_special) return false;

      const start = event.start_datetime ? new Date(event.start_datetime) : null;
      if (start && !isNaN(start.getTime())) {
        if (timeFilter === 'upcoming' && start < now) return false;
        if (timeFilter === 'past' && start >= now) return false;
      }
      return true;
    });
  }, [periodFilteredEvents, searchTerm, eventTypeFilter, timeFilter]);

  const getEventAttendance = (eventId: string): number => {
    if (!attendanceData) return 0;
    return attendanceData
      .filter(a => a.source_event_id === eventId)
      .reduce((sum, a) => sum + a.total_present, 0);
  };

  const analyticsData = useMemo(() => {
    const empty = { count: 0, avgAttendance: 0, growth: 0 };
    if (!attendanceData) {
      return { total: empty, regional: empty, dcg: empty, special: empty };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const regional = periodFilteredEvents.filter(e => !e.dcg_id && !e.is_special);
    const dcg = periodFilteredEvents.filter(e => !!e.dcg_id);
    const special = periodFilteredEvents.filter(e => e.is_special);

    const getAvg = (list: Event[]) => {
      const ids = list.map(e => e.id);
      const matched = attendanceData.filter(a => a.source_event_id && ids.includes(a.source_event_id));
      return matched.length > 0 ? Math.round(matched.reduce((s, a) => s + a.total_present, 0) / matched.length) : 0;
    };

    const getGrowth = (list: Event[]) => {
      const ids = list.map(e => e.id);
      const inMonth = (m: number, y: number) => attendanceData.filter(a => {
        const d = new Date(a.event_date);
        return d.getMonth() === m && d.getFullYear() === y && a.source_event_id && ids.includes(a.source_event_id);
      });
      const thisM = inMonth(currentMonth, currentYear);
      const lastM = inMonth(lastMonth, lastMonthYear);
      const thisAvg = thisM.length > 0 ? thisM.reduce((s, a) => s + a.total_present, 0) / thisM.length : 0;
      const lastAvg = lastM.length > 0 ? lastM.reduce((s, a) => s + a.total_present, 0) / lastM.length : 0;
      return lastAvg > 0 ? Math.round(((thisAvg - lastAvg) / lastAvg) * 100) : 0;
    };

    return {
      total: { count: periodFilteredEvents.length, avgAttendance: getAvg(periodFilteredEvents), growth: getGrowth(periodFilteredEvents) },
      regional: { count: regional.length, avgAttendance: getAvg(regional), growth: getGrowth(regional) },
      dcg: { count: dcg.length, avgAttendance: getAvg(dcg), growth: getGrowth(dcg) },
      special: { count: special.length, avgAttendance: getAvg(special), growth: getGrowth(special) },
    };
  }, [periodFilteredEvents, attendanceData]);

  const attendanceTarget = useMemo(() => {
    const regional = periodFilteredEvents.filter(e => !e.dcg_id && !e.is_special);
    const totalCapacity = regional.reduce((s, e) => s + ((e as any).attendance_target || e.capacity || 0), 0);
    const ids = new Set(regional.map(e => e.id));
    const totalActual = (attendanceData || [])
      .filter(a => a.source_event_id && ids.has(a.source_event_id))
      .reduce((s, a) => s + a.total_present, 0);
    const pct = totalCapacity > 0 ? Math.round((totalActual / totalCapacity) * 100) : 0;
    return { pct, totalActual };
  }, [periodFilteredEvents, attendanceData]);

  const handleDelete = async (eventId: string) => {
    await deleteEvent.mutateAsync(eventId);
  };

  // Loading / error states
  if (authLoading) {
    return (
      <DcgAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </DcgAdminLayout>
    );
  }

  if (!userDcg) {
    return (
      <DcgAdminLayout>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertDescription>DCG information not found. Please contact your administrator.</AlertDescription>
          </Alert>
        </div>
      </DcgAdminLayout>
    );
  }

  const kpiCards = [
    { label: 'Regional Events', data: analyticsData.regional, icon: MapPin, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'DCG Events', data: analyticsData.dcg, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <DcgAdminLayout>
      <div className="space-y-6 p-4 md:p-0 pb-24 my-[10px] px-[10px]">
        {dcgError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Failed to load events</AlertTitle>
            <AlertDescription>{(dcgError as Error)?.message || 'Please refresh and try again.'}</AlertDescription>
          </Alert>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          <PeriodFilter
            filters={periodFilters}
            onFiltersChange={(f) => setPeriodFilters(prev => ({ ...prev, ...f }))}
            className="mb-0"
          />
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-9 bg-background/60 h-8 w-full sm:w-[200px] text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-full sm:w-[130px] bg-background/60 h-8 text-sm">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regional">Regional</SelectItem>
              <SelectItem value="dcg">DCG</SelectItem>
              <SelectItem value="special">Special</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-[130px] bg-background/60 h-8 text-sm">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          <div className="sm:ml-auto">
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2 h-8 text-sm w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2">
          {kpiCards.map(({ label, data, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
              </div>
              <p className="font-bold text-foreground text-lg">{data.count}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg: {data.avgAttendance} attendees</p>
              <div className="mt-2">
                {data.growth !== 0 ? (
                  <div className={`flex items-center gap-1 ${data.growth > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {data.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="text-xs font-medium">{data.growth > 0 ? '+' : ''}{data.growth}% avg attendance</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">0% growth</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Events Table */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 px-[5px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Events</h2>
              <p className="text-sm text-muted-foreground">View and manage all events for your DCG</p>
            </div>
          </div>

          {/* Mobile / Tablet card view */}
          <div className="lg:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">
                {searchTerm ? 'No events match your search.' : 'No events found. Create your first one!'}
              </div>
            ) : (
              filteredEvents.map(event => {
                const now = new Date();
                const start = event.start_datetime ? new Date(event.start_datetime) : null;
                const isFuture = !!(start && !isNaN(start.getTime()) && start >= now);
                const eventType = event.is_special ? 'Special' : event.dcg_id ? 'DCG' : 'Regional';
                const isOwnDcg = event.dcg_id === userDcg.id;
                const statusLabel = (event as any).status === 'Cancelled'
                  ? 'Cancelled'
                  : isFuture ? 'Upcoming' : 'Completed';
                const statusVariant: 'default' | 'secondary' | 'destructive' =
                  (event as any).status === 'Cancelled' ? 'destructive' : isFuture ? 'default' : 'secondary';
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground truncate">{event.name ?? '—'}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{event.description}</p>
                        )}
                      </div>
                      <Badge variant={statusVariant} className="text-[10px] shrink-0">
                        {statusLabel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateRange(event.start_datetime, event.end_datetime)}
                      </span>
                      {event.location_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {event.location_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="outline" className="text-[10px]">{eventType}</Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setSelectedEventForAttendance(event)}
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" /> Attendance
                        </Button>
                        {isOwnDcg && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDuplicateSource(event)}
                              title="Duplicate event"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Delete event"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the event.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden lg:block rounded-xl border border-border/40 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Event Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Capacity</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-6 w-full rounded-lg" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                        {searchTerm ? 'No events match your search.' : 'No events found. Create your first one!'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map(event => {
                      const now = new Date();
                      const start = event.start_datetime ? new Date(event.start_datetime) : null;
                      const isFuture = !!(start && !isNaN(start.getTime()) && start >= now);
                      const eventType = event.is_special ? 'Special' : event.dcg_id ? 'DCG' : 'Regional';
                      const isOwnDcg = event.dcg_id === userDcg.id;
                      const attendance = getEventAttendance(event.id);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name ?? '—'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={eventType === 'DCG' ? 'secondary' : eventType === 'Special' ? 'outline' : 'default'}
                              className="text-xs"
                            >
                              {eventType}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateRange(event.start_datetime, event.end_datetime)}</TableCell>
                          <TableCell>{formatTimeRange(event.start_datetime, event.end_datetime)}</TableCell>
                          <TableCell>{event.location_name ?? '—'}</TableCell>
                          <TableCell className="text-center">{event.capacity ?? 'N/A'}</TableCell>
                          <TableCell className="text-center">{isFuture ? '-' : attendance}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedEventForAttendance(event)}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Record Attendance
                                </DropdownMenuItem>
                                {isOwnDcg && (
                                  <>
                                    <DropdownMenuItem onClick={() => setDuplicateSource(event)}>
                                      <Copy className="mr-2 h-4 w-4" /> Duplicate Event
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          onSelect={(e) => e.preventDefault()}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the event.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(event.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

        <CreateEventDialog isOpen={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
        <CreateEventDialog
          isOpen={!!duplicateSource}
          onClose={() => setDuplicateSource(null)}
          duplicateFrom={duplicateSource}
        />
        {selectedEventForAttendance && (
          <EventAttendanceDialog
            isOpen={!!selectedEventForAttendance}
            onClose={() => setSelectedEventForAttendance(null)}
            event={selectedEventForAttendance}
            dcgId={userDcg.id}
          />
        )}
      </div>
    </DcgAdminLayout>
  );
};

export default DcgEvents;
