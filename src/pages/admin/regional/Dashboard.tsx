
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ChevronUp, Calendar, DollarSign, Home } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RegionalDashboard: React.FC = () => {
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Regional Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your regional dashboard. Here's an overview of your region's activities.
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,523</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500 flex items-center">
                  <ChevronUp className="mr-1 h-4 w-4" /> +12% from last month
                </span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Next: Prayer Convention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fundraising Goal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$25,250</div>
              <p className="text-xs text-muted-foreground">63% of annual goal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total DCGs</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">27</div>
              <p className="text-xs text-muted-foreground">+3 new this quarter</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent-activities">
          <TabsList>
            <TabsTrigger value="recent-activities">Recent Activities</TabsTrigger>
            <TabsTrigger value="financial-overview">Financial Overview</TabsTrigger>
            <TabsTrigger value="dcg-overview">DCG Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="recent-activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Your region's most recent events and activities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>May 12, 2023</TableCell>
                      <TableCell>Sunday Service</TableCell>
                      <TableCell>Worship</TableCell>
                      <TableCell>345</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>May 10, 2023</TableCell>
                      <TableCell>Prayer Meeting</TableCell>
                      <TableCell>Prayer</TableCell>
                      <TableCell>125</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>May 8, 2023</TableCell>
                      <TableCell>Youth Fellowship</TableCell>
                      <TableCell>Fellowship</TableCell>
                      <TableCell>78</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>May 5, 2023</TableCell>
                      <TableCell>DCG Leadership Training</TableCell>
                      <TableCell>Training</TableCell>
                      <TableCell>42</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing 4 of 24 recent activities
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="financial-overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                  Your region's financial summary for the current month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>This Month</TableHead>
                      <TableHead>Last Month</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Tithes</TableCell>
                      <TableCell>$12,450</TableCell>
                      <TableCell>$11,875</TableCell>
                      <TableCell className="text-green-500">+4.8%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Offerings</TableCell>
                      <TableCell>$8,320</TableCell>
                      <TableCell>$7,940</TableCell>
                      <TableCell className="text-green-500">+4.8%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Special Giving</TableCell>
                      <TableCell>$5,000</TableCell>
                      <TableCell>$3,200</TableCell>
                      <TableCell className="text-green-500">+56.3%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fundraising</TableCell>
                      <TableCell>$2,500</TableCell>
                      <TableCell>$4,500</TableCell>
                      <TableCell className="text-red-500">-44.4%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Total Income: $28,270 (+8.2% from last month)
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="dcg-overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DCG Overview</CardTitle>
                <CardDescription>
                  Summary of your region's Discipleship Cell Groups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DCG Name</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Last Meeting</TableHead>
                      <TableHead>Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Living Waters</TableCell>
                      <TableCell>John Doe</TableCell>
                      <TableCell>18</TableCell>
                      <TableCell>May 11, 2023</TableCell>
                      <TableCell>15 (83%)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Faith Builders</TableCell>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell>22</TableCell>
                      <TableCell>May 10, 2023</TableCell>
                      <TableCell>19 (86%)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Grace Fellowship</TableCell>
                      <TableCell>Michael Johnson</TableCell>
                      <TableCell>15</TableCell>
                      <TableCell>May 9, 2023</TableCell>
                      <TableCell>12 (80%)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Hope Carriers</TableCell>
                      <TableCell>Sarah Williams</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>May 12, 2023</TableCell>
                      <TableCell>17 (85%)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing 4 of 27 DCGs. Overall attendance rate: 84%
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalDashboard;
