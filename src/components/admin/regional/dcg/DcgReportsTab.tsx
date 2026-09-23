import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2, DollarSign, Users, TrendingUp, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useRegionalDcgReports } from '@/hooks/useRegionalDcgReports';
import { useDcgs } from '@/hooks/useDCGs';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

const DcgReportsTab = () => {
  const [selectedDcgId, setSelectedDcgId] = useState<string>('all');
  const { userRegion } = useAuth();
  const { data: currency } = useRegionCurrency(userRegion?.id);
  const { data: dcgs } = useDcgs();
  const { toast } = useToast();

  const { data: report, isLoading } = useRegionalDcgReports({
    dcgId: selectedDcgId !== 'all' ? selectedDcgId : undefined,
  });

  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  const handleExport = () => {
    if (!report) return;
    const rows = report.dcgBreakdown.map(d => ({
      'DCG Name': d.dcgName,
      'Leader': d.leaderName,
      'Members': d.memberCount,
      'Attendance Rate': `${d.attendanceRate.toFixed(1)}%`,
      'Income': d.totalIncome,
      'Expenses': d.totalExpenses,
      'Net Balance': d.netBalance,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dcg-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Report exported successfully' });
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>DCG Reports</CardTitle>
              <CardDescription>Comprehensive DCG performance reports</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={selectedDcgId} onValueChange={setSelectedDcgId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All DCGs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DCGs</SelectItem>
                  {dcgs?.map(dcg => (
                    <SelectItem key={dcg.id} value={dcg.id}>{dcg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {report && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">DCGs</p>
                    <p className="text-2xl font-bold">{report.totalDcgs}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Members</p>
                    <p className="text-2xl font-bold">{report.totalMembers}</p>
                    <p className="text-xs text-green-600">+{report.memberGrowthRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                    <p className="text-2xl font-bold">{report.avgAttendanceRate.toFixed(1)}%</p>
                  </div>
                  <BarChart2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Income</p>
                    <p className="text-2xl font-bold text-green-600">{fmt(report.totalIncome)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                    <p className={`text-2xl font-bold ${report.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(report.netBalance)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number, n: string) => n === 'Attendance Rate' ? [`${v.toFixed(1)}%`, n] : [v, n]} />
                    <Legend />
                    <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="var(--primary)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Financial Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="hsl(142, 71%, 45%)" />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(0, 84%, 60%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* DCG Breakdown Table */}
          {selectedDcgId === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DCG Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DCG</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead className="text-right">Members</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.dcgBreakdown.map(d => (
                      <TableRow key={d.dcgId}>
                        <TableCell className="font-medium">{d.dcgName}</TableCell>
                        <TableCell>{d.leaderName}</TableCell>
                        <TableCell className="text-right">{d.memberCount}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={d.attendanceRate >= 70 ? 'default' : 'secondary'}>
                            {d.attendanceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-green-600">{fmt(d.totalIncome)}</TableCell>
                        <TableCell className="text-right text-red-600">{fmt(d.totalExpenses)}</TableCell>
                        <TableCell className={`text-right font-medium ${d.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(d.netBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DcgReportsTab;
