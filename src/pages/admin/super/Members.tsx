
import React, { useState } from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, Mail, Phone, Calendar, Search, Filter, Download, BarChart, Loader2 } from "lucide-react";
import { useAllMembers, useGlobalMemberStats } from "@/hooks/useAllMembers";
import { useAllRegions } from "@/hooks/useAllRegions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";


// Form schema for member registration
const memberSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  region: z.string().min(1, { message: "Please select a region." }),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

const SuperMembers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Fetch real data from database
  const { data: regions, isLoading: regionsLoading } = useAllRegions();
  const { data: members, isLoading: membersLoading } = useAllMembers({
    searchTerm,
    regionId: selectedRegion || undefined,
    status: statusFilter || undefined,
  });
  const { data: memberStats, isLoading: statsLoading } = useGlobalMemberStats();
  
  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      region: "",
      address: "",
      dateOfBirth: "",
      gender: "",
    },
  });

  function onSubmit(values: z.infer<typeof memberSchema>) {
    console.log(values);
    // In a real app, this would save the member to a database
    alert("Member registered successfully!");
    form.reset();
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Global Member Management</h2>
        <p className="text-muted-foreground">
          Manage membership across all WCA regions.
        </p>
        
        <Tabs defaultValue="directory">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full max-w-3xl">
            <TabsTrigger value="directory">Member Directory</TabsTrigger>
            <TabsTrigger value="register">Register Member</TabsTrigger>
            <TabsTrigger value="analytics">Member Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="directory">
            <Card>
              <CardHeader>
                <CardTitle>Global Member Directory</CardTitle>
                <CardDescription>
                  Access and manage the complete WCA membership database.
                </CardDescription>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search members globally..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      disabled={regionsLoading}
                    >
                      <option value="">All Regions</option>
                      {regions?.map(region => (
                        <option key={region.id} value={region.id}>{region.name}</option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="new">New</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {members?.length || 0} members
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membersLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : members && members.length > 0 ? (
                          members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.profiles?.first_name} {member.profiles?.last_name}
                              </TableCell>
                              <TableCell>{member.profiles?.email || 'N/A'}</TableCell>
                              <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
                              <TableCell>{member.regions?.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={member.member_type === 'member' ? 'default' : 'secondary'}>
                                  {member.member_type === 'member' ? 'Member' : 'Visitor'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {member.join_date ? format(new Date(member.join_date), 'MMM d, yyyy') : 'N/A'}
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
                  Add a new member to the global database.
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
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                              {...field}
                              disabled={regionsLoading}
                            >
                              <option value="">Select region</option>
                              {regions?.map(region => (
                                <option key={region.id} value={region.id}>{region.name}</option>
                              ))}
                            </select>
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
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Member Analytics</CardTitle>
                <CardDescription>
                  View global membership statistics and trends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : memberStats && memberStats.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <p className="text-lg font-medium text-muted-foreground mb-1">Total Members</p>
                          <h3 className="text-4xl font-bold">
                            {memberStats.reduce((acc, curr) => acc + curr.total, 0)}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2">Across all regions</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <p className="text-lg font-medium text-muted-foreground mb-1">Active Members</p>
                          <h3 className="text-4xl font-bold text-green-600">
                            {memberStats.reduce((acc, curr) => acc + curr.active, 0)}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2">
                            {memberStats.reduce((acc, curr) => acc + curr.total, 0) > 0
                              ? Math.round((memberStats.reduce((acc, curr) => acc + curr.active, 0) / memberStats.reduce((acc, curr) => acc + curr.total, 0)) * 100)
                              : 0}% of total
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="flex flex-col items-center justify-center p-6">
                          <p className="text-lg font-medium text-muted-foreground mb-1">Inactive Members</p>
                          <h3 className="text-4xl font-bold text-red-600">
                            {memberStats.reduce((acc, curr) => acc + curr.inactive, 0)}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-2">
                            {memberStats.reduce((acc, curr) => acc + curr.total, 0) > 0
                              ? Math.round((memberStats.reduce((acc, curr) => acc + curr.inactive, 0) / memberStats.reduce((acc, curr) => acc + curr.total, 0)) * 100)
                              : 0}% of total
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                
                    <h3 className="text-lg font-medium mb-4">Membership by Region</h3>
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Region</TableHead>
                              <TableHead>Total Members</TableHead>
                              <TableHead>Active</TableHead>
                              <TableHead>Inactive</TableHead>
                              <TableHead>New</TableHead>
                              <TableHead>Active Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memberStats.map((stat) => (
                              <TableRow key={stat.region_id}>
                                <TableCell className="font-medium">{stat.region_name}</TableCell>
                                <TableCell>{stat.total}</TableCell>
                                <TableCell className="text-green-600">{stat.active}</TableCell>
                                <TableCell className="text-red-600">{stat.inactive}</TableCell>
                                <TableCell className="text-blue-600">{stat.new}</TableCell>
                                <TableCell>
                                  {stat.total > 0 ? Math.round((stat.active / stat.total) * 100) : 0}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No member statistics available
                  </div>
                )}
                
                <div className="flex justify-center mt-6">
                  <Button variant="outline">
                    <BarChart className="mr-2 h-4 w-4" />
                    View Detailed Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperMembers;
