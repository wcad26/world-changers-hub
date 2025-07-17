import React, { useState, useEffect } from 'react';
import { format, isToday, isFuture } from 'date-fns';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserCheck, 
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Search,
  MoreHorizontal,
  RefreshCw,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useDcgEvents } from '@/hooks/useDcgEvents';
import { EventAttendanceDialog } from '@/components/admin/dcg/EventAttendanceDialog';

const DcgAttendance = () => {
  const { userDcg } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { 
    data: events, 
    isLoading: loadingEvents, 
    error: eventsError 
  } = useDcgEvents(userDcg?.id);

  const filteredEvents = events?.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format(new Date(event.start_datetime), 'PPP').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Helper to check if event has past
  const isPastEvent = (event: any) => {
    return new Date(event.start_datetime) < new Date();
  };

  // Get upcoming events
  const upcomingEvents = filteredEvents.filter(event => !isPastEvent(event));
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

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
        {/* Quick Actions Section */}
        {nextEvent && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Next Event
              </CardTitle>
              <CardDescription>
                {nextEvent.name} - {format(new Date(nextEvent.start_datetime), 'PPP')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setSelectedEvent(nextEvent)}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Record Attendance
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">DCG Attendance</h1>
            <p className="text-muted-foreground">
              Record attendance for your DCG events
            </p>
          </div>
        </div>

        {/* Event Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingEvents ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  events?.length || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                All DCG events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingEvents ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  upcomingEvents.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Future events to attend
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Events</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingEvents ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  events?.filter(e => isPastEvent(e)).length || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Completed events
              </p>
            </CardContent>
          </Card>
        </div>

        {/* DCG Events for Attendance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>DCG Events</CardTitle>
                <CardDescription>
                  Record attendance for your DCG events
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
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
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No events match your search" : "No events found. Create events on the Events page."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => {
                      const isUpcoming = !isPastEvent(event);
                      
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
                            <div>
                              <div>{format(new Date(event.start_datetime), 'PPP')}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(event.start_datetime), 'p')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isUpcoming ? 'default' : 'secondary'}>
                              {isUpcoming ? 'Upcoming' : 'Completed'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedEvent(event)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Record Attendance
                                </DropdownMenuItem>
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
          </CardContent>
        </Card>
      </div>

      {/* Record Attendance Dialog */}
      {selectedEvent && (
        <EventAttendanceDialog
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          event={selectedEvent}
          dcgId={userDcg.id}
        />
      )}
    </DcgAdminLayout>
  );
};

export default DcgAttendance;