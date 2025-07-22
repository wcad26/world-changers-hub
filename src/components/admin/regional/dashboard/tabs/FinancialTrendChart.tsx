
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/useFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface FinancialTrendChartProps {
  selectedPeriod: string;
}

const FinancialTrendChart: React.FC<FinancialTrendChartProps> = ({ selectedPeriod }) => {
  const { data: transactions, isLoading, error } = useFinancialTransactions();

  // Transform data for the chart - group by month
  const chartData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    // Get last 6 months of data
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const income = monthTransactions
        .filter(t => t.category?.type?.toLowerCase() === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
        
      const expenses = monthTransactions
        .filter(t => t.category?.type?.toLowerCase() === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      months.push({
        month: format(monthDate, 'MMM yyyy'),
        shortMonth: format(monthDate, 'MMM'),
        Income: income,
        Expenses: expenses,
        NetBalance: income - expenses
      });
    }
    
    return months;
  }, [transactions]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Financial Trends</CardTitle>
          <CardDescription>
            Income vs Expenses over the last 6 months
          </CardDescription>
        </div>
        <DollarSign className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="shortMonth" 
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs text-muted-foreground"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                labelFormatter={(label, payload) => 
                  payload && payload[0] ? payload[0].payload.month : label
                }
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Income" 
                stroke="hsl(142, 76%, 36%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(142, 76%, 36%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="Expenses" 
                stroke="hsl(0, 72%, 51%)" 
                strokeWidth={2}
                dot={{ fill: 'hsl(0, 72%, 51%)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="NetBalance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <div className="text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No financial data available</p>
              <p className="text-sm">Start recording transactions to see trends</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialTrendChart;
