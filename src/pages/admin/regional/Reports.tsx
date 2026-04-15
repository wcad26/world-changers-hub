import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, LineChart, PieChart, DonutChart } from "@/components/ui/chart";
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, Download, Calendar, Filter, RefreshCw, AlertTriangle } from "lucide-react";
import { useRegionalReports } from "@/hooks/useReports";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatWithCurrency } from "@/utils/currencyUtils";

const RegionalReports: React.FC = () => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const [dateRange, setDateRange] = useState("year");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const { data: reportData, isLoading, isError, error, refetch } = useRegionalReports();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => formatWithCurrency(amount, regionCurrency);
  
  const dcgTotalMembers = reportData?.dcgReports.reduce((sum, dcg) => sum + dcg.members, 0) ?? 0;
  
  const handleExport = () => {
    if (!reportData) {
      toast({
        title: "No data available",
        description: "Cannot export until report data is loaded.",
        variant: "destructive",
      });
      return;
    }

    let dataToExport: unknown[] = [];
    const filename = `wca-regional-report-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;

    switch (activeTab) {
      case "dcg":
        if (reportData.dcgReports && reportData.dcgReports.length > 0) {
          dataToExport = reportData.dcgReports.map((dcg) => ({
            "DCG Name": dcg.name,
            Leader: dcg.leader,
            Members: dcg.members,
            "Avg. Attendance": dcg.attendance,
            "Quarterly Growth": dcg.growth,
            "Giving (YTD)": formatCurrency(dcg.giving),
          }));
        }
        break;
      case "membership":
        if (reportData.membershipDemographics && reportData.membershipDemographics.length > 0) {
          dataToExport = reportData.membershipDemographics;
        }
        break;
      case "attendance":
        if (reportData.attendanceTrends && reportData.attendanceTrends.length > 0) {
          dataToExport = reportData.attendanceTrends;
        }
        break;
      case "financial":
        if (reportData.financialDataYear && reportData.financialDataYear.length > 0) {
          dataToExport = reportData.financialDataYear.map((t: any) => ({
            Date: t.transaction_date,
            Description: t.description,
            Amount: t.amount,
            Category: t.category?.name,
            Type: t.category?.type,
            "DCG ID": t.dcg_id,
          }));
        }
        break;
      default:
        toast({
          title: "Export not available",
          description: `Export is not implemented for the "${activeTab}" tab.`,
        });
        return;
    }

    if (dataToExport.length > 0) {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      toast({
        title: "No data to export",
        description: `There is no data to export for the "${activeTab}" tab.`,
      });
    }
  };
  
  return (
    <>
      <div className="space-y-6">
        
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
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
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
          <Tabs defaultValue="dashboard" onValueChange={setActiveTab}>
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
                    <CardTitle className="text-sm font-medium">This Month's Giving</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.kpis.totalIncome)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total income for the current month.
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
                    Monthly income breakdown for the current year
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {reportData.financialsYTD && reportData.financialsYTD.chartData.length > 0 ? (
                      <BarChart
                        data={reportData.financialsYTD.chartData}
                        index="month"
                        categories={reportData.financialsYTD.chartCategories}
                        colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                        valueFormatter={(value) => `$${value.toLocaleString()}`}
                        className="h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No financial data for this period.
                      </div>
                    )}
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
                    <p className="text-xs text-muted-foreground mt-1">58% of total members (Mock)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Midweek Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">215</div>
                    <p className="text-xs text-muted-foreground mt-1">29% of total members (Mock)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average DCG Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">149</div>
                    <p className="text-xs text-muted-foreground mt-1">85% of DCG members (Mock)</p>
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
                    (Mock Data) Weekly attendance breakdown for the last 8 weeks
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
                    <div className="text-2xl font-bold">{formatCurrency(reportData.financialsYTD?.totalIncome ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">&nbsp;</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses YTD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.financialsYTD?.totalExpenses ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">&nbsp;</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Net YTD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(reportData.financialsYTD?.currentBalance ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.financialsYTD?.totalIncome ? `${((reportData.financialsYTD.currentBalance / reportData.financialsYTD.totalIncome) * 100).toFixed(1)}% of total income` : '\u00A0'}
                    </p>
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
                      {reportData.financialsYTD && reportData.financialsYTD.chartData.length > 0 ? (
                        <BarChart
                          data={reportData.financialsYTD.chartData}
                          index="month"
                          categories={reportData.financialsYTD.chartCategories}
                          colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"]}
                          valueFormatter={(value) => `$${value.toLocaleString()}`}
                          className="h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No income data for this period.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Income Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by income category (YTD)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {reportData.financialsYTD && reportData.financialsYTD.incomeDistribution.length > 0 ? (
                        <PieChart
                          data={reportData.financialsYTD.incomeDistribution}
                          index="category"
                          categories={["value"]}
                          colors={["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#a855f7", "#9333ea"]}
                          valueFormatter={(value) => formatCurrency(value)}
                          className="h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No income data to display.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Distribution</CardTitle>
                    <CardDescription>
                      Breakdown by expense category (YTD)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {reportData.financialsYTD && reportData.financialsYTD.expenseDistribution.length > 0 ? (
                        <PieChart
                          data={reportData.financialsYTD.expenseDistribution}
                          index="category"
                          categories={["value"]}
                          colors={["#f43f5e", "#fb7185", "#fda4af", "#fecdd3", "#ffe4e6", "#be123c", "#9f1239"]}
                          valueFormatter={(value) => formatCurrency(value)}
                          className="h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No expense data to display.
                        </div>
                      )}
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
                    <div className="text-2xl font-bold">{reportData.kpis.totalMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">↑ {reportData.kpis.newMembersLast30Days} in last 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">New Members YTD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{reportData.kpis.newMembersYTD}</div>
                    <p className="text-xs text-muted-foreground mt-1">Since start of the year</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">N/A</div>
                    <p className="text-xs text-muted-foreground mt-1">(Complex calculation pending)</p>
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
                    (Mock Data) Participation in various ministries and activities
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
                    <div className="text-2xl font-bold">{reportData.kpis.totalDcgs}</div>
                    <p className="text-xs text-muted-foreground mt-1">&nbsp;</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">DCG Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dcgTotalMembers}</div>
                    <p className="text-xs text-muted-foreground mt-1">{reportData.kpis.totalMembers > 0 ? `${((dcgTotalMembers / reportData.kpis.totalMembers) * 100).toFixed(0)}% of total members` : '...'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">N/A</div>
                    <p className="text-xs text-muted-foreground mt-1">(Calculation pending)</p>
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
                            <TableHead>Giving (YTD)</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.dcgReports && reportData.dcgReports.length > 0 ? (
                            reportData.dcgReports.map((dcg) => (
                              <TableRow key={dcg.id}>
                                <TableCell className="font-medium">{dcg.name}</TableCell>
                                <TableCell>{dcg.leader}</TableCell>
                                <TableCell>{dcg.members}</TableCell>
                                <TableCell>{dcg.attendance}</TableCell>
                                <TableCell className="text-green-600">{dcg.growth}</TableCell>
                                <TableCell>{formatCurrency(dcg.giving)}</TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm">View Details</Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center h-24">
                                No DCG data available.
                              </TableCell>
                            </TableRow>
                          )}
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
                      (Mock Data) Monthly attendance rates across all DCGs
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
                      New members by DCG in the last quarter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {reportData.dcgReports && reportData.dcgReports.some(d => parseInt(d.growth.replace("+", "")) > 0) ? (
                        <BarChart
                          data={reportData.dcgReports?.map(dcg => ({
                            name: dcg.name,
                            growth: parseInt(dcg.growth.replace("+", ""))
                          })) || []}
                          index="name"
                          categories={["growth"]}
                          colors={["#8b5cf6"]}
                          valueFormatter={(value) => `+${value} members`}
                          className="h-full"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          No DCG growth data for this period.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
};

export default RegionalReports;
