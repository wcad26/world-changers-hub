import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FinancialTrendChart from './FinancialTrendChart';
import { useAuth } from '@/hooks/useAuth';
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { useFinancialSummary, useFinancialTransactions } from '@/hooks/useFinancials';
import { formatCurrencyWithSymbol } from '@/utils/currencyUtils';
import { DollarSign, TrendingUp, TrendingDown, Receipt, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface FinanceTabProps {
  selectedPeriod: string;
}

const FinanceTab: React.FC<FinanceTabProps> = ({ selectedPeriod }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: transactions, isLoading: txLoading } = useFinancialTransactions();

  // Previous month summary for growth calc
  const prevMonthFilters = useMemo(() => {
    const prevStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
    const prevEnd = format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
    return { from: prevStart, to: prevEnd };
  }, []);
  const { data: prevSummary } = useFinancialSummary(prevMonthFilters);

  const fc = (amount: number) => formatCurrencyWithSymbol(amount, regionCurrency);

  const monthlyGrowth = useMemo(() => {
    if (!summary || !prevSummary || prevSummary.total_income === 0) return 0;
    return Math.round(((summary.total_income - prevSummary.total_income) / prevSummary.total_income) * 100);
  }, [summary, prevSummary]);

  const transactionCount = transactions?.length || 0;
  const avgTransaction = transactionCount > 0
    ? (transactions?.reduce((s, t) => s + Number(t.amount), 0) || 0) / transactionCount
    : 0;

  // Top categories
  const topCategories = useMemo(() => {
    if (!transactions) return { topIncome: 'N/A', topExpense: 'N/A' };
    const incomeCats: Record<string, number> = {};
    const expenseCats: Record<string, number> = {};
    transactions.forEach(t => {
      const catName = (t as any).category?.name || 'Unknown';
      const catType = (t as any).category?.type || '';
      if (catType?.toLowerCase() === 'income') {
        incomeCats[catName] = (incomeCats[catName] || 0) + Number(t.amount);
      } else if (catType?.toLowerCase() === 'expense') {
        expenseCats[catName] = (expenseCats[catName] || 0) + Number(t.amount);
      }
    });
    const topIncome = Object.entries(incomeCats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topExpense = Object.entries(expenseCats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    return { topIncome, topExpense };
  }, [transactions]);

  if (summaryLoading || txLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const kpis = [
    { label: 'Total Income', value: fc(summary?.total_income || 0), icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Total Expenses', value: fc(summary?.total_expenses || 0), icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Net Balance', value: fc(summary?.net_balance || 0), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Monthly Growth', value: `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth}%`, icon: monthlyGrowth >= 0 ? TrendingUp : TrendingDown, color: monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600', bg: monthlyGrowth >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20' },
    { label: 'Transactions', value: transactionCount, icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Avg Transaction', value: fc(avgTransaction), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, i) => (
          <Card key={i} className="bg-gradient-to-br from-background to-muted/30 backdrop-blur-sm border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-lg font-bold truncate">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Chart */}
      <FinancialTrendChart selectedPeriod={selectedPeriod} regionCurrency={regionCurrency} />

      {/* Category Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Tithes</span>
                <span className="font-semibold text-green-600">{fc(summary?.total_tithes || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Offerings</span>
                <span className="font-semibold text-green-600">{fc(summary?.total_offerings || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Special Giving</span>
                <span className="font-semibold text-green-600">{fc(summary?.total_special_giving || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm">Top Source</span>
                <span className="font-semibold text-primary">{topCategories.topIncome}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-sm">Expense Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Expenses</span>
                <span className="font-semibold text-red-600">{fc(summary?.total_expenses || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Top Category</span>
                <span className="font-semibold text-red-600">{topCategories.topExpense}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Net Balance</span>
                <span className={`font-bold ${(summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fc(summary?.net_balance || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinanceTab;
