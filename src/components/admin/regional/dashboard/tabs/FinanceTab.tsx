
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useFinancialTransactions, useFinancialSummary } from '@/hooks/useFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import FinancialTrendChart from './FinancialTrendChart';
import { format } from 'date-fns';
import PeriodFilter, { PeriodFilters } from '../PeriodFilter';

const FinanceTab: React.FC = () => {
  const [filters, setFilters] = useState<PeriodFilters>({
    dateRange: { 
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, new Date().getDate()),
      to: new Date()
    },
    quickDateRange: '1-month'
  });
  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useFinancialTransactions();
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useFinancialSummary();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const getTransactionBadge = (type: string) => {
    return type?.toLowerCase() === 'income' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Income</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">Expense</Badge>
    );
  };


  if (transactionsLoading || summaryLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (transactionsError || summaryError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading financial data</AlertTitle>
        <AlertDescription>
          {transactionsError instanceof Error ? transactionsError.message : 'An unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Trend Chart - only shown in Finance tab */}
      <FinancialTrendChart />
    </div>
  );
};

export default FinanceTab;
