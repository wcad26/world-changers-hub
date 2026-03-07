import React, { useState, useMemo } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart2, DollarSign, TrendingUp, Download, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDcgAttendanceHistory } from '@/hooks/useDcgAttendance';
import { useDcgFinancialTransactions, useDcgFinancialSummary } from '@/hooks/useDcgFinancials';
import { useDcgMembers } from '@/hooks/useDcgMembers';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

const DcgReports = () => {
  const { user, userRegion } = useAuth();
  const { toast } = useToast();
  const { data: currency } = useRegionCurrency(userRegion?.id);

  // Get user's DCG
  const { data: dcgSession } = useQuery({
    queryKey: ['dcg-session', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('dcg_user_sessions')
        .select('dcg_id, dcgs(id, name, region_id)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const dcgId = dcgSession?.dcg_id;
  const dcgName = (dcgSession?.dcgs as any)?.name || 'Your DCG';

  const { data: attendanceHistory, isLoading: attLoading } = useDcgAttendanceHistory(dcgId || undefined);
  const { data: summary, isLoading: sumLoading } = useDcgFinancialSummary(dcgId || undefined);
  const { data: transactions, isLoading: txLoading } = useDcgFinancialTransactions(dcgId || undefined, { limit: 20 });
  const { data: members, isLoading: memLoading } = useDcgMembers(dcgId || '');

  const fmt = (amount: number) => formatWithCurrency(amount, currency);
  const isLoading = attLoading || sumLoading || txLoading || memLoading;

  // Build trend from attendance history
  const trendData = useMemo(() => {
    if (!attendanceHistory) return [];
    const monthMap = new Map<string, { present: number; total: number }>();

    attendanceHistory.forEach(e => {
      const monthKey = e.event_date.substring(0, 7);
      const existing = monthMap.get(monthKey) || { present: 0, total: 0 };
      existing.present += e.total_present;
      existing.total += e.total_present + e.total_absent;
      monthMap.set(monthKey, existing);
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        attendanceRate: data.total > 0 ? (data.present / data.total) * 100 : 0,
        present: data.present,
      }));
  }, [attendanceHistory]);

  const activeMembers = members?.filter(m => m.is_active) || [];

  const handleExportAttendance = () => {
    if (!attendanceHistory) return;
    const csv = Papa.unparse(attendanceHistory.map(r => ({
      Event: r.event_name, Date: r.event_date,
      Present: r.total_present, Absent: r.total_absent,
      Rate: `${((r.total_present / (r.total_present + r.total_absent)) * 100).toFixed(1)}%`,
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dcgName}-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Attendance report exported' });
  };

  return (
    <DcgAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{dcgName} Reports</h1>
          <p className="text-muted-foreground">Performance reports for your DCG</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <Skeleton className="h-72" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Members</p>
                      <p className="text-2xl font-bold">{activeMembers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Events</p>
                      <p className="text-2xl font-bold">{attendanceHistory?.length || 0}</p>
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
                      <p className="text-2xl font-bold text-green-600">{fmt(summary?.total_income || 0)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                      <p className="text-2xl font-bold text-red-600">{fmt(summary?.total_expenses || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                      <p className={`text-2xl font-bold ${(summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(summary?.net_balance || 0)}
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
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Attendance Trend</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportAttendance}>
                    <Download className="mr-2 h-4 w-4" />Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number, n: string) => n === 'Attendance Rate' ? [`${v.toFixed(1)}%`, n] : [v, n]} />
                        <Legend />
                        <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance data yet. Record attendance to see trends.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Attendance Events</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Present</TableHead>
                      <TableHead className="text-right">Absent</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceHistory && attendanceHistory.length > 0 ? (
                      attendanceHistory.slice(0, 10).map(r => {
                        const total = r.total_present + r.total_absent;
                        const rate = total > 0 ? (r.total_present / total) * 100 : 0;
                        return (
                          <TableRow key={r.event_id}>
                            <TableCell className="font-medium">{r.event_name}</TableCell>
                            <TableCell>{new Date(r.event_date).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">{r.total_present}</TableCell>
                            <TableCell className="text-right">{r.total_absent}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={rate >= 70 ? 'default' : 'secondary'}>{rate.toFixed(0)}%</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No attendance events recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions && transactions.length > 0 ? (
                      transactions.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.category?.name || 'N/A'}</TableCell>
                          <TableCell>{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={t.category?.type?.toLowerCase() === 'income' ? 'default' : 'destructive'}>
                              {t.category?.type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            t.category?.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {t.category?.type?.toLowerCase() === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No transactions recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DcgAdminLayout>
  );
};

export default DcgReports;
