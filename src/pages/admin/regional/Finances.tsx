import React, { useState, useMemo } from "react";
import RegionalAdminLayout from "@/components/admin/RegionalAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Calendar, Receipt, PiggyBank, Download, ArrowUpRight, Filter, TrendingUp, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from "date-fns";
import { useFinancialTransactions, useFinancialSummary } from "@/hooks/useFinancials";
import { RecordTitheDialog } from "@/components/admin/regional/RecordTitheDialog";
import RecordOfferingDialog from "@/components/admin/regional/RecordOfferingDialog";
import RecordSpecialGivingDialog from "@/components/admin/regional/RecordSpecialGivingDialog";
import RecordExpenseDialog from "@/components/admin/regional/RecordExpenseDialog";

const RegionalFinances: React.FC = () => {
  // State for dialogs
  const [recordTitheDialogOpen, setRecordTitheDialogOpen] = useState(false);
  const [offeringDialogOpen, setOfferingDialogOpen] = useState(false);
  const [recordSpecialGivingDialogOpen, setRecordSpecialGivingDialogOpen] = useState(false);
  const [recordExpenseDialogOpen, setRecordExpenseDialogOpen] = useState(false);
  
  // Period filter state
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 months");
  const [searchTerm, setSearchTerm] = useState("");

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
          from: format(startOfYear(now), 'yyyy-MM-dd'),
          to: format(endOfYear(now), 'yyyy-MM-dd')
        };
      case "Last year":
        const lastYear = subYears(now, 1);
        return {
          from: format(startOfYear(lastYear), 'yyyy-MM-dd'),
          to: format(endOfYear(lastYear), 'yyyy-MM-dd')
        };
      default:
        return {};
    }
  }, [selectedPeriod]);

  // Fetch financial data from database
  const { data: transactions = [], isLoading: transactionsLoading } = useFinancialTransactions(dateFilters);
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(dateFilters);

  // Use the real financial summary data from the database
  const totalIncome = summary?.total_income || 0;
  const totalExpense = summary?.total_expenses || 0;
  const netBalance = summary?.net_balance || 0;
  const totalTithes = summary?.total_tithes || 0;
  const totalOfferings = summary?.total_offerings || 0;
  const totalSpecialGiving = summary?.total_special_giving || 0;

  // Filter transactions by type for different tabs
  const tithes = transactions.filter(t => t.category?.name === 'Tithes');
  const offerings = transactions.filter(t => t.category?.name?.includes('Offering'));
  const specialGiving = transactions.filter(t => 
    ['Building Fund', 'Mission Fund', 'Youth Fund', 'Benevolence Fund'].includes(t.category?.name || '')
  );
  const expenses = transactions.filter(t => t.category?.type?.toLowerCase() === 'expense');

  // Handle expense form submission
  const handleExpenseSubmit = async (data: any) => {
    console.log('Expense submitted:', data);
    setRecordExpenseDialogOpen(false);
  };

  const periods = ["Last 30 days", "Last 3 months", "Last 6 months", "This year", "Last year"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <RegionalAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            <p className="text-muted-foreground">
              Track and manage finances, tithes, offerings and expenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setRecordTitheDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Tithe
            </Button>
            <Button onClick={() => setOfferingDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Offering
            </Button>
            <Button onClick={() => setRecordSpecialGivingDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Special Giving
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpense)}</div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                For {selectedPeriod.toLowerCase()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tithes</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalTithes)}</div>
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
            <TabsTrigger value="tithes">Tithes</TabsTrigger>
            <TabsTrigger value="offerings">Offerings</TabsTrigger>
            <TabsTrigger value="special">Special Giving</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  Complete list of financial transactions for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div>Loading transactions...</div>
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
                            <Badge variant={transaction.category?.type?.toLowerCase() === 'income' ? 'default' : 'secondary'}>
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

          <TabsContent value="tithes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tithes</CardTitle>
                <CardDescription>
                  Member tithes for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tithes.map((tithe) => (
                      <TableRow key={tithe.id}>
                        <TableCell>{format(new Date(tithe.transaction_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>Member</TableCell>
                        <TableCell>{tithe.description || 'Tithe payment'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(tithe.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offerings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offerings</CardTitle>
                <CardDescription>
                  Service offerings for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Special Giving</CardTitle>
                <CardDescription>
                  Special donations and fund contributions for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialGiving.map((gift) => (
                      <TableRow key={gift.id}>
                        <TableCell>{format(new Date(gift.transaction_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{gift.category?.name}</TableCell>
                        <TableCell>Donor</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(gift.amount))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>
                  Church expenses for {selectedPeriod.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <RecordTitheDialog 
        open={recordTitheDialogOpen} 
        onOpenChange={setRecordTitheDialogOpen} 
      />
      <RecordOfferingDialog 
        open={offeringDialogOpen} 
        onOpenChange={setOfferingDialogOpen} 
      />
      <RecordSpecialGivingDialog 
        open={recordSpecialGivingDialogOpen} 
        onOpenChange={setRecordSpecialGivingDialogOpen} 
      />
      <RecordExpenseDialog
        open={recordExpenseDialogOpen}
        onOpenChange={setRecordExpenseDialogOpen}
        onSubmit={handleExpenseSubmit}
      />
    </RegionalAdminLayout>
  );
};

export default RegionalFinances;