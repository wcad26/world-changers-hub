import React, { useState } from 'react';
import { format } from 'date-fns';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  const getEventStatusBadge = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.start_datetime);
    
    if (event.status === 'Cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    
    if (startDate < now) {
      return <Badge variant="secondary">Completed</Badge>;
    }
    
    return <Badge variant="default">Upcoming</Badge>;
  };

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

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Manage your DCG events and record attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eventsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  Error loading events: {eventsError.message}
                </AlertDescription>
              </Alert>
            )}

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
                  ) : events && events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No events found. Create your first event to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    events?.map((event) => (
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
                              <div>{format(new Date(event.start_datetime), 'PPP')}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(event.start_datetime), 'p')}
                                {event.end_datetime && (
                                  <> - {format(new Date(event.end_datetime), 'p')}</>
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
          </CardContent>
        </Card>

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