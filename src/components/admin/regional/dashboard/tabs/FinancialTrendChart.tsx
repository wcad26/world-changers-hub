import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface FinancialTrendChartProps {
  selectedPeriod: string;
}

const FinancialTrendChart: React.FC<FinancialTrendChartProps> = ({ selectedPeriod }) => {
  // Mock financial data for demonstration
  const mockFinancialData = [
    { month: 'Jan 2024', income: 45000, expenses: 32000, net: 13000 },
    { month: 'Feb 2024', income: 52000, expenses: 35000, net: 17000 },
    { month: 'Mar 2024', income: 48000, expenses: 31000, net: 17000 },
    { month: 'Apr 2024', income: 55000, expenses: 38000, net: 17000 },
    { month: 'May 2024', income: 61000, expenses: 42000, net: 19000 },
    { month: 'Jun 2024', income: 58000, expenses: 39000, net: 19000 },
    { month: 'Jul 2024', income: 63000, expenses: 41000, net: 22000 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Financial Trends
        </CardTitle>
        <CardDescription>
          Income vs Expenses over time ({selectedPeriod})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockFinancialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(Number(value)), name]}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e" 
                strokeWidth={3}
                name="Income"
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expenses"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Net Balance"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialTrendChart;