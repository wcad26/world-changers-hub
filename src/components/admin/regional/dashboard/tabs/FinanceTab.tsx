
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
import FinancialTrendChart from './FinancialTrendChart';
import { format } from 'date-fns';

const FinanceTab: React.FC = () => {
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
        <Skeleton className="h-96" />
        <Skeleton className="h-64" />
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
      {/* Financial Trend Chart */}
      <FinancialTrendChart />
      
      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest financial transactions</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{transaction.description || 'No description'}</TableCell>
                    <TableCell>{transaction.category?.name || 'Uncategorized'}</TableCell>
                    <TableCell>
                      {getTransactionBadge(transaction.category?.type || 'expense')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(transaction.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p>Start by adding your first financial transaction.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceTab;
