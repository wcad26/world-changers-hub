
import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign, Calendar, Target, Users, Plus, PiggyBank, TrendingUp, Search } from "lucide-react";

// Mock data for demonstration
const mockCampaigns = [
  { id: 1, name: "Building Fund", goal: 50000, raised: 32500, donors: 78, startDate: "2023-09-01", endDate: "2023-12-31", status: "Active" },
  { id: 2, name: "Mission Trip", goal: 15000, raised: 12750, donors: 45, startDate: "2023-10-15", endDate: "2023-11-30", status: "Active" },
  { id: 3, name: "Youth Center Renovation", goal: 25000, raised: 25000, donors: 63, startDate: "2023-05-01", endDate: "2023-08-31", status: "Completed" },
  { id: 4, name: "Christmas Charity Drive", goal: 10000, raised: 2500, donors: 20, startDate: "2023-11-15", endDate: "2023-12-25", status: "Active" },
];

// Form schema for campaign creation
const campaignSchema = z.object({
  name: z.string().min(3, { message: "Campaign name must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  goal: z.string().min(1, { message: "Please enter a fundraising goal." }),
  startDate: z.string().min(1, { message: "Please select a start date." }),
  endDate: z.string().min(1, { message: "Please select an end date." }),
  image: z.string().optional(),
  isPublic: z.boolean().default(true),
});

const RegionalFundraising: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      goal: "",
      startDate: "",
      endDate: "",
      image: "",
      isPublic: true,
    },
  });

  const filteredCampaigns = mockCampaigns.filter(campaign => 
    (campaign.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || campaign.status.toLowerCase() === statusFilter.toLowerCase())
  );

  function onSubmit(values: z.infer<typeof campaignSchema>) {
    console.log(values);
    // In a real app, this would save the campaign to a database
    alert("Fundraising campaign created successfully!");
    form.reset();
  }

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Fundraising Management</h2>
        <p className="text-muted-foreground">
          Create and manage fundraising campaigns for your region.
        </p>
        
        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-1 md:grid-cols-4 w-full max-w-3xl">
            <TabsTrigger value="active">Active Campaigns</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="create">Create Campaign</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Fundraising Campaigns</CardTitle>
                <CardDescription>
                  View and manage ongoing fundraising initiatives.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search campaigns..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {filteredCampaigns.filter(campaign => campaign.status === "Active").map((campaign) => (
                    <Card key={campaign.id}>
                      <CardHeader className="pb-2">
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>
                          {campaign.startDate} to {campaign.endDate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{Math.round((campaign.raised / campaign.goal) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-wca-purple" 
                              style={{ width: `${Math.min((campaign.raised / campaign.goal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm pt-1">
                            <span>
                              <DollarSign className="inline h-3 w-3" /> 
                              ${campaign.raised.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">
                              Goal: ${campaign.goal.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm">
                            <Users className="inline h-3 w-3 mr-1" /> 
                            {campaign.donors} donors
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm">Details</Button>
                        <Button variant="outline" size="sm">Update</Button>
                      </CardFooter>
                    </Card>
                  ))}
                  
                  {filteredCampaigns.filter(campaign => campaign.status === "Active").length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      No active campaigns found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Campaigns</CardTitle>
                <CardDescription>
                  View the history of completed fundraising initiatives.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign Name</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Amount Raised</TableHead>
                          <TableHead>Donors</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.filter(campaign => campaign.status === "Completed").length > 0 ? (
                          filteredCampaigns.filter(campaign => campaign.status === "Completed").map((campaign) => (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell>${campaign.goal.toLocaleString()}</TableCell>
                              <TableCell>${campaign.raised.toLocaleString()}</TableCell>
                              <TableCell>{campaign.donors}</TableCell>
                              <TableCell>{campaign.startDate} - {campaign.endDate}</TableCell>
                              <TableCell>{Math.round((campaign.raised / campaign.goal) * 100)}%</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">Report</Button>
                                  <Button variant="outline" size="sm">Duplicate</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                              No completed campaigns found
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
                <CardTitle>Create New Fundraising Campaign</CardTitle>
                <CardDescription>
                  Set up a new fundraising initiative for your region.
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
                            <FormLabel>Campaign Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Building Fund" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fundraising Goal ($)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="50000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campaign Image</FormLabel>
                            <FormControl>
                              <Input type="file" className="cursor-pointer" />
                            </FormControl>
                            <FormDescription>
                              Upload an image to represent your campaign
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Campaign Description</FormLabel>
                              <FormControl>
                                <textarea 
                                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                  placeholder="Describe the purpose of this fundraising campaign..."
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                              <FormLabel>Public Campaign</FormLabel>
                              <FormDescription>
                                Display this fundraising campaign on the public website and regional homepage
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline">Cancel</Button>
                      <Button type="submit">
                        <PiggyBank className="mr-2 h-4 w-4" />
                        Create Campaign
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
                <CardTitle>Fundraising Analytics</CardTitle>
                <CardDescription>
                  Track and analyze fundraising performance metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${mockCampaigns.reduce((acc, campaign) => acc + campaign.raised, 0).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">+$5,000 from last month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {mockCampaigns.filter(campaign => campaign.status === "Active").length}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">2 ending this month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {mockCampaigns.reduce((acc, campaign) => acc + campaign.donors, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">+15 new donors</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Fundraising Performance</h3>
                  <div className="h-[300px] border rounded-md p-4 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <TrendingUp className="h-12 w-12 mx-auto text-gray-400" />
                      <p>Fundraising performance trends will be displayed here</p>
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

export default RegionalFundraising;
