import React, { useState } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, LineChart, PieChart, DonutChart } from "@/components/ui/chart";
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Download, Calendar, Filter, RefreshCw, AlertTriangle } from "lucide-react";
import { useRegionalReports } from "@/hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for demonstration
const mockAttendanceData = [
  { month: "Jan", attendance: 340 },
  { month: "Feb", attendance: 325 },
  { month: "Mar", attendance: 375 },
  { month: "Apr", attendance: 390 },
  { month: "May", attendance: 410 },
  { month: "Jun", attendance: 395 },
  { month: "Jul", attendance: 380 },
  { month: "Aug", attendance: 400 },
  { month: "Sep", attendance: 420 },
  { month: "Oct", attendance: 430 },
  { month: "Nov", attendance: 0 },
  { month: "Dec", attendance: 0 },
];

const mockFinancialData = [
  { month: "Jan", tithes: 12500, offerings: 7500, specialGiving: 2000 },
  { month: "Feb", tithes: 13000, offerings: 8000, specialGiving: 1500 },
  { month: "Mar", tithes: 12800, offerings: 7800, specialGiving: 3000 },
  { month: "Apr", tithes: 13200, offerings: 8200, specialGiving: 2500 },
  { month: "May", tithes: 14000, offerings: 8500, specialGiving: 4000 },
  { month: "Jun", tithes: 13500, offerings: 8000, specialGiving: 2000 },
  { month: "Jul", tithes: 13800, offerings: 8200, specialGiving: 1800 },
  { month: "Aug", tithes: 14200, offerings: 8300, specialGiving: 2200 },
  { month: "Sep", tithes: 14500, offerings: 8600, specialGiving: 5000 },
  { month: "Oct", tithes: 15000, offerings: 9000, specialGiving: 3500 },
];

const mockDCGData = [
  { name: "North DCG", members: 28, attendance: "85%", growth: "+3" },
  { name: "South DCG", members: 32, attendance: "78%", growth: "+5" },
  { name: "East DCG", members: 24, attendance: "90%", growth: "+2" },
  { name: "West DCG", members: 30, attendance: "82%", growth: "+4" },
  { name: "Central DCG", members: 35, attendance: "88%", growth: "+6" },
];

const mockMembershipData = [
  { category: "Adults", value: 320 },
  { category: "Youth", value: 180 },
  { category: "Children", value: 150 },
  { category: "Seniors", value: 90 },
];

const mockGrowthData = [
  { month: "Jan", newMembers: 12, visitors: 45 },
  { month: "Feb", newMembers: 15, visitors: 50 },
  { month: "Mar", newMembers: 10, visitors: 42 },
  { month: "Apr", newMembers: 18, visitors: 55 },
  { month: "May", newMembers: 22, visitors: 60 },
  { month: "Jun", newMembers: 16, visitors: 48 },
  { month: "Jul", newMembers: 14, visitors: 52 },
  { month: "Aug", newMembers: 19, visitors: 58 },
  { month: "Sep", newMembers: 24, visitors: 65 },
  { month: "Oct", newMembers: 20, visitors: 62 },
];

const RegionalReports: React.FC = () => {
  const [dateRange, setDateRange] = useState("year");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { data: reportData, isLoading, isError, error } = useRegionalReports();
  
  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive reports and insights for your region.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button variant={dateRange === "month" ? "default" : "outline"} onClick={() => setDateRange("month")}>
              Month
            </Button>
            <Button variant={dateRange === "quarter" ? "default" : "outline"} onClick={() => setDateRange("quarter")}>
              Quarter
            </Button>
            <Button variant={dateRange === "year" ? "default" : "outline"} onClick={() => setDateRange("year")}>
              Year
            </Button>
            <Button variant={dateRange === "custom" ? "default" : "outline"} onClick={() => setDateRange("custom")}>
              Custom
            </Button>
          </div>
          
          {dateRange === "custom" && (
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <span>to</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
              <Button size="sm">Apply</Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-[350px]" />
              <Skeleton className="h-[350px]" />
            </div>
          </div>
        )}

        {isError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle />
                Error Loading Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>There was an issue fetching the report data. Please try again later.</p>
              <p className="text-sm text-muted-foreground mt-2">{error?.message}</p>
            </CardContent>
          </Card>
        )}

        {reportData && !isLoading && !isError && (
          <Tabs defaultValue="dashboard">
            <TabsList className="grid grid-cols-1 md:grid-cols-5 w-full max-w-4xl">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="membership">Membership</TabsTrigger>
              <TabsTrigger value="dcg">DCG Reports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.kpis.totalMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ {reportData.kpis.newMembersLast30Days} in last 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.kpis.averageAttendance}</div>
                    <p className="text-xs text-muted-foreground mt-1">based on latest event</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Giving</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$27,500</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Mock Data) ↑ 3.5% from last month
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
                    <CardDescription>
                      Attendance for recent events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <LineChart
                        data={reportData.attendanceTrends}
                        index="month"
                        categories={["attendance"]}
                        colors={["#8b5cf6"]}
                        valueFormatter={(value) => `${value} people`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Breakdown</CardTitle>
                    <CardDescription>
                      Distribution by age category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <PieChart
                        data={reportData.membershipDemographics}
                        index="category"
                        categories={["value"]}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                        valueFormatter={(value) => `${value} members`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>
                    (Mock Data) Monthly income breakdown for the current year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <BarChart
                      data={mockFinancialData}
                      index="month"
                      categories={["tithes", "offerings", "specialGiving"]}
                      colors={["#8b5cf6", "#a78bfa", "#c4b5fd"]}
                      valueFormatter={(value) => `$${value.toLocaleString()}`}
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="attendance">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Sunday Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">430</div>
                    <p className="text-xs text-muted-foreground mt-1">58% of total members</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Midweek Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">215</div>
                    <p className="text-xs text-muted-foreground mt-1">29% of total members</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average DCG Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">149</div>
                    <p className="text-xs text-muted-foreground mt-1">85% of DCG members</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Attendance Trends</CardTitle>
                    <CardDescription>
                      Monthly attendance comparison
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <LineChart
                        data={reportData.attendanceTrends}
                        index="month"
                        categories={["attendance"]}
                        colors={["#8b5cf6"]}
                        valueFormatter={(value) => `${value} people`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Service Comparison</CardTitle>
                    <CardDescription>
                     (Mock Data) Attendance by service type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <DonutChart
                        data={[
                          { service: "Sunday Morning", attendance: 430 },
                          { service: "Sunday Evening", attendance: 220 },
                          { service: "Midweek", attendance: 215 },
                          { service: "Prayer Meeting", attendance: 175 },
                        ]}
                        index="service"
                        categories={["attendance"]}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]}
                        valueFormatter={(value) => `${value} people`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Attendance Records</CardTitle>
                  <CardDescription>
                    Weekly attendance breakdown for the last 8 weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Sunday AM</TableHead>
                            <TableHead>Sunday PM</TableHead>
                            <TableHead>Midweek</TableHead>
                            <TableHead>Prayer Meeting</TableHead>
                            <TableHead>Total Weekly</TableHead>
                            <TableHead>Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>Oct 22, 2023</TableCell>
                            <TableCell>435</TableCell>
                            <TableCell>225</TableCell>
                            <TableCell>218</TableCell>
                            <TableCell>180</TableCell>
                            <TableCell>1,058</TableCell>
                            <TableCell className="text-green-600">+1.2%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Oct 15, 2023</TableCell>
                            <TableCell>430</TableCell>
                            <TableCell>220</TableCell>
                            <TableCell>215</TableCell>
                            <TableCell>178</TableCell>
                            <TableCell>1,043</TableCell>
                            <TableCell className="text-green-600">+0.9%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Oct 8, 2023</TableCell>
                            <TableCell>428</TableCell>
                            <TableCell>218</TableCell>
                            <TableCell>210</TableCell>
                            <TableCell>177</TableCell>
                            <TableCell>1,033</TableCell>
                            <TableCell className="text-green-600">+0.5%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Oct 1, 2023</TableCell>
                            <TableCell>425</TableCell>
                            <TableCell>215</TableCell>
                            <TableCell>212</TableCell>
                            <TableCell>175</TableCell>
                            <TableCell>1,027</TableCell>
                            <TableCell className="text-red-600">-0.2%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="financial">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Income YTD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$275,000</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 7.2% from last year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses YTD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$232,500</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 5.4% from last year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$42,500</div>
                    <p className="text-xs text-muted-foreground mt-1">15.5% of total income</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Income Breakdown</CardTitle>
                    <CardDescription>
                      Monthly income by category for the current year
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <BarChart
                        data={mockFinancialData}
                        index="month"
                        categories={["tithes", "offerings", "specialGiving"]}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd"]}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Income Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by income category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <PieChart
                        data={[
                          { category: "Tithes", value: 132000 },
                          { category: "Offerings", value: 83000 },
                          { category: "Special Giving", value: 25000 },
                          { category: "Fundraising", value: 35000 },
                        ]}
                        index="category"
                        categories={["value"]}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"]}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by expense category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <PieChart
                        data={[
                          { category: "Staff & Salaries", value: 110000 },
                          { category: "Building & Maintenance", value: 45000 },
                          { category: "Ministries & Programs", value: 38500 },
                          { category: "Missions & Outreach", value: 25000 },
                          { category: "Administration", value: 14000 },
                        ]}
                        index="category"
                        categories={["value"]}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="membership">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">740</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 45 from last year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Members YTD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">86</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 12% from last year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">93%</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 2% from last year</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Growth</CardTitle>
                    <CardDescription>
                      New members by month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <BarChart
                        data={reportData.membershipGrowth}
                        index="month"
                        categories={["newMembers"]}
                        colors={["#8b5cf6"]}
                        valueFormatter={(value) => `${value} members`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Membership Breakdown</CardTitle>
                    <CardDescription>
                      Distribution by age category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <PieChart
                        data={reportData.membershipDemographics}
                        index="category"
                        categories={["value"]}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                        valueFormatter={(value) => `${value} members`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Member Engagement</CardTitle>
                  <CardDescription>
                    Participation in various ministries and activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <BarChart
                      data={[
                        { ministry: "Worship Team", members: 35 },
                        { ministry: "Children's Ministry", members: 42 },
                        { ministry: "Youth Ministry", members: 28 },
                        { ministry: "Outreach Team", members: 45 },
                        { ministry: "Prayer Team", members: 50 },
                        { ministry: "DCG Leaders", members: 25 },
                        { ministry: "Hospitality", members: 30 },
                        { ministry: "Media Team", members: 20 },
                      ]}
                      index="ministry"
                      categories={["members"]}
                      colors={["#8b5cf6"]}
                      valueFormatter={(value) => `${value} members`}
                      className="h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dcg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total DCGs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 2 from last year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">DCG Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">175</div>
                    <p className="text-xs text-muted-foreground mt-1">24% of total members</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">85%</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ 3% from last quarter</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>DCG Performance Overview</CardTitle>
                  <CardDescription>
                    Key metrics for all Destiny Care Groups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>DCG Name</TableHead>
                            <TableHead>Leader</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Avg. Attendance</TableHead>
                            <TableHead>Quarterly Growth</TableHead>
                            <TableHead>Giving</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockDCGData.map((dcg, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{dcg.name}</TableCell>
                              <TableCell>John Smith</TableCell>
                              <TableCell>{dcg.members}</TableCell>
                              <TableCell>{dcg.attendance}</TableCell>
                              <TableCell className="text-green-600">{dcg.growth}</TableCell>
                              <TableCell>${(1200 + (index * 200)).toLocaleString()}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">View Details</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>DCG Attendance Trends</CardTitle>
                    <CardDescription>
                      Monthly attendance rates across all DCGs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <LineChart
                        data={[
                          { month: "Jan", attendance: 82 },
                          { month: "Feb", attendance: 83 },
                          { month: "Mar", attendance: 80 },
                          { month: "Apr", attendance: 82 },
                          { month: "May", attendance: 85 },
                          { month: "Jun", attendance: 87 },
                          { month: "Jul", attendance: 86 },
                          { month: "Aug", attendance: 84 },
                          { month: "Sep", attendance: 85 },
                          { month: "Oct", attendance: 87 },
                        ]}
                        index="month"
                        categories={["attendance"]}
                        colors={["#8b5cf6"]}
                        valueFormatter={(value) => `${value}%`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>DCG Growth Distribution</CardTitle>
                    <CardDescription>
                      Member growth by DCG
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <BarChart
                        data={mockDCGData.map(dcg => ({
                          name: dcg.name,
                          growth: parseInt(dcg.growth.replace("+", ""))
                        }))}
                        index="name"
                        categories={["growth"]}
                        colors={["#8b5cf6"]}
                        valueFormatter={(value) => `+${value} members`}
                        className="h-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </RegionalAdminLayout>
  );
};

export default RegionalReports;
