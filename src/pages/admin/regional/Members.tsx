
import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Mail, Phone, Calendar, Search, UserCheck, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMembers } from "@/hooks/useMembers";
import { Skeleton } from "@/components/ui/skeleton";
import { useAttendanceEvents, useCreateAttendanceEvent, useSaveAttendance, useAttendanceHistory } from "@/hooks/useAttendance";
import { format } from "date-fns";

// Form schema for member registration
const memberSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

const RegionalMembers: React.FC = () => {
  const { user, userRegion } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState(false);

  const { data: members, isLoading: isLoadingMembers } = useMembers(userRegion?.id);
  const { data: historyData, isLoading: isLoadingHistory } = useAttendanceHistory(userRegion?.id);
  const createAttendanceEvent = useCreateAttendanceEvent();
  const saveAttendance = useSaveAttendance();
  
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      gender: "",
    },
  });

  const filteredMembers = members?.filter(member => {
    const name = `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`;
    const phone = member.profiles?.phone || '';
    // email is not available on profile, so removing search by it for now
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  }) || [];

  function onSubmit(values: z.infer<typeof memberSchema>) {
    console.log(values);
    // TODO: Implement member registration logic.
    // This will likely involve an Edge Function or RPC to create a user, profile, and member record.
    toast({
      title: "Member Registered (Not Implemented)",
      description: "This functionality is not yet connected to the database."
    });
    form.reset();
  }

  const toggleMemberSelection = (id: string) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter(memberId => memberId !== id));
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  const handleSaveAttendance = async () => {
    if (!user || !userRegion || !selectedEvent || !selectedDate) return;

    try {
      // 1. Create the attendance event
      const event = await createAttendanceEvent.mutateAsync({
        region_id: userRegion.id,
        name: selectedEvent,
        event_date: selectedDate,
        created_by: user.id,
      });

      // 2. Prepare attendance records
      const records = filteredMembers.map(member => ({
        event_id: event.id,
        member_id: member.id,
        is_present: selectedMembers.includes(member.id),
        recorded_by: user.id
      }));

      // 3. Save the records
      await saveAttendance.mutateAsync(records);

      toast({
        title: "Attendance saved",
        description: `Saved attendance for ${records.length} members.`
      });
      setSelectedMembers([]);
    } catch (error) {
      toast({
        title: "Error saving attendance",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Member Management</h2>
        <p className="text-muted-foreground">
          Register, track, and manage members within your region.
        </p>
        
        <Tabs defaultValue="directory">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full max-w-3xl">
            <TabsTrigger value="directory">Member Directory</TabsTrigger>
            <TabsTrigger value="register">Register Member</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="directory">
            <Card>
              <CardHeader>
                <CardTitle>Member Directory</CardTitle>
                <CardDescription>
                  View and manage all members in your region.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search members..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Member ID</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingMembers ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell colSpan={6}>
                                <Skeleton className="h-6 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.profiles?.first_name} {member.profiles?.last_name}
                              </TableCell>
                              <TableCell>{member.member_id}</TableCell>
                              <TableCell>{member.profiles?.phone}</TableCell>
                              <TableCell>{member.join_date ? format(new Date(member.join_date), "PPP") : 'N/A'}</TableCell>
                              <TableCell>{member.status}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Phone className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                              No members found
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
          
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register New Member</CardTitle>
                <CardDescription>
                  Add a new member to your region.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main St, City, State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              {...field}
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register Member
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Tracking</CardTitle>
                <CardDescription>
                  Record and monitor member attendance at events and services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!attendanceHistory ? (
                    <div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <Label htmlFor="event-type">Event Type</Label>
                          <select 
                            id="event-type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                          >
                            <option value="">Select event type</option>
                            <option value="sunday-service">Sunday Service</option>
                            <option value="bible-study">Bible Study</option>
                            <option value="prayer-meeting">Prayer Meeting</option>
                            <option value="special-event">Special Event</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="attendance-date">Date</Label>
                          <Input 
                            id="attendance-date"
                            type="date" 
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="rounded-md border overflow-hidden mt-6">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">
                                  <div className="flex items-center justify-center">
                                    <input 
                                      type="checkbox" 
                                      className="h-4 w-4"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMembers(filteredMembers.map(m => m.id));
                                        } else {
                                          setSelectedMembers([]);
                                        }
                                      }}
                                      checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                                    />
                                  </div>
                                </TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoadingMembers ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center h-24">
                                    <Skeleton className="h-6 w-full" />
                                  </TableCell>
                                </TableRow>
                              ) : filteredMembers.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <div className="flex items-center justify-center">
                                      <input 
                                        type="checkbox" 
                                        className="h-4 w-4"
                                        checked={selectedMembers.includes(member.id)}
                                        onChange={() => toggleMemberSelection(member.id)}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">{member.profiles?.first_name} {member.profiles?.last_name}</TableCell>
                                  <TableCell>{member.status}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => toggleMemberSelection(member.id)}
                                      >
                                        {selectedMembers.includes(member.id) ? 
                                          <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                          <UserCheck className="h-4 w-4" />
                                        }
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => setAttendanceHistory(true)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          View Attendance History
                        </Button>
                        <Button 
                          onClick={handleSaveAttendance}
                          disabled={selectedMembers.length === 0 || !selectedEvent || !selectedDate}
                        >
                          Save Attendance
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-4">
                        <h3 className="text-lg font-medium">Attendance History</h3>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAttendanceHistory(false)}
                        >
                          Back to Attendance Taking
                        </Button>
                      </div>
                      
                      <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Event Type</TableHead>
                                <TableHead>Present</TableHead>
                                <TableHead>Absent</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoadingHistory ? (
                                 <TableRow>
                                  <TableCell colSpan={5} className="text-center h-24">
                                    <Skeleton className="h-6 w-full" />
                                  </TableCell>
                                </TableRow>
                              ) : historyData?.map((record) => (
                                <TableRow key={record.event_id}>
                                  <TableCell>{format(new Date(record.event_date), "PPP")}</TableCell>
                                  <TableCell>{record.event_name}</TableCell>
                                  <TableCell className="text-center">{record.present_count}</TableCell>
                                  <TableCell className="text-center">{record.absent_count}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button variant="ghost" size="sm" title="View Details">
                                        <Search className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalMembers;
