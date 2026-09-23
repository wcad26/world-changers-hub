import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, DollarSign, BarChart2, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useRegionalDcgReports } from '@/hooks/useRegionalDcgReports';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@/lib/router-compat';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import PeriodFilter, { PeriodFilters } from '../PeriodFilter';

interface DCGTabProps {
  selectedPeriod: string;
}

const DCGTab: React.FC<DCGTabProps> = ({ selectedPeriod }) => {
  const navigate = useNavigate();
  const { userRegion } = useAuth();
  const { data: currency } = useRegionCurrency(userRegion?.id);

  const [filters, setFilters] = useState<PeriodFilters>({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1),
      to: new Date(),
    },
    quickDateRange: '6-months',
  });

  const { data: report, isLoading, error } = useRegionalDcgReports({
    startDate: filters.dateRange?.from,
    endDate: filters.dateRange?.to,
  });

  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading DCG reports</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : 'An error occurred'}</AlertDescription>
      </Alert>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      <PeriodFilter filters={filters} onFiltersChange={(partial) => setFilters(prev => ({ ...prev, ...partial }))} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total DCGs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalDcgs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalMembers}</div>
            <p className="text-xs text-green-600">+{report.memberGrowthRate.toFixed(1)}% growth</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.avgAttendanceRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fmt(report.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${report.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(report.netBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Trend</CardTitle>
          <CardDescription>Monthly DCG attendance rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number, name: string) =>
                    name === 'Attendance Rate' ? [`${value.toFixed(1)}%`, name] : [value, name]
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="totalPresent" name="Present" stroke="var(--chart-6)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Financial Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Trend</CardTitle>
          <CardDescription>Monthly income vs expenses across all DCGs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => fmt(value)}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--chart-5)" />
                <Bar dataKey="expenses" name="Expenses" fill="var(--chart-4)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* DCG Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DCG Breakdown</CardTitle>
          <CardDescription>Click a row to drill into a specific DCG</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DCG Name</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Attendance</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.dcgBreakdown.map(dcg => (
                <TableRow
                  key={dcg.dcgId}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/regional/dcg/${dcg.dcgId}`)}
                >
                  <TableCell className="font-medium">{dcg.dcgName}</TableCell>
                  <TableCell>{dcg.leaderName}</TableCell>
                  <TableCell className="text-right">{dcg.memberCount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={dcg.attendanceRate >= 70 ? 'default' : dcg.attendanceRate >= 40 ? 'secondary' : 'destructive'}>
                      {dcg.attendanceRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-green-600">{fmt(dcg.totalIncome)}</TableCell>
                  <TableCell className="text-right text-red-600">{fmt(dcg.totalExpenses)}</TableCell>
                  <TableCell className={`text-right font-medium ${dcg.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(dcg.netBalance)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {report.dcgBreakdown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No DCG data available for this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DCGTab;
