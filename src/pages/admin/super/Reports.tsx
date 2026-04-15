import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuperAdminReports } from "@/hooks/useSuperAdminReports";
import { useGlobalDcgReports } from "@/hooks/useRegionalDcgReports";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download, ChevronDown, ChevronRight, Users, BarChart2, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";

const SuperReports: React.FC = () => {
  const { data: reports, isLoading, isError, error } = useSuperAdminReports();
  const { data: globalDcgReports, isLoading: dcgLoading } = useGlobalDcgReports();
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  const toggleRegionExpand = (regionId: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(regionId)) next.delete(regionId);
      else next.add(regionId);
      return next;
    });
  };

  const handleExport = () => {
    if (!reports?.regionalData) { toast({ title: "No data to export" }); return; }
    const csv = Papa.unparse(reports.regionalData.map(r => ({
      Region: r.name, Members: formatNumber(r.members), Visitors: formatNumber(r.visitors),
      Active: `${r.activePercentage.toFixed(1)}%`, Growth: `+${r.periodGrowth.toFixed(1)}%`,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `regional-member-overview-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleDcgExport = () => {
    if (!globalDcgReports) { toast({ title: "No data to export" }); return; }
    const rows: any[] = [];
    globalDcgReports.regionSummaries.forEach(r => {
      r.dcgDetails.forEach(d => {
        rows.push({
          Region: r.regionName, DCG: d.dcgName, Members: d.memberCount,
          'Attendance Rate': `${d.attendanceRate.toFixed(1)}%`,
          Income: d.totalIncome, Expenses: d.totalExpenses, Net: d.netBalance,
        });
      });
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dcg-global-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <>
      <div className="space-y-6">
        <p className="text-muted-foreground">
          Access comprehensive reports and analytics for the entire organization.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading reports</AlertTitle>
            <AlertDescription>{error instanceof Error ? error.message : "An unknown error occurred."}</AlertDescription>
          </Alert>
        ) : reports ? (
          <>
            {/* Regional Member Overview */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Regional Member Overview</CardTitle>
                    <CardDescription>Member performance overview across all regions.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                        <TableCell className="text-green-600">{(region.activePercentage ?? 0).toFixed(1)}%</TableCell>
                        <TableCell className="text-green-600">+{(region.periodGrowth ?? 0).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Global DCG Summary KPIs */}
            {globalDcgReports && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total DCGs</p>
                        <p className="text-2xl font-bold">{globalDcgReports.globalSummary.totalDcgs}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">DCG Members</p>
                        <p className="text-2xl font-bold">{globalDcgReports.globalSummary.totalMembers}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                        <p className="text-2xl font-bold">{globalDcgReports.globalSummary.attendanceRate.toFixed(1)}%</p>
                      </div>
                      <BarChart2 className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                        <p className={`text-2xl font-bold ${globalDcgReports.globalSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(globalDcgReports.globalSummary.netBalance)}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* DCG Performance with Drill-down */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Regional DCG Performance</CardTitle>
                    <CardDescription>Click a region to see individual DCG breakdown.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDcgExport}>
                    <Download className="mr-2 h-4 w-4" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dcgLoading ? <Skeleton className="h-64" /> : globalDcgReports ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
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
                            <TableCell>
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
                ) : null}
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-center py-8">No data available for reports.</p>
        )}
      </div>
    </>
  );
};

export default SuperReports;
