import React, { useState } from 'react';
import { formatEventDuration } from '@/utils/dateUtils';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, MapPin, Clock, MoreHorizontal, UserCheck, Trash2, Copy, Loader2
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useDcgEvents, useDeleteDcgEvent, useRegionalEventsForDcg } from '@/hooks/useDcgEvents';
import { CreateEventDialog } from '@/components/admin/dcg/CreateEventDialog';
import { EventAttendanceDialog } from '@/components/admin/dcg/EventAttendanceDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { cn } from '@/lib/utils';
import type { Event } from '@/hooks/useDcgEvents';

const DcgEvents = () => {
  const { userDcg, userRegion, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useCardView = isMobile || isTablet;
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<Event | null>(null);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<Event | null>(null);

  const { data: events, isLoading: loadingEvents, error: eventsError } = useDcgEvents(userDcg?.id);
  const { data: regionalEvents, isLoading: loadingRegional } = useRegionalEventsForDcg(userDcg?.region_id);
  const deleteEvent = useDeleteDcgEvent();

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent.mutateAsync(eventId);
    }
  };

  const handleDuplicateEvent = (event: Event) => {
    setDuplicateSource(event);
  };

  const now = new Date();
  const currentEvents = events?.filter(event => new Date(event.start_datetime) >= now) || [];
  const pastEvents = events?.filter(event => new Date(event.start_datetime) < now) || [];

  const getEventStatusBadge = (event: Event) => {
    if (event.status === 'Cancelled') return <Badge variant="destructive">Cancelled</Badge>;
    if (new Date(event.start_datetime) < now) return <Badge variant="secondary">Completed</Badge>;
    return <Badge variant="default">Upcoming</Badge>;
  };

  // DCG event card (with delete action)
  const renderDcgEventCard = (event: Event) => {
    const duration = formatEventDuration(event.start_datetime, event.end_datetime);
    return (
      <div key={event.id} className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{event.name}</p>
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
            )}
          </div>
          {getEventStatusBadge(event)}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {duration.dateRange}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {event.location_name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedEventForAttendance(event)}
            >
              <UserCheck className="h-3 w-3 mr-1" /> Attendance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleDuplicateEvent(event)}
              title="Duplicate event"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive"
              onClick={() => handleDeleteEvent(event.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Regional event card (no delete, only attendance)
  const renderRegionalEventCard = (event: Event) => {
    const duration = formatEventDuration(event.start_datetime, event.end_datetime);
    return (
      <div key={event.id} className="border border-border rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{event.name}</p>
            {event.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
            )}
          </div>
          {getEventStatusBadge(event)}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {duration.dateRange}
          </span>
          {event.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {event.location_name}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setSelectedEventForAttendance(event)}
          >
            <UserCheck className="h-3 w-3 mr-1" /> Attendance
          </Button>
        </div>
      </div>
    );
  };

  // DCG events table (with actions)
  const renderDcgEventsTable = (eventsList: Event[], noEventsMessage: string) => {
    if (loadingEvents) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (eventsList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {noEventsMessage}
        </div>
      );
    }

    if (useCardView) {
      return <div className="space-y-3">{eventsList.map(renderDcgEventCard)}</div>;
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsList.map((event) => {
              const duration = formatEventDuration(event.start_datetime, event.end_datetime);
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{event.name}</div>
                      {event.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{duration.dateRange}</div>
                        <div className="text-sm text-muted-foreground">
                          {duration.timeRange}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.location_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location_name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.category}</Badge>
                  </TableCell>
                  <TableCell>{getEventStatusBadge(event)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedEventForAttendance(event)}>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Record Attendance
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateEvent(event)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate Event
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Regional events table (no actions column)
  const renderRegionalEventsTable = (eventsList: Event[], noEventsMessage: string) => {
    if (loadingRegional) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (eventsList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {noEventsMessage}
        </div>
      );
    }

    if (useCardView) {
      return <div className="space-y-3">{eventsList.map(renderRegionalEventCard)}</div>;
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventsList.map((event) => {
              const duration = formatEventDuration(event.start_datetime, event.end_datetime);
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{duration.dateRange}</div>
                        <div className="text-sm text-muted-foreground">{duration.timeRange}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.location_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location_name}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline">{event.category}</Badge></TableCell>
                  <TableCell>{getEventStatusBadge(event)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEventForAttendance(event)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" /> Record
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Loading state
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

  return (
    <DcgAdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0 px-[10px]">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold">DCG Events</h1>
            <p className="text-muted-foreground">Create and manage events for your DCG</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-1.5" />
            Create Event
          </Button>
        </div>

        {eventsError && (
          <Alert variant="destructive">
            <AlertDescription>Error loading events: {eventsError.message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="current" className="w-full">
          <TabsList className={cn("w-full", useCardView && "overflow-x-auto flex")}>
            <TabsTrigger value="current" className="flex-1 text-xs md:text-sm">
              Current ({currentEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 text-xs md:text-sm">
              Past ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex-1 text-xs md:text-sm">
              Regional ({regionalEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Current & Future Events</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderDcgEventsTable(currentEvents, "No upcoming events. Create your first event!")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Past Events</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderDcgEventsTable(pastEvents, "No past events found.")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regional" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Regional Events</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Events created by the regional admin
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderRegionalEventsTable(regionalEvents || [], "No regional events found.")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
