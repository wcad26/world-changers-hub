import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrencyWithSymbol, getCurrencySymbol } from '@/utils/currencyUtils';
import { useFinancialTransactions } from '@/hooks/useFinancials';
import type { Currency } from '@/hooks/useCurrencies';
import { format } from 'date-fns';

interface FinancialTrendChartProps {
  selectedPeriod: string;
  regionCurrency?: Currency | null;
}

const FinancialTrendChart: React.FC<FinancialTrendChartProps> = ({ selectedPeriod, regionCurrency }) => {
  const currencySymbol = getCurrencySymbol(regionCurrency);
  const { data: transactions } = useFinancialTransactions();

  const monthlyData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const months: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const monthKey = format(new Date(t.transaction_date), 'MMM yyyy');
      if (!months[monthKey]) months[monthKey] = { income: 0, expenses: 0 };
      const catType = (t as any).category?.type || '';
      if (catType?.toLowerCase() === 'income') {
        months[monthKey].income += Number(t.amount);
      } else if (catType?.toLowerCase() === 'expense') {
        months[monthKey].expenses += Number(t.amount);
      }
    });

    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .reverse()
      .slice(-7);
  }, [transactions]);

  const formatCurrency = (value: number) => formatCurrencyWithSymbol(value, regionCurrency);

  if (monthlyData.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Financial Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground py-12">No financial data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Financial Trends
        </CardTitle>
        <CardDescription>Income vs Expenses over time ({selectedPeriod})</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="var(--chart-5)" strokeWidth={3} name="Income" dot={{ fill: 'var(--chart-5)', strokeWidth: 2, r: 4 }} />
              <Line type="monotone" dataKey="expenses" stroke="var(--chart-4)" strokeWidth={3} name="Expenses" dot={{ fill: 'var(--chart-4)', strokeWidth: 2, r: 4 }} />
              <Line type="monotone" dataKey="net" stroke="var(--chart-6)" strokeWidth={3} name="Net Balance" dot={{ fill: 'var(--chart-6)', strokeWidth: 2, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialTrendChart;
