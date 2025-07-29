import React, { useState } from 'react';
import { format } from 'date-fns';
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
  Plus, 
  Calendar,
  MapPin,
  Users,
  Clock,
  MoreHorizontal,
  UserCheck,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useDcgEvents, useDeleteDcgEvent } from '@/hooks/useDcgEvents';
import { CreateEventDialog } from '@/components/admin/dcg/CreateEventDialog';
import { EventAttendanceDialog } from '@/components/admin/dcg/EventAttendanceDialog';
import type { Event } from '@/hooks/useDcgEvents';

const DcgEvents = () => {
  const { userDcg } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState<Event | null>(null);

  const { 
    data: events, 
    isLoading: loadingEvents,
    error: eventsError 
  } = useDcgEvents(userDcg?.id);
  
  const deleteEvent = useDeleteDcgEvent();

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent.mutateAsync(eventId);
    }
  };

  // Separate events into current/future and past
  const now = new Date();
  const currentEvents = events?.filter(event => new Date(event.start_datetime) >= now) || [];
  const pastEvents = events?.filter(event => new Date(event.start_datetime) < now) || [];

  const getEventStatusBadge = (event: Event) => {
    const startDate = new Date(event.start_datetime);
    
    if (event.status === 'Cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    
    if (startDate < now) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    
    return <Badge variant="default">Upcoming</Badge>;
  };

  // Render events table for a given list of events
  const renderEventsTable = (eventsList: Event[], noEventsMessage: string) => (
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
          {loadingEvents ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              </TableRow>
            ))
          ) : eventsList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                {noEventsMessage}
              </TableCell>
            </TableRow>
          ) : (
            eventsList.map((event) => (
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
                      <div>{formatEventDuration(event.start_datetime, event.end_datetime).dateRange}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatEventDuration(event.start_datetime, event.end_datetime).timeRange}
                        {formatEventDuration(event.start_datetime, event.end_datetime).isMultiDay && (
                          <div className="text-xs text-amber-600">Multi-day event</div>
                        )}
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
                <TableCell>
                  {getEventStatusBadge(event)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => setSelectedEventForAttendance(event)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Record Attendance
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (!userDcg) {
    return (
      <DcgAdminLayout>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertDescription>
              DCG information not found. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      </DcgAdminLayout>
    );
  }

  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">DCG Events</h1>
            <p className="text-muted-foreground">
              Create and manage events for your DCG
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        {eventsError && (
          <Alert variant="destructive">
            <AlertDescription>
              Error loading events: {eventsError.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Events Tabs */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">
              Current & Future ({currentEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current & Future Events</CardTitle>
                <CardDescription>
                  Upcoming and ongoing events for your DCG
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderEventsTable(
                  currentEvents, 
                  "No current or future events found. Create your first event to get started."
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>
                  Completed events and their history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderEventsTable(
                  pastEvents,
                  "No past events found."
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Event Dialog */}
        <CreateEventDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />

        {/* Attendance Dialog */}
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