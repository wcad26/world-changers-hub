import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, MapPin, Users, Plus, CalendarDays, BarChart2, Search, AlertCircle, Trash2, MoreHorizontal, Edit, UserCheck, TrendingUp, TrendingDown, Eye, Filter } from "lucide-react";
import { useRegionalEvents, useCreateEvent, useDeleteEvent, NewEvent } from "@/hooks/useEvents";
import { useAttendanceHistoryWithMemberTypes } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AttendanceManagementDialog } from "@/components/admin/regional/events/AttendanceManagementDialog";

const eventCategories = [
  'Conference', 'Worship', 'Revival', 'Outreach', 'Training', 'Workshop', 'Community Service', 'Bible Study', 'Retreat', 'Seminar', 'DCG Meeting', 'Other'
] as const;

// Mock data for demonstration
const mockEvents = [
  { id: 1, name: "Annual Conference", type: "Conference", date: "2023-11-15", time: "09:00 AM", location: "Main Hall", attendees: 120, status: "Upcoming" },
  { id: 2, name: "Prayer and Worship Night", type: "Worship", date: "2023-11-22", time: "06:00 PM", location: "Sanctuary", attendees: 85, status: "Upcoming" },
  { id: 3, name: "Youth Revival Meeting", type: "Revival", date: "2023-10-10", time: "04:00 PM", location: "Youth Center", attendees: 150, status: "Completed" },
  { id: 4, name: "Community Outreach", type: "Outreach", date: "2023-12-05", time: "10:00 AM", location: "Downtown Area", attendees: 45, status: "Upcoming" },
];

// Form schema for event creation
const eventSchema = z.object({
  name: z.string().min(3, { message: "Event name must be at least 3 characters." }),
  category: z.enum(eventCategories),
  description: z.string().optional(),
  date: z.string().min(1, { message: "Please select a date." }),
  time: z.string().min(1, { message: "Please provide a time." }),
  location_name: z.string().min(3, { message: "Please provide a location." }),
  capacity: z.coerce.number().positive().int().optional(),
  is_public: z.boolean().default(true),
});

const RegionalEvents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("3months");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drilldownEvent, setDrilldownEvent] = useState<any>(null);
  const { toast } = useToast();

  const { userRegion } = useAuth();
  const { data: events, isLoading, isError, error } = useRegionalEvents();
  const { data: attendanceData } = useAttendanceHistoryWithMemberTypes(userRegion?.id);
  const createEventMutation = useCreateEvent();
  const deleteEventMutation = useDeleteEvent();

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      date: "",
      time: "",
      location_name: "",
      is_public: true,
    },
  });

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    return events.filter(event => 
      (event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.category && event.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location_name && event.location_name.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [events, searchTerm]);
  
  const upcomingEvents = React.useMemo(() => filteredEvents.filter(e => new Date(e.start_datetime) >= new Date() && e.status !== 'Cancelled'), [filteredEvents]);
  const pastEvents = React.useMemo(() => filteredEvents.filter(e => new Date(e.start_datetime) < new Date() || e.status === 'Completed' || e.status === 'Cancelled'), [filteredEvents]);

  // Analytics calculations using real data
  const analyticsData = React.useMemo(() => {
    if (!events || !attendanceData) return {
      totalEvents: 0,
      avgAttendance: 0,
      totalAttendance: 0,
      categoryBreakdown: [],
      attendanceTrend: [],
      topPerformingEvents: [],
      categoryPerformance: [],
      monthlyComparison: { thisMonth: 0, lastMonth: 0, change: 0 }
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Event counts by category
    const categoryBreakdown = eventCategories.map(category => ({
      category,
      count: events.filter(e => e.category === category).length,
      attendance: attendanceData
        .filter(a => events.find(e => e.name === a.event_name)?.category === category)
        .reduce((sum, a) => sum + a.total_present, 0)
    })).filter(c => c.count > 0);

    // Top performing events by attendance
    const topPerformingEvents = attendanceData
      .sort((a, b) => b.total_present - a.total_present)
      .slice(0, 5)
      .map(event => ({
        name: event.event_name,
        attendance: event.total_present,
        date: event.event_date,
        attendanceRate: event.total_present > 0 ? Math.round((event.total_present / (event.total_present + event.total_absent)) * 100) : 0
      }));

    // Monthly attendance trend
    const attendanceTrend = attendanceData
      .slice(0, 12)
      .reverse()
      .map(event => ({
        date: event.event_date,
        attendance: event.total_present,
        name: event.event_name.length > 20 ? `${event.event_name.substring(0, 20)}...` : event.event_name
      }));

    // This month vs last month
    const thisMonthEvents = attendanceData.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });

    const lastMonthEvents = attendanceData.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate.getMonth() === lastMonth && eventDate.getFullYear() === lastMonthYear;
    });

    const thisMonthAttendance = thisMonthEvents.reduce((sum, e) => sum + e.total_present, 0);
    const lastMonthAttendance = lastMonthEvents.reduce((sum, e) => sum + e.total_present, 0);
    const monthlyChange = lastMonthAttendance > 0 ? Math.round(((thisMonthAttendance - lastMonthAttendance) / lastMonthAttendance) * 100) : 0;

    return {
      totalEvents: events.length,
      avgAttendance: attendanceData.length > 0 ? Math.round(attendanceData.reduce((sum, e) => sum + e.total_present, 0) / attendanceData.length) : 0,
      totalAttendance: attendanceData.reduce((sum, e) => sum + e.total_present, 0),
      categoryBreakdown,
      attendanceTrend,
      topPerformingEvents,
      categoryPerformance: categoryBreakdown,
      monthlyComparison: { thisMonth: thisMonthAttendance, lastMonth: lastMonthAttendance, change: monthlyChange }
    };
  }, [events, attendanceData]);

  async function onSubmit(values: z.infer<typeof eventSchema>) {
    const start_datetime = new Date(`${values.date}T${values.time}`).toISOString();
    
    const newEventData: Omit<NewEvent, 'id' | 'created_at' | 'updated_at' | 'region_id' | 'created_by'> = {
        name: values.name,
        description: values.description || null,
        category: values.category,
        start_datetime: start_datetime,
        end_datetime: null,
        location_name: values.location_name,
        address: null,
        image_url: null,
        capacity: values.capacity || null,
        is_public: values.is_public,
        is_featured: false,
        status: 'Upcoming',
        dcg_id: null,
    };

    createEventMutation.mutate(newEventData, {
      onSuccess: () => {
        toast({ title: "Success", description: "Event created successfully." });
        form.reset();
        setCreateEventDialogOpen(false);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Could not create event.", variant: "destructive" });
      }
    });
  }
  
  const handleDelete = (id: string) => {
    deleteEventMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Success", description: "Event deleted successfully." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Could not delete event.", variant: "destructive" });
      }
    });
  };

  const handleAttendance = (event: any) => {
    setSelectedEvent(event);
    setAttendanceDialogOpen(true);
  };

  const handleEdit = (event: any) => {
    // TODO: Implement edit functionality
    toast({ title: "Info", description: "Edit functionality coming soon." });
  };

  const renderTableBody = (eventList: typeof events) => {
    if (isLoading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
        </TableRow>
      ));
    }
    if (!eventList || eventList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center h-24">No events found</TableCell>
        </TableRow>
      );
    }
    return eventList.map((event) => (
      <TableRow key={event.id}>
        <TableCell className="font-medium">{event.name}</TableCell>
        <TableCell>{event.category}</TableCell>
        <TableCell>{format(new Date(event.start_datetime), 'MMM dd, yyyy')}</TableCell>
        <TableCell>{format(new Date(event.start_datetime), 'p')}</TableCell>
        <TableCell>{event.location_name}</TableCell>
        <TableCell>{event.capacity ?? 'N/A'}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(event)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAttendance(event)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Record Attendance
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
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
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Event Management</h2>
        <p className="text-muted-foreground">
          Plan, organize, and track events within your region.
        </p>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  View and manage scheduled events in your region.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search events..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setCreateEventDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading events</AlertTitle>
                    <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
                  </Alert>
                )}
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderTableBody(upcomingEvents)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Past Events</CardTitle>
                <CardDescription>
                  View history of completed events.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search past events..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error loading events</AlertTitle>
                    <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
                  </Alert>
                )}
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renderTableBody(pastEvents)}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          
          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('total')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.totalEvents}</div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">All time</p>
                      <div className={`flex items-center gap-1 ${analyticsData.monthlyComparison.change > 0 ? 'text-green-600' : analyticsData.monthlyComparison.change < 0 ? 'text-red-600' : 'text-primary'}`}>
                        {analyticsData.monthlyComparison.change !== 0 && (
                          analyticsData.monthlyComparison.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {analyticsData.monthlyComparison.change > 0 ? '+' : ''}{analyticsData.monthlyComparison.change}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('attendance')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.avgAttendance}</div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Per event</p>
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs font-medium">+12%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('total_attendance')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
                    <BarChart2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.totalAttendance}</div>
                    <p className="text-xs text-muted-foreground">Cumulative</p>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldownEvent('upcoming')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                    <p className="text-xs text-muted-foreground">Next 30 days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5" />
                      Attendance Trend
                    </CardTitle>
                    <CardDescription>Event attendance over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {analyticsData.attendanceTrend.length > 0 ? (
                        <div className="space-y-3">
                          {analyticsData.attendanceTrend.slice(0, 8).map((event, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => setDrilldownEvent(event)}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{event.name}</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM dd, yyyy')}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right">
                                  <div className="font-bold text-lg">{event.attendance}</div>
                                  <div className="text-xs text-muted-foreground">attendees</div>
                                </div>
                                <div className="w-12 h-6 bg-primary/10 rounded-full relative overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min((event.attendance / Math.max(...analyticsData.attendanceTrend.map(e => e.attendance))) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No attendance data available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Event Categories Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Event Categories
                    </CardTitle>
                    <CardDescription>Distribution by event type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      {analyticsData.categoryBreakdown.length > 0 ? (
                        <div className="space-y-3">
                          {analyticsData.categoryBreakdown.map((category, index) => (
                            <div 
                              key={category.category} 
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => setSelectedCategory(category.category)}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                                />
                                <div>
                                  <div className="font-medium">{category.category}</div>
                                  <div className="text-xs text-muted-foreground">{category.count} events</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{category.attendance}</div>
                                <div className="text-xs text-muted-foreground">total attendance</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No event categories available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Performing Events
                  </CardTitle>
                  <CardDescription>Highest attendance events</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData.topPerformingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {analyticsData.topPerformingEvents.map((event, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setDrilldownEvent(event)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="font-bold text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-medium">{event.name}</div>
                              <div className="text-sm text-muted-foreground">{format(new Date(event.date), 'MMM dd, yyyy')}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{event.attendance}</div>
                            <div className="text-sm text-muted-foreground">{event.attendanceRate}% attendance rate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No performance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Drilldown Dialog */}
              {drilldownEvent && (
                <Dialog open={!!drilldownEvent} onOpenChange={() => setDrilldownEvent(null)}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Event Details</DialogTitle>
                      <DialogDescription>
                        Detailed analytics for selected metric
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {typeof drilldownEvent === 'object' && drilldownEvent.name ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Event Name</div>
                              <div className="font-medium">{drilldownEvent.name}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Date</div>
                              <div className="font-medium">{format(new Date(drilldownEvent.date), 'MMM dd, yyyy')}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Attendance</div>
                              <div className="font-medium">{drilldownEvent.attendance} people</div>
                            </div>
                            {drilldownEvent.attendanceRate && (
                              <div>
                                <div className="text-sm text-muted-foreground">Attendance Rate</div>
                                <div className="font-medium">{drilldownEvent.attendanceRate}%</div>
                              </div>
                            )}
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => {
                              setDrilldownEvent(null);
                              // Could implement navigation to detailed event view
                              toast({ title: "Info", description: "Detailed event view coming soon." });
                            }}
                          >
                            View Full Event Details
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p>Analytics overview for {drilldownEvent}</p>
                          <Button variant="outline" onClick={() => setDrilldownEvent(null)} className="mt-4">
                            Close
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={createEventDialogOpen} onOpenChange={setCreateEventDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Plan and schedule a new event for your region.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Annual Conference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          {...field}
                        >
                          <option value="">Select event type</option>
                          {eventCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Hall" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Event Description</FormLabel>
                      <FormControl>
                        <textarea 
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                          placeholder="Provide details about the event..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Public Event</FormLabel>
                        <FormDescription>
                          Display this event on the public website and regional homepage
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateEventDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Attendance Management Dialog */}
      {selectedEvent && (
        <AttendanceManagementDialog
          isOpen={attendanceDialogOpen}
          onClose={() => {
            setAttendanceDialogOpen(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
        />
      )}
    </RegionalAdminLayout>
  );
};

export default RegionalEvents;
