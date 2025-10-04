import React, { useState, useMemo } from "react";
import DcgAdminLayout from "@/components/admin/DcgAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Calendar, Receipt, PiggyBank, TrendingUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFinancialTransactions, useFinancialSummary } from "@/hooks/useFinancials";
import { useAuth } from "@/hooks/useAuth";
import { RecordDcgIncomeDialog } from "@/components/admin/dcg/RecordDcgIncomeDialog";
import { RecordDcgExpenseDialog } from "@/components/admin/dcg/RecordDcgExpenseDialog";
import { useDcgs } from "@/hooks/useDCGs";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatWithCurrency } from "@/utils/currencyUtils";

const DcgFinances: React.FC = () => {
  const { userDcg } = useAuth();
  const { data: dcgs } = useDcgs();
  const currentDcg = dcgs?.find(d => d.id === userDcg?.id);
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);
  
  // State for dialogs
  const [recordIncomeDialogOpen, setRecordIncomeDialogOpen] = useState(false);
  const [recordExpenseDialogOpen, setRecordExpenseDialogOpen] = useState(false);
  
  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 months");

  // Calculate date range based on selected period
  const dateFilters = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case "Last 30 days":
        return {
          from: format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
          to: format(now, 'yyyy-MM-dd')
        };
      case "Last 3 months":
        return {
          from: format(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), 'yyyy-MM-dd'),
          to: format(now, 'yyyy-MM-dd')
        };
      case "Last 6 months":
        return {
          from: format(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), 'yyyy-MM-dd'),
          to: format(now, 'yyyy-MM-dd')
        };
      case "This year":
        return {
          from: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'),
          to: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd')
        };
      case "Last year":
        const lastYear = now.getFullYear() - 1;
        return {
          from: format(new Date(lastYear, 0, 1), 'yyyy-MM-dd'),
          to: format(new Date(lastYear, 11, 31), 'yyyy-MM-dd')
        };
      default:
        return {};
    }
  }, [selectedPeriod]);

  // Fetch financial data from database (filtered by DCG)
  const { data: allTransactions = [], isLoading: transactionsLoading } = useFinancialTransactions(dateFilters);
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(dateFilters);

  // Filter transactions for this DCG only
  const transactions = allTransactions.filter(t => t.dcg_id === userDcg?.id) || [];

  // Calculate DCG-specific summary
  const dcgIncome = transactions.filter(t => t.category?.type === 'Income').reduce((sum, t) => sum + Number(t.amount), 0);
  const dcgExpenses = transactions.filter(t => t.category?.type === 'Expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const dcgNetBalance = dcgIncome - dcgExpenses;
  const dcgOfferings = transactions.filter(t => t.category?.name?.includes('Offering')).reduce((sum, t) => sum + Number(t.amount), 0);

  // Filter transactions by type for different tabs
  const offerings = transactions.filter(t => t.category?.name?.includes('Offering'));
  const specialGiving = transactions.filter(t => 
    ['Building Fund', 'Mission Fund', 'Youth Fund', 'Benevolence Fund'].includes(t.category?.name || '')
  );
  const expenses = transactions.filter(t => t.category?.type === 'Expense');

  const periods = ["Last 30 days", "Last 3 months", "Last 6 months", "This year", "Last year"];

  const formatCurrency = (amount: number) => {
    return formatWithCurrency(amount, regionCurrency);
  };

  if (!userDcg) {
    return (
      <DcgAdminLayout>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">DCG Finances</h1>
            <p className="text-muted-foreground">
              DCG information not found. Please contact your administrator.
            </p>
          </div>
        </div>
      </DcgAdminLayout>
    );
  }

  return (
    <DcgAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DCG Financial Management</h1>
            <p className="text-muted-foreground">
              Track and manage DCG finances, offerings and expenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setRecordIncomeDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Income
            </Button>
            <Button onClick={() => setRecordExpenseDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Record Expense
            </Button>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dcgIncome)}</div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dcgExpenses)}</div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dcgNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dcgNetBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offerings</CardTitle>
              <PiggyBank className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dcgOfferings)}</div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
            <TabsTrigger value="offerings">Offerings</TabsTrigger>
            <TabsTrigger value="special">Special Giving</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All DCG Transactions</CardTitle>
                <CardDescription>
                  Complete list of DCG financial transactions for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div>Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{transaction.category?.name}</TableCell>
                          <TableCell>{transaction.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.category?.type === 'Income' ? 'default' : 'secondary'}>
                              {transaction.category?.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(transaction.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="offerings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DCG Offerings</CardTitle>
                <CardDescription>
                  Service offerings collected through DCG for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offerings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No offerings recorded for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offerings.map((offering) => (
                        <TableRow key={offering.id}>
                          <TableCell>{format(new Date(offering.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{offering.category?.name}</TableCell>
                          <TableCell>{offering.description || 'Service offering'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(offering.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Special Giving</CardTitle>
                <CardDescription>
                  Special donations and fund contributions through DCG for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {specialGiving.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No special giving recorded for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fund</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specialGiving.map((gift) => (
                        <TableRow key={gift.id}>
                          <TableCell>{format(new Date(gift.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{gift.category?.name}</TableCell>
                          <TableCell>{gift.description || 'Special donation'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(gift.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DCG Expenses</CardTitle>
                <CardDescription>
                  DCG expenses for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expenses recorded for this period.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{format(new Date(expense.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{expense.category?.name}</TableCell>
                          <TableCell>{expense.description || '-'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(expense.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <RecordDcgIncomeDialog 
        open={recordIncomeDialogOpen} 
        onOpenChange={setRecordIncomeDialogOpen} 
      />
      <RecordDcgExpenseDialog
        open={recordExpenseDialogOpen}
        onOpenChange={setRecordExpenseDialogOpen}
      />
    </DcgAdminLayout>
  );
};

export default DcgFinances;