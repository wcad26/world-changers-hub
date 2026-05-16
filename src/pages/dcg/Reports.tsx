import React, { useMemo } from 'react';
import DcgAdminLayout from '@/components/admin/DcgAdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart2, DollarSign, TrendingUp, Download, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { format } from 'date-fns';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const DcgReports = () => {
  const { user, userRegion } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { data: currency } = useRegionCurrency(userRegion?.id);

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
        month: format(new Date(month + '-01'), 'MMM'),
        rate: data.total > 0 ? (data.present / data.total) * 100 : 0,
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
      <div className="space-y-4 md:space-y-6 p-4 md:p-0 px-[10px]">
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold">{dcgName} Reports</h1>
          <p className="text-muted-foreground">Performance reports for your DCG</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-56" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Members</p>
                      <p className="text-lg md:text-2xl font-bold">{activeMembers.length}</p>
                    </div>
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Events</p>
                      <p className="text-lg md:text-2xl font-bold">{attendanceHistory?.length || 0}</p>
                    </div>
                    <BarChart2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Income</p>
                      <p className="text-lg md:text-2xl font-bold text-green-600 truncate">{fmt(summary?.total_income || 0)}</p>
                    </div>
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-600 shrink-0" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Expenses</p>
                      <p className="text-lg md:text-2xl font-bold text-red-600 truncate">{fmt(summary?.total_expenses || 0)}</p>
                    </div>
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-red-600 shrink-0" />
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground">Net Balance</p>
                      <p className={`text-lg md:text-2xl font-bold truncate ${(summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(summary?.net_balance || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance Trend */}
            <Card>
              <CardHeader className="p-4 md:p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-base md:text-lg">Attendance Trend</CardTitle>
                <Button variant="outline" size="sm" onClick={handleExportAttendance} className="text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {isMobile ? "CSV" : "Export"}
                </Button>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {trendData.length > 0 ? (
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Rate']} />
                        <Line type="monotone" dataKey="rate" name="Attendance Rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No attendance data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Attendance - card view on mobile */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Recent Attendance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {attendanceHistory && attendanceHistory.length > 0 ? (
                  isMobile ? (
                    <div className="space-y-2">
                      {attendanceHistory.slice(0, 10).map(r => {
                        const total = r.total_present + r.total_absent;
                        const rate = total > 0 ? (r.total_present / total) * 100 : 0;
                        return (
                          <div key={r.event_id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{r.event_name}</p>
                              <p className="text-xs text-muted-foreground">{new Date(r.event_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-xs">{r.total_present}P / {r.total_absent}A</p>
                              <Badge variant={rate >= 70 ? 'default' : 'secondary'} className="text-[10px]">{rate.toFixed(0)}%</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left text-sm font-medium">Event</th>
                            <th className="p-3 text-left text-sm font-medium">Date</th>
                            <th className="p-3 text-right text-sm font-medium">Present</th>
                            <th className="p-3 text-right text-sm font-medium">Absent</th>
                            <th className="p-3 text-right text-sm font-medium">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.slice(0, 10).map(r => {
                            const total = r.total_present + r.total_absent;
                            const rate = total > 0 ? (r.total_present / total) * 100 : 0;
                            return (
                              <tr key={r.event_id} className="border-b">
                                <td className="p-3 text-sm font-medium">{r.event_name}</td>
                                <td className="p-3 text-sm">{new Date(r.event_date).toLocaleDateString()}</td>
                                <td className="p-3 text-sm text-right">{r.total_present}</td>
                                <td className="p-3 text-sm text-right">{r.total_absent}</td>
                                <td className="p-3 text-right">
                                  <Badge variant={rate >= 70 ? 'default' : 'secondary'}>{rate.toFixed(0)}%</Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No attendance events recorded yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions - card view on mobile */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {transactions && transactions.length > 0 ? (
                  isMobile ? (
                    <div className="space-y-2">
                      {transactions.map(t => (
                        <div key={t.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{t.category?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className={`text-sm font-medium ${t.category?.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.category?.type?.toLowerCase() === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                            </p>
                            <Badge variant={t.category?.type?.toLowerCase() === 'income' ? 'default' : 'destructive'} className="text-[10px]">
                              {t.category?.type || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left text-sm font-medium">Category</th>
                            <th className="p-3 text-left text-sm font-medium">Date</th>
                            <th className="p-3 text-left text-sm font-medium">Type</th>
                            <th className="p-3 text-right text-sm font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(t => (
                            <tr key={t.id} className="border-b">
                              <td className="p-3 text-sm font-medium">{t.category?.name || 'N/A'}</td>
                              <td className="p-3 text-sm">{new Date(t.transaction_date).toLocaleDateString()}</td>
                              <td className="p-3">
                                <Badge variant={t.category?.type?.toLowerCase() === 'income' ? 'default' : 'destructive'}>
                                  {t.category?.type || 'N/A'}
                                </Badge>
                              </td>
                              <td className={`p-3 text-sm text-right font-medium ${t.category?.type?.toLowerCase() === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.category?.type?.toLowerCase() === 'income' ? '+' : '-'}{fmt(Number(t.amount))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No transactions recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DcgAdminLayout>
  );
};

export default DcgReports;
