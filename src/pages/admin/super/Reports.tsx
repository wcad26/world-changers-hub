
import React from "react";
import SuperAdminLayout from "@/components/admin/SuperAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSuperAdminReports } from "@/hooks/useSuperAdminReports";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";


const SuperReports: React.FC = () => {
  const { data: reports, isLoading, isError, error } = useSuperAdminReports();
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
    link.download = `dcg-regional-performance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Global Reports & Analytics</h2>
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
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Regional Member Overview</CardTitle>
                    <CardDescription>
                      Member performance overview across all regions.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading || !reports}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Regional DCG Performance</CardTitle>
                    <CardDescription>
                      DCG performance metrics across all regions.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleDcgExport} disabled={isLoading || !reports}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reports.regionalDcgData ? (
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
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Further Reports</CardTitle>
                <CardDescription>
                  More detailed global reports will be available here soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Global financial trends, membership demographics, and other analytics are coming soon.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
           <p className="text-center py-8">No data available for reports.</p>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperReports;
