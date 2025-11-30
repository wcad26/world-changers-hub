import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ChevronUp, Calendar, DollarSign, Globe, AlertCircle, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSuperAdminReports } from "@/hooks/useSuperAdminReports";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";

const SuperDashboard: React.FC = () => {
  const { data: reports, isLoading, isError, error } = useSuperAdminReports();
  const { toast } = useToast();

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
        'YTD Growth': `+${region.ytdGrowth.toFixed(1)}%`,
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
        'YTD Growth': `+${region.ytdGrowth.toFixed(1)}%`,
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

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the WCA super admin dashboard. Here's an overview of global operations.
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
                <div className="text-2xl font-bold">{formatNumber(reports.kpis.totalMembers)}</div>
                <p className="text-xs text-green-500 flex items-center">
                  <ChevronUp className="mr-1 h-3 w-3" />
                  +{reports.kpis.memberGrowthPercentage.toFixed(1)}% YTD growth
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
            <TabsTrigger value="major-events">Major Events</TabsTrigger>
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
                        <TableHead>YTD Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.regionalData.map(region => (
                        <TableRow key={region.id}>
                          <TableCell>{region.name}</TableCell>
                          <TableCell>{formatNumber(region.members)}</TableCell>
                          <TableCell>{formatNumber(region.visitors)}</TableCell>
                          <TableCell className="text-green-500">{(region.activePercentage ?? 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-green-500">+{(region.ytdGrowth ?? 0).toFixed(1)}%</TableCell>
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Regional DCG Overview</CardTitle>
                    <CardDescription>
                      DCG performance overview across WCA regions.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDcgExport} disabled={isLoading || !reports}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-64" /> : isError ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Could not load DCG regional data.</AlertDescription></Alert> : reports && reports.regionalDcgData ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>DCG</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>YTD Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.regionalDcgData.map(region => (
                        <TableRow key={region.id}>
                          <TableCell>{region.name}</TableCell>
                          <TableCell>{formatNumber(region.dcgCount)}</TableCell>
                          <TableCell>{formatNumber(region.dcgMembers)}</TableCell>
                          <TableCell className="text-green-500">{(region.activePercentage ?? 0).toFixed(1)}%</TableCell>
                          <TableCell className="text-green-500">+{(region.ytdGrowth ?? 0).toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : null}
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
          <TabsContent value="major-events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Major Upcoming Events</CardTitle>
                <CardDescription>
                  Global events scheduled for the next quarter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <p className="py-8 text-center text-muted-foreground">Live event data is coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperDashboard;
