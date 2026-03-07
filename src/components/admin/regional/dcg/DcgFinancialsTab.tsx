
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, AlertCircle, Calendar, Filter, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useDcgs } from '@/hooks/useDCGs';
import { useDcgFinancialTransactions, useDcgFinancialSummary } from '@/hooks/useDcgFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddTransactionDialog } from './AddTransactionDialog';
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { useRegionCurrency } from '@/hooks/useCurrencies';
import { formatWithCurrency } from '@/utils/currencyUtils';
import { useAuth } from '@/hooks/useAuth';

const DcgFinancialsTab = () => {
  const [selectedDcgId, setSelectedDcgId] = useState<string>('all');
  const [isAddTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("current_month");
  const { userRegion } = useAuth();
  const { data: currency } = useRegionCurrency(userRegion?.id);
  
  const { data: dcgs, isLoading: isLoadingDcgs } = useDcgs();
  
  const fmt = (amount: number) => formatWithCurrency(amount, currency);

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (dateFilter) {
      case "current_month":
        return {
          from: format(startOfMonth(now), 'yyyy-MM-dd'),
          to: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return {
          from: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          to: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      case "last_3_months":
        return {
          from: format(subMonths(now, 3), 'yyyy-MM-dd'),
          to: format(now, 'yyyy-MM-dd')
        };
      default:
        return undefined;
    }
  }, [dateFilter]);

  // Use optimized DCG-specific hooks
  const { data: dcgTransactions, isLoading: isLoadingTransactions, isError, error } = useDcgFinancialTransactions(
    selectedDcgId !== "all" ? selectedDcgId : undefined,
    { ...dateRange, limit: 50 }
  );

  const { data: dcgSummary, isLoading: summaryLoading } = useDcgFinancialSummary(
    selectedDcgId !== "all" ? selectedDcgId : undefined,
    dateRange
  );

  const isLoading = isLoadingDcgs || isLoadingTransactions || summaryLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>DCG Financials</CardTitle>
          <CardDescription>Financial management for DCGs.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Select onValueChange={setSelectedDcgId} value={selectedDcgId}>
                <SelectTrigger>
                  <SelectValue placeholder="All DCGs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All DCGs</SelectItem>
                  {dcgs?.map(dcg => (
                    <SelectItem key={dcg.id} value={dcg.id}>{dcg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setAddTransactionDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>

          {/* Financial Summary Cards */}
          {selectedDcgId !== "all" && dcgSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${dcgSummary.total_income.toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${dcgSummary.total_expenses.toLocaleString()}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
                      <p className={`text-2xl font-bold ${dcgSummary.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${dcgSummary.net_balance.toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                      <p className="text-2xl font-bold">
                        {dcgSummary.transaction_count}
                      </p>
                    </div>
                    <Filter className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DCG Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={`loading-${i}`}>
                        <TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {isError && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error fetching financials</AlertTitle>
                          <AlertDescription>
                            {error instanceof Error ? error.message : "An unknown error occurred."}
                          </AlertDescription>
                        </Alert>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !isError && dcgTransactions && dcgTransactions.length > 0 && (
                    dcgTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.dcg?.name || 'Regional'}</TableCell>
                        <TableCell>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.category?.type === 'income' ? 'default' : 'destructive'}>
                            {transaction.category?.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${Number(transaction.amount).toLocaleString()}</TableCell>
                        <TableCell>{transaction.description || transaction.category?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                   {!isLoading && !isError && (!dcgTransactions || dcgTransactions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          {selectedDcgId === "all" 
                            ? "Select a specific DCG to view financial transactions."
                            : "No transactions found for the selected DCG and date range."
                          }
                        </TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      <AddTransactionDialog open={isAddTransactionDialogOpen} setOpen={setAddTransactionDialogOpen} />
    </>
  );
};
export default DcgFinancialsTab;
