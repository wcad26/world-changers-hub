
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import { useFinancialTransactions, useFinancialSummary } from '@/hooks/useFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { DashboardFilters } from '../DashboardFilters';
import { format } from 'date-fns';

interface FinanceTabProps {
  filters: DashboardFilters;
}

const FinanceTab: React.FC<FinanceTabProps> = ({ filters }) => {
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

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter(transaction => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!transaction.description?.toLowerCase().includes(searchTerm) &&
            !transaction.category?.name?.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      // Category filter (Income/Expense)
      if (filters.category && filters.category !== 'all') {
        if (transaction.category?.type?.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

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
    return null;
  }

  return (
    <div className="space-y-6">

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Financial Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} of {transactions?.length || 0} transactions
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Transaction
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>DCG</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-32 truncate">
                      {transaction.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.category?.name || 'Uncategorized'}
                  </TableCell>
                  <TableCell>
                    {getTransactionBadge(transaction.category?.type || '')}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      transaction.category?.type?.toLowerCase() === 'income' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.category?.type?.toLowerCase() === 'expense' ? '-' : '+'}
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.dcg?.name || 'Regional'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTab;
