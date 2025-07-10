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
import { Calendar, Clock, MapPin, Users, Plus, CalendarDays, BarChart2, Search, AlertCircle, Trash2, UserCheck } from "lucide-react";
import { useRegionalEvents, useCreateEvent, useDeleteEvent, NewEvent } from "@/hooks/useEvents";
import { useAttendanceEvents } from "@/hooks/useAttendance";
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
import { CreateAttendanceDialog } from "@/components/admin/regional/events/CreateAttendanceDialog";
import { RecordAttendanceDialog } from "@/components/admin/regional/events/RecordAttendanceDialog";
import { AttendanceReportView } from "@/components/admin/regional/events/AttendanceReportView";

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
  const [selectedAttendanceEvent, setSelectedAttendanceEvent] = useState<any>(null);
  const [recordAttendanceOpen, setRecordAttendanceOpen] = useState(false);
  const { toast } = useToast();
  const { userRegion } = useAuth();

  const { data: events, isLoading, isError, error } = useRegionalEvents();
  const { data: attendanceEvents, isLoading: attendanceLoading } = useAttendanceEvents(userRegion?.id);
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
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Edit</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
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
          </div>
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
          <TabsList className="grid grid-cols-1 md:grid-cols-5 w-full max-w-4xl">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
            <TabsTrigger value="create">Create Event</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
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
                  <Button>
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
          
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Event</CardTitle>
                <CardDescription>
                  Plan and schedule a new event for your region.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline">Cancel</Button>
                      <Button type="submit" disabled={createEventMutation.isPending}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {createEventMutation.isPending ? "Creating..." : "Create Event"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Tracking</CardTitle>
                  <CardDescription>
                    Create attendance events and record member attendance for regional activities.
                  </CardDescription>
                  <div className="flex justify-end">
                    <CreateAttendanceDialog />
                  </div>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : !attendanceEvents || attendanceEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No attendance events created yet. Create your first attendance event to start tracking.
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event Name</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendanceEvents.map((event) => (
                              <TableRow key={event.id}>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell>{new Date(event.event_date).toLocaleDateString()}</TableCell>
                                <TableCell>{event.description || "No description"}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAttendanceEvent(event);
                                      setRecordAttendanceOpen(true);
                                    }}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Record Attendance
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attendance Reports */}
              <AttendanceReportView />
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Event Analytics</CardTitle>
                <CardDescription>
                  Track and analyze event performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{mockEvents.length}</div>
                      <p className="text-xs text-muted-foreground mt-1">+2 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(mockEvents.reduce((acc, event) => acc + event.attendees, 0) / mockEvents.length)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">+15% increase</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {mockEvents.filter(event => event.status === "Upcoming").length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Next in 3 days</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Event Performance</h3>
                  <div className="h-[300px] border rounded-md p-4 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <BarChart2 className="h-12 w-12 mx-auto text-gray-400" />
                      <p>Event performance charts will be displayed here</p>
                      <Button variant="outline" size="sm">Generate Report</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Record Attendance Dialog */}
      {selectedAttendanceEvent && (
        <RecordAttendanceDialog
          event={selectedAttendanceEvent}
          open={recordAttendanceOpen}
          onOpenChange={(open) => {
            setRecordAttendanceOpen(open);
            if (!open) {
              setSelectedAttendanceEvent(null);
            }
          }}
        />
      )}
    </RegionalAdminLayout>
  );
};

export default RegionalEvents;
