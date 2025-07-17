import React, { useState } from 'react';
import { format } from 'date-fns';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  UserCheck, 
  Calendar,
  Users,
  TrendingUp,
  Search,
  MoreHorizontal,
  Eye
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { 
  useDcgAttendanceEvents, 
  useDcgAttendanceAnalytics,
  useDcgAttendanceHistory 
} from '@/hooks/useDcgAttendance';
import { CreateDcgAttendanceEventDialog } from '@/components/admin/dcg/CreateDcgAttendanceEventDialog';
import { DcgAttendanceRecordDialog } from '@/components/admin/dcg/DcgAttendanceRecordDialog';

const DcgAttendance = () => {
  const { userDcg } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { 
    data: attendanceEvents, 
    isLoading: loadingEvents, 
    error: eventsError 
  } = useDcgAttendanceEvents(userDcg?.id);
  
  const { 
    data: analytics, 
    isLoading: loadingAnalytics 
  } = useDcgAttendanceAnalytics(userDcg?.id);
  
  const { 
    data: attendanceHistory 
  } = useDcgAttendanceHistory(userDcg?.id);

  const filteredEvents = attendanceEvents?.filter(event => 
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format(new Date(event.event_date), 'PPP').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getAttendanceRate = (eventId: string) => {
    const historyItem = attendanceHistory?.find(h => h.event_id === eventId);
    if (!historyItem) return 0;
    
    const total = historyItem.total_present + historyItem.total_absent;
    return total > 0 ? (historyItem.total_present / total) * 100 : 0;
  };

  const getAttendanceCounts = (eventId: string) => {
    const historyItem = attendanceHistory?.find(h => h.event_id === eventId);
    return {
      present: historyItem?.total_present || 0,
      total: (historyItem?.total_present || 0) + (historyItem?.total_absent || 0)
    };
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
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">
              Track and manage DCG member attendance for meetings and events
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingAnalytics ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  analytics?.totalEvents || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                All time attendance events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingAnalytics ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${Math.round(analytics?.averageAttendanceRate || 0)}%`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Overall attendance rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingAnalytics ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${Math.round(analytics?.thisMonthRate || 0)}%`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Current month attendance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingAnalytics ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className={analytics?.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics?.monthlyChange >= 0 ? '+' : ''}
                    {Math.round(analytics?.monthlyChange || 0)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                vs last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Events */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Attendance Events</CardTitle>
                <CardDescription>
                  Manage and record attendance for DCG meetings and events
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
                  Error loading attendance events: {eventsError.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Rate</TableHead>
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
                        {searchTerm ? "No events match your search" : "No attendance events found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => {
                      const counts = getAttendanceCounts(event.id);
                      const rate = getAttendanceRate(event.id);
                      
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>{format(new Date(event.event_date), 'PPP')}</TableCell>
                          <TableCell>
                            {counts.present}/{counts.total}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rate >= 75 ? 'default' : rate >= 50 ? 'secondary' : 'destructive'}>
                              {Math.round(rate)}%
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

      {/* Create Event Dialog */}
      <CreateDcgAttendanceEventDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        dcgId={userDcg.id}
      />

      {/* Record Attendance Dialog */}
      {selectedEvent && (
        <DcgAttendanceRecordDialog
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          attendanceEvent={selectedEvent}
          dcgId={userDcg.id}
        />
      )}
    </DcgAdminLayout>
  );
};

export default DcgAttendance;