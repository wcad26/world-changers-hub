
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ChevronUp, Calendar, DollarSign, Globe } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SuperDashboard: React.FC = () => {
  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the WCA super admin dashboard. Here's an overview of global operations.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">125,742</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <ChevronUp className="mr-1 h-4 w-4" /> +8% from last quarter
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regional Branches</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">Across 15 countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Fundraising</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.1M</div>
              <p className="text-xs text-muted-foreground">75% of annual goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Global leadership conference in 15 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="regions">
          <TabsList>
            <TabsTrigger value="regions">Regional Overview</TabsTrigger>
            <TabsTrigger value="global-finances">Global Finances</TabsTrigger>
            <TabsTrigger value="major-events">Major Events</TabsTrigger>
          </TabsList>
          <TabsContent value="regions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Regional Overview</CardTitle>
                <CardDescription>
                  Performance overview of top WCA regions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>DCGs</TableHead>
                      <TableHead>Monthly Giving</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>North America</TableCell>
                      <TableCell>34,250</TableCell>
                      <TableCell className="text-green-500">+5.2%</TableCell>
                      <TableCell>324</TableCell>
                      <TableCell>$425,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Western Europe</TableCell>
                      <TableCell>28,430</TableCell>
                      <TableCell className="text-green-500">+3.8%</TableCell>
                      <TableCell>256</TableCell>
                      <TableCell>$380,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Africa</TableCell>
                      <TableCell>42,750</TableCell>
                      <TableCell className="text-green-500">+10.5%</TableCell>
                      <TableCell>512</TableCell>
                      <TableCell>$295,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Asia Pacific</TableCell>
                      <TableCell>20,312</TableCell>
                      <TableCell className="text-green-500">+7.3%</TableCell>
                      <TableCell>215</TableCell>
                      <TableCell>$275,000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing 4 of 15 major regions
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="global-finances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Financial Overview</CardTitle>
                <CardDescription>
                  Financial performance across all regions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>This Quarter</TableHead>
                      <TableHead>Last Quarter</TableHead>
                      <TableHead>YTD</TableHead>
                      <TableHead>Annual Goal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Tithes</TableCell>
                      <TableCell>$2,450,000</TableCell>
                      <TableCell>$2,320,000</TableCell>
                      <TableCell>$7,150,000</TableCell>
                      <TableCell>$10,000,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Offerings</TableCell>
                      <TableCell>$1,820,000</TableCell>
                      <TableCell>$1,750,000</TableCell>
                      <TableCell>$5,320,000</TableCell>
                      <TableCell>$7,500,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fundraising</TableCell>
                      <TableCell>$850,000</TableCell>
                      <TableCell>$720,000</TableCell>
                      <TableCell>$2,150,000</TableCell>
                      <TableCell>$3,000,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Special Projects</TableCell>
                      <TableCell>$1,200,000</TableCell>
                      <TableCell>$950,000</TableCell>
                      <TableCell>$3,420,000</TableCell>
                      <TableCell>$5,000,000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Total YTD: $18,040,000 (71% of annual goal)
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="major-events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Major Upcoming Events</CardTitle>
                <CardDescription>
                  Global events scheduled for the next quarter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Expected Attendance</TableHead>
                      <TableHead>Budget</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Global Leadership Conference</TableCell>
                      <TableCell>June 15-18, 2023</TableCell>
                      <TableCell>New York, USA</TableCell>
                      <TableCell>1,500</TableCell>
                      <TableCell>$350,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>European Ministers Retreat</TableCell>
                      <TableCell>July 8-12, 2023</TableCell>
                      <TableCell>Geneva, Switzerland</TableCell>
                      <TableCell>800</TableCell>
                      <TableCell>$175,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Africa Youth Summit</TableCell>
                      <TableCell>August 5-7, 2023</TableCell>
                      <TableCell>Nairobi, Kenya</TableCell>
                      <TableCell>2,500</TableCell>
                      <TableCell>$220,000</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Asian Pastors Conference</TableCell>
                      <TableCell>September 22-25, 2023</TableCell>
                      <TableCell>Singapore</TableCell>
                      <TableCell>1,200</TableCell>
                      <TableCell>$195,000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Total budget for upcoming events: $940,000
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperDashboard;
