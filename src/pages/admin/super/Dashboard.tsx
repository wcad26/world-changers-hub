import React, { useState, useMemo } from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ChevronUp, ChevronDown, ChevronRight, Calendar as CalendarIcon, DollarSign, Globe, AlertCircle, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSuperAdminReports } from "@/hooks/useSuperAdminReports";
import { useGlobalDcgReports } from "@/hooks/useRegionalDcgReports";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths, subYears, startOfYear } from "date-fns";

const SuperDashboard: React.FC = () => {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ytd');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const { toast } = useToast();

  const getTimeFrameDates = (period: string): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    
    switch (period) {
      case '1m':
        startDate = subMonths(now, 1);
        break;
      case '3m':
        startDate = subMonths(now, 3);
        break;
      case '6m':
        startDate = subMonths(now, 6);
        break;
      case 'ytd':
        startDate = startOfYear(now);
        break;
      case '1y':
        startDate = subYears(now, 1);
        break;
      case 'custom':
        startDate = customDateRange.from ?? startOfYear(now);
        endDate = customDateRange.to ?? now;
        break;
      default:
        startDate = startOfYear(now);
    }
    
    return { startDate, endDate };
  };

  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case '1m': return '1M';
      case '3m': return '3M';
      case '6m': return '6M';
      case 'ytd': return 'YTD';
      case '1y': return '1Y';
      case 'custom': return 'Period';
      default: return 'YTD';
    }
  };

  const timeFrame = useMemo(() => getTimeFrameDates(selectedPeriod), [selectedPeriod, customDateRange]);
  const { data: reports, isLoading, isError, error } = useSuperAdminReports(timeFrame);
  const { data: globalDcgReports } = useGlobalDcgReports({ startDate: timeFrame.startDate, endDate: timeFrame.endDate });

  const toggleRegionExpand = (regionId: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(regionId)) next.delete(regionId);
      else next.add(regionId);
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };
  
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const handleExport = () => {
    if (!reports || !reports.regionalData) {
      toast({ title: "No data to export" });
      return;
    }
    const dataToExport = reports.regionalData.map(region => ({
        'Region': region.name,
        'Members': formatNumber(region.members),
        'Visitors': formatNumber(region.visitors),
        'Active': `${region.activePercentage.toFixed(1)}%`,
        'Growth': `+${region.periodGrowth.toFixed(1)}%`,
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `regional-member-overview-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDcgExport = () => {
    if (!reports || !reports.regionalDcgData) {
      toast({ title: "No data to export" });
      return;
    }
    const dataToExport = reports.regionalDcgData.map(region => ({
        'Region': region.name,
        'DCGs': formatNumber(region.dcgCount),
        'Members': formatNumber(region.dcgMembers),
        'Active': `${region.activePercentage.toFixed(1)}%`,
        'Growth': `+${region.periodGrowth.toFixed(1)}%`,
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dcg-regional-overview-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEventsExport = () => {
    if (!reports || !reports.regionalEventsData) {
      toast({ title: "No data to export" });
      return;
    }
    const dataToExport = reports.regionalEventsData.map(region => ({
      'Region': region.name,
      'Events': formatNumber(region.eventCount),
      'Avg. Target': formatNumber(region.avgTarget),
      'Avg. Attendance': formatNumber(region.avgAttendance),
      'Performance': `${region.performance.toFixed(1)}%`,
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `regional-events-overview-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-muted-foreground">
            Welcome to the WCA super admin dashboard. Here's an overview of global operations.
          </p>
          
          {/* Time Frame Selector */}
          <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={selectedPeriod} onValueChange={(value) => value && setSelectedPeriod(value)}>
              <ToggleGroupItem value="1m" size="sm">1M</ToggleGroupItem>
              <ToggleGroupItem value="3m" size="sm">3M</ToggleGroupItem>
              <ToggleGroupItem value="6m" size="sm">6M</ToggleGroupItem>
              <ToggleGroupItem value="ytd" size="sm">YTD</ToggleGroupItem>
              <ToggleGroupItem value="1y" size="sm">1Y</ToggleGroupItem>
              <ToggleGroupItem value="custom" size="sm">Custom</ToggleGroupItem>
            </ToggleGroup>
            
            {/* Custom Date Range Popover */}
            {selectedPeriod === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d, yyyy")}`
                      ) : format(customDateRange.from, "MMM d, yyyy")
                    ) : "Select dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: customDateRange.from, to: customDateRange.to }}
                    onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

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
                <div className="text-2xl font-bold">{formatNumber(reports.kpis.totalMembers)}</div>
                <p className="text-xs text-green-500 flex items-center">
                  <ChevronUp className="mr-1 h-3 w-3" />
                  +{reports.kpis.memberGrowthPercentage.toFixed(1)}% {getPeriodLabel()} growth
                </p>
                <p className="text-xs text-violet-500">
                  {reports.kpis.globalActivePercentage.toFixed(1)}% active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(reports.kpis.totalVisitors)}</div>
                <p className="text-xs text-muted-foreground">
                  Visitors not yet members
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Regional Branches</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.kpis.totalRegions}</div>
                <p className="text-xs text-muted-foreground">Across the globe</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total DCGs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(reports.kpis.totalDcgs)}</div>
                <p className="text-xs text-muted-foreground">Discipleship Cell Groups worldwide</p>
              </CardContent>
            </Card>
          </div>
        ) : <p>No data available.</p>}

        <Tabs defaultValue="regions">
          <TabsList>
            <TabsTrigger value="regions">Regional Member Overview</TabsTrigger>
            <TabsTrigger value="dcg-overview">Regional DCG Overview</TabsTrigger>
            <TabsTrigger value="global-finances">Global Finances</TabsTrigger>
            <TabsTrigger value="regional-events">Regional Events Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="regions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Regional Member Overview</CardTitle>
                    <CardDescription>
                      Member performance overview of WCA regions.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading || !reports}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64" /> : isError ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Could not load regional data.</AlertDescription></Alert> : reports ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Visitors</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.regionalData.map(region => (
                        <TableRow key={region.id}>
                          <TableCell>{region.name}</TableCell>
                          <TableCell>{formatNumber(region.members)}</TableCell>
                          <TableCell>{formatNumber(region.visitors)}</TableCell>
                          <TableCell className="text-green-500">{(region.activePercentage ?? 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-green-500">+{(region.periodGrowth ?? 0).toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : null}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing all {reports?.kpis.totalRegions || 0} regions.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="dcg-overview" className="space-y-4">
            {/* Global DCG KPIs */}
            {globalDcgReports && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Total DCGs</p>
                    <p className="text-2xl font-bold">{globalDcgReports.globalSummary.totalDcgs}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Total DCG Members</p>
                    <p className="text-2xl font-bold">{globalDcgReports.globalSummary.totalMembers}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Attendance Rate</p>
                    <p className="text-2xl font-bold">{globalDcgReports.globalSummary.attendanceRate.toFixed(1)}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-muted-foreground">Net Balance (All)</p>
                    <p className={`text-2xl font-bold ${globalDcgReports.globalSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(globalDcgReports.globalSummary.netBalance)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Regional DCG Overview</CardTitle>
                    <CardDescription>Click a region to see individual DCGs.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDcgExport} disabled={isLoading || !reports}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {globalDcgReports ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead></TableHead>
                        <TableHead>Region / DCG</TableHead>
                        <TableHead className="text-right">DCGs</TableHead>
                        <TableHead className="text-right">Members</TableHead>
                        <TableHead className="text-right">Attendance</TableHead>
                        <TableHead className="text-right">Income</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {globalDcgReports.regionSummaries.map(region => (
                        <React.Fragment key={region.regionId}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRegionExpand(region.regionId)}
                          >
                            <TableCell className="w-8">
                              {expandedRegions.has(region.regionId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{region.regionName}</TableCell>
                            <TableCell className="text-right">{region.dcgCount}</TableCell>
                            <TableCell className="text-right">{region.totalMembers}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={region.attendanceRate >= 70 ? 'default' : region.attendanceRate >= 40 ? 'secondary' : 'destructive'}>
                                {region.attendanceRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-green-600">{formatCurrency(region.totalIncome)}</TableCell>
                            <TableCell className="text-right text-red-600">{formatCurrency(region.totalExpenses)}</TableCell>
                            <TableCell className={`text-right font-medium ${region.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(region.netBalance)}
                            </TableCell>
                          </TableRow>
                          {expandedRegions.has(region.regionId) && region.dcgDetails.map(dcg => (
                            <TableRow key={dcg.dcgId} className="bg-muted/30">
                              <TableCell></TableCell>
                              <TableCell className="pl-8 text-sm">{dcg.dcgName}</TableCell>
                              <TableCell></TableCell>
                              <TableCell className="text-right text-sm">{dcg.memberCount}</TableCell>
                              <TableCell className="text-right text-sm">
                                <Badge variant={dcg.attendanceRate >= 70 ? 'default' : 'secondary'} className="text-xs">
                                  {dcg.attendanceRate.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm text-green-600">{formatCurrency(dcg.totalIncome)}</TableCell>
                              <TableCell className="text-right text-sm text-red-600">{formatCurrency(dcg.totalExpenses)}</TableCell>
                              <TableCell className={`text-right text-sm font-medium ${dcg.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(dcg.netBalance)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                ) : isLoading ? <Skeleton className="h-64" /> : null}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing DCG data for all {reports?.kpis.totalRegions || 0} regions.
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
                <p className="py-8 text-center text-muted-foreground">Detailed financial charts coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="regional-events" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Regional Events Overview</CardTitle>
                    <CardDescription>
                      Event performance overview across WCA regions (past events within selected period).
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleEventsExport} disabled={isLoading || !reports}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-64" />
                ) : isError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Could not load events data.</AlertDescription>
                  </Alert>
                ) : reports && reports.regionalEventsData ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Events</TableHead>
                        <TableHead className="text-right">Avg. Target</TableHead>
                        <TableHead className="text-right">Avg. Attendance</TableHead>
                        <TableHead className="text-right">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.regionalEventsData.map(region => (
                        <TableRow key={region.id}>
                          <TableCell className="font-medium">{region.name}</TableCell>
                          <TableCell className="text-right">{formatNumber(region.eventCount)}</TableCell>
                          <TableCell className="text-right">{formatNumber(region.avgTarget)}</TableCell>
                          <TableCell className="text-right">{formatNumber(region.avgAttendance)}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            region.performance >= 80 ? 'text-green-600' : 
                            region.performance >= 50 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {region.performance.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : null}
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Showing events data for all {reports?.kpis.totalRegions || 0} regions. Excludes DCG events and special events.
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
