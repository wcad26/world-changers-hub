
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
import { UserPlus, Mail, Phone, Calendar, Search, UserCheck } from "lucide-react";

// Mock data for demonstration
const mockMembers = [
  { id: 1, name: "John Doe", email: "john@example.com", phone: "+1234567890", joined: "2023-01-15", status: "Active", attendance: "85%" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "+1234567891", joined: "2023-02-20", status: "Active", attendance: "92%" },
  { id: 3, name: "Michael Johnson", email: "michael@example.com", phone: "+1234567892", joined: "2023-03-10", status: "Inactive", attendance: "45%" },
  { id: 4, name: "Sarah Williams", email: "sarah@example.com", phone: "+1234567893", joined: "2023-04-05", status: "Active", attendance: "78%" },
];

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
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  
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

  const filteredMembers = mockMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

  function onSubmit(values: z.infer<typeof memberSchema>) {
    console.log(values);
    // In a real app, this would save the member to a database
    alert("Member registered successfully!");
    form.reset();
  }

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
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Attendance</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>{member.phone}</TableCell>
                              <TableCell>{member.joined}</TableCell>
                              <TableCell>{member.status}</TableCell>
                              <TableCell>{member.attendance}</TableCell>
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
                            <TableCell colSpan={7} className="text-center h-24">
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
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <FormLabel>Event Type</FormLabel>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                        <option value="">Select event type</option>
                        <option value="sunday-service">Sunday Service</option>
                        <option value="bible-study">Bible Study</option>
                        <option value="prayer-meeting">Prayer Meeting</option>
                        <option value="special-event">Special Event</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <FormLabel>Date</FormLabel>
                      <Input type="date" />
                    </div>
                  </div>
                  
                  <div className="rounded-md border overflow-hidden mt-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <div className="flex items-center justify-center">
                                <input type="checkbox" className="h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Attended</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center justify-center">
                                  <input type="checkbox" className="h-4 w-4" />
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>{member.status}</TableCell>
                              <TableCell>1 week ago</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Phone className="h-4 w-4" />
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
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      View Attendance History
                    </Button>
                    <Button>
                      Save Attendance
                    </Button>
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

export default RegionalMembers;
