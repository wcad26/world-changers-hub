
import React from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, DollarSign, Home, ArrowUp, ArrowDown, ChevronUp, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRegionalReports } from "@/hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const RegionalDashboard: React.FC = () => {
  const { data: reports, isLoading, isError, error } = useRegionalReports();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };
  
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: null };
    }
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  const allIncomeCategories = React.useMemo(() => {
    if (!reports?.financialSummary) return [];
    const categories = new Set([
      ...Object.keys(reports.financialSummary.thisMonth.incomeByCategory),
      ...Object.keys(reports.financialSummary.lastMonth.incomeByCategory)
    ]);
    return Array.from(categories).sort();
  }, [reports]);

  return (
    <RegionalAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Regional Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your regional dashboard. Here's an overview of your region's activities.
        </p>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[126px]" />)}
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading dashboard</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
          </Alert>
        ) : reports ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.kpis.totalMembers}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500 flex items-center">
                    <ChevronUp className="mr-1 h-4 w-4" /> +{reports.kpis.newMembersLast30Days} in last 30 days
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
                <CardTitle className="text-sm font-medium">Total Income (This Month)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reports.kpis.totalIncome)}</div>
                <p className="text-xs text-muted-foreground">
                   {(() => {
                      const change = calculatePercentageChange(reports.financialSummary.thisMonth.totalIncome, reports.financialSummary.lastMonth.totalIncome);
                      if (change.isPositive === null) return <span>&nbsp;</span>;
                      return (
                        <span className={`${change.isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                          {change.isPositive ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                          {change.value.toFixed(1)}% from last month
                        </span>
                      );
                   })()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total DCGs</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.kpis.totalDcgs}</div>
                <p className="text-xs text-muted-foreground">+3 new this quarter</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p>No data available for your region.</p>
        )}

        <Tabs defaultValue="financial-overview">
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
                  Your region's income summary for the current month vs. last month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-48 w-full" /> : isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Could not load financial overview.</AlertDescription>
                  </Alert>
                ) : reports ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">This Month</TableHead>
                      <TableHead className="text-right">Last Month</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allIncomeCategories.length > 0 ? allIncomeCategories.map(category => {
                      const thisMonthAmount = reports.financialSummary.thisMonth.incomeByCategory[category] || 0;
                      const lastMonthAmount = reports.financialSummary.lastMonth.incomeByCategory[category] || 0;
                      const change = calculatePercentageChange(thisMonthAmount, lastMonthAmount);
                      
                      return (
                        <TableRow key={category}>
                          <TableCell className="font-medium">{category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(thisMonthAmount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(lastMonthAmount)}</TableCell>
                          <TableCell className={`text-right ${change.isPositive === null ? '' : change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {change.isPositive !== null ? (
                              <span className="flex items-center justify-end">
                                {change.isPositive ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                                {change.value.toFixed(1)}%
                              </span>
                            ) : <span>-</span>}
                          </TableCell>
                        </TableRow>
                      );
                    }) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No income recorded this month or last month.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                ) : null}
              </CardContent>
              <CardFooter>
                {reports && !isLoading && (
                  <p className="text-sm text-muted-foreground">
                    Total Income: {formatCurrency(reports.financialSummary.thisMonth.totalIncome)}
                    {(() => {
                      const change = calculatePercentageChange(reports.financialSummary.thisMonth.totalIncome, reports.financialSummary.lastMonth.totalIncome);
                      if (change.isPositive === null) return null;
                      return (
                        <span className={`ml-2 ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          ({change.isPositive ? '+' : ''}{change.value.toFixed(1)}% from last month)
                        </span>
                      );
                   })()}
                  </p>
                 )}
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
