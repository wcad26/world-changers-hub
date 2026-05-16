import { useState, useMemo } from "react";
import DcgAdminLayout from "@/components/admin/DcgAdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { useDcgEvents, useRegionalEventsForDcg, useDeleteDcgEvent } from "@/hooks/useDcgEvents";
import { 
  Calendar, Plus, Search, MapPin, Users, CalendarDays, 
  Clock, UserCheck, Copy, Trash2, AlertCircle, TrendingUp, TrendingDown, MoreHorizontal, Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import PeriodFilter, { type PeriodFilters } from "@/components/admin/regional/dashboard/PeriodFilter";
import { CreateEventDialog } from "@/components/admin/dcg/CreateEventDialog";
import { EventAttendanceDialog } from "@/components/admin/dcg/EventAttendanceDialog";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { toast } from "sonner";
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

const DcgEvents = () => {
  const { userRegion, userDcg } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilters, setPeriodFilters] = useState<PeriodFilters>({
    dateRange: { from: undefined, to: undefined },
    quickDateRange: "1-month"
  });
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<any>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<any>(null);

  const { data: dcgEvents, isLoading: loadingDcg, error: dcgError } = useDcgEvents(userDcg?.id);
  const { data: regionalEvents, isLoading: loadingRegional } = useRegionalEventsForDcg(userDcg?.region_id);
  const { data: attendanceHistory } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const deleteEvent = useDeleteDcgEvent();

  const allEvents = useMemo(() => {
    const combined = [...(dcgEvents || []), ...(regionalEvents || [])];
    const unique = Array.from(new Map(combined.map(e => [e.id, e])).values());
    return unique;
  }, [dcgEvents, regionalEvents]);

  const filteredEvents = useMemo(() => {
    let result = [...allEvents];

    if (searchTerm) {
      result = result.filter(e => 
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.location_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (eventTypeFilter !== 'all') {
      if (eventTypeFilter === 'regional') result = result.filter(e => !e.dcg_id);
      if (eventTypeFilter === 'dcg') result = result.filter(e => !!e.dcg_id);
      if (eventTypeFilter === 'special') result = result.filter(e => e.is_special);
    }

    const now = new Date();
    if (timeFilter === 'upcoming') {
      result = result.filter(e => e.start_datetime && new Date(e.start_datetime) >= now);
    } else if (timeFilter === 'past') {
      result = result.filter(e => e.start_datetime && new Date(e.start_datetime) < now);
    }

    return result.sort((a, b) => 
      new Date(b.start_datetime || 0).getTime() - new Date(a.start_datetime || 0).getTime()
    );
  }, [allEvents, searchTerm, eventTypeFilter, timeFilter]);

  const analyticsData = useMemo(() => {
    const regional = allEvents.filter(e => !e.dcg_id);
    const dcg = allEvents.filter(e => !!e.dcg_id);
    const special = allEvents.filter(e => e.is_special);

    const getAvgAttendance = (events: any[]) => {
      if (events.length === 0) return 0;
      const totalAttendance = events.reduce((acc, event) => {
        const count = attendanceHistory?.filter(a => a.source_event_id === event.id).length || 0;
        return acc + count;
      }, 0);
      return Math.round(totalAttendance / events.length);
    };

    return {
      regional: { count: regional.length, avgAttendance: getAvgAttendance(regional), growth: 12 },
      dcg: { count: dcg.length, avgAttendance: getAvgAttendance(dcg), growth: 8 },
      special: { count: special.length, avgAttendance: getAvgAttendance(special), growth: 0 },
      total: { count: allEvents.length, avgAttendance: getAvgAttendance(allEvents), growth: 18 }
    };
  }, [allEvents, attendanceHistory]);

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return "—";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    
    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return format(startDate, "MMM d, yyyy • h:mm a");
    }
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  const isLoading = loadingDcg || loadingRegional;

  if (!userDcg) return null;

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
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 mx-[10px] px-0">
          <PeriodFilter
            filters={periodFilters}
            onFiltersChange={(f) => setPeriodFilters(prev => ({ ...prev, ...f }))}
            className="mb-0"
          />
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              className="pl-9 bg-background/60 h-8 w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-row flex-wrap gap-2 w-full sm:basis-full items-center">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-1/2 sm:w-[130px] bg-background/60 h-8 text-sm">
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
              <SelectTrigger className="w-[calc(50%-0.5rem)] sm:w-[130px] bg-background/60 h-8 text-sm">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-full sm:w-auto sm:ml-auto">
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2 h-8 text-sm w-full sm:w-auto">
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 mx-[10px]">
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
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 mx-[10px] px-[5px]">
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
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{event.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(event.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
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

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/40">
                  <TableHead className="text-muted-foreground font-medium">Event Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Type</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Time</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Location</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">Capacity</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">Attendance</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const attendanceCount = attendanceHistory?.filter(a => a.source_event_id === event.id).length || 0;
                    const eventType = event.is_special ? 'Special' : event.dcg_id ? 'DCG' : 'Regional';
                    const isOwnDcg = event.dcg_id === userDcg.id;

                    return (
                      <TableRow key={event.id} className="hover:bg-primary/5 border-border/40 group transition-colors">
                        <TableCell className="font-medium text-foreground">
                          <div>
                            <p>{event.name || '—'}</p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground font-normal line-clamp-1">{event.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.dcg_id ? "secondary" : "outline"} className="font-normal">
                            {eventType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.start_datetime ? format(new Date(event.start_datetime), "MMM d, yyyy") : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {event.start_datetime ? format(new Date(event.start_datetime), "h:mm a") : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{event.location_name || '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {event.capacity || '∞'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                            {attendanceCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => setSelectedEventForAttendance(event)}>
                                <UserCheck className="h-4 w-4 mr-2" /> Record Attendance
                              </DropdownMenuItem>
                              {isOwnDcg && (
                                <>
                                  <DropdownMenuItem onClick={() => setDuplicateSource(event)}>
                                    <Copy className="h-4 w-4 mr-2" /> Duplicate Event
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" /> Delete Event
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{event.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(event.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
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

        <CreateEventDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
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
