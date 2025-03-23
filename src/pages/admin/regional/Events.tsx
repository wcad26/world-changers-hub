
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
import { Calendar, Clock, MapPin, Users, Plus, CalendarDays, BarChart2, Search } from "lucide-react";

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
  type: z.string().min(1, { message: "Please select an event type." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  date: z.string().min(1, { message: "Please select a date." }),
  time: z.string().min(1, { message: "Please provide a time." }),
  location: z.string().min(3, { message: "Please provide a location." }),
  capacity: z.string().min(1, { message: "Please enter the capacity." }),
  isPublic: z.boolean().default(true),
});

const RegionalEvents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      date: "",
      time: "",
      location: "",
      capacity: "",
      isPublic: true,
    },
  });

  const filteredEvents = mockEvents.filter(event => 
    (event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || event.status.toLowerCase() === statusFilter.toLowerCase())
  );

  function onSubmit(values: z.infer<typeof eventSchema>) {
    console.log(values);
    // In a real app, this would save the event to a database
    alert("Event created successfully!");
    form.reset();
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Event Management</h2>
        <p className="text-muted-foreground">
          Plan, organize, and track events within your region.
        </p>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
            <TabsTrigger value="create">Create Event</TabsTrigger>
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
                          <TableHead>Expected Attendees</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.filter(event => event.status === "Upcoming").length > 0 ? (
                          filteredEvents.filter(event => event.status === "Upcoming").map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.name}</TableCell>
                              <TableCell>{event.type}</TableCell>
                              <TableCell>{event.date}</TableCell>
                              <TableCell>{event.time}</TableCell>
                              <TableCell>{event.location}</TableCell>
                              <TableCell>{event.attendees}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">Edit</Button>
                                  <Button variant="outline" size="sm">Cancel</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              No upcoming events found
                            </TableCell>
                          </TableRow>
                        )}
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
                          <TableHead>Actual Attendees</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.filter(event => event.status === "Completed").length > 0 ? (
                          filteredEvents.filter(event => event.status === "Completed").map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.name}</TableCell>
                              <TableCell>{event.type}</TableCell>
                              <TableCell>{event.date}</TableCell>
                              <TableCell>{event.time}</TableCell>
                              <TableCell>{event.location}</TableCell>
                              <TableCell>{event.attendees}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">View Report</Button>
                                  <Button variant="outline" size="sm">Duplicate</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              No past events found
                            </TableCell>
                          </TableRow>
                        )}
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
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              {...field}
                            >
                              <option value="">Select event type</option>
                              <option value="conference">Conference</option>
                              <option value="worship">Worship Service</option>
                              <option value="revival">Revival Meeting</option>
                              <option value="outreach">Community Outreach</option>
                              <option value="training">Training Workshop</option>
                              <option value="other">Other</option>
                            </select>
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
                        name="location"
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
                              <Input type="number" placeholder="100" {...field} />
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
                        name="isPublic"
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
                      <Button type="submit">
                        <Calendar className="mr-2 h-4 w-4" />
                        Create Event
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
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
    </RegionalAdminLayout>
  );
};

export default RegionalEvents;
