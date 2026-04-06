import React, { useState, useMemo } from "react";
import DcgAdminLayout from "@/components/admin/DcgAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Receipt, PiggyBank, TrendingUp, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFinancialTransactions } from "@/hooks/useFinancials";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { RecordDcgIncomeDialog } from "@/components/admin/dcg/RecordDcgIncomeDialog";
import { RecordDcgExpenseDialog } from "@/components/admin/dcg/RecordDcgExpenseDialog";
import { useDcgs } from "@/hooks/useDCGs";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const DcgFinances: React.FC = () => {
  const { userDcg } = useAuth();
  const isMobile = useIsMobile();
  const { data: dcgs } = useDcgs();
  const currentDcg = dcgs?.find(d => d.id === userDcg?.id);
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);
  
  const [recordIncomeDialogOpen, setRecordIncomeDialogOpen] = useState(false);
  const [recordExpenseDialogOpen, setRecordExpenseDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 months");

  const dateFilters = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case "Last 30 days":
        return { from: format(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case "Last 3 months":
        return { from: format(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case "Last 6 months":
        return { from: format(new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()), 'yyyy-MM-dd'), to: format(now, 'yyyy-MM-dd') };
      case "This year":
        return { from: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), to: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd') };
      case "Last year":
        const ly = now.getFullYear() - 1;
        return { from: format(new Date(ly, 0, 1), 'yyyy-MM-dd'), to: format(new Date(ly, 11, 31), 'yyyy-MM-dd') };
      default:
        return {};
    }
  }, [selectedPeriod]);

  const { data: allTransactions = [], isLoading: transactionsLoading } = useFinancialTransactions(dateFilters);
  const transactions = allTransactions.filter(t => t.dcg_id === userDcg?.id);

  const dcgIncome = transactions.filter(t => t.category?.type === 'Income').reduce((s, t) => s + Number(t.amount), 0);
  const dcgExpenses = transactions.filter(t => t.category?.type === 'Expense').reduce((s, t) => s + Number(t.amount), 0);
  const dcgNetBalance = dcgIncome - dcgExpenses;
  const dcgOfferings = transactions.filter(t => t.category?.name?.includes('Offering')).reduce((s, t) => s + Number(t.amount), 0);

  const offerings = transactions.filter(t => t.category?.name?.includes('Offering'));
  const specialGiving = transactions.filter(t => ['Building Fund', 'Mission Fund', 'Youth Fund', 'Benevolence Fund'].includes(t.category?.name || ''));
  const expenses = transactions.filter(t => t.category?.type === 'Expense');

  const periods = ["Last 30 days", "Last 3 months", "Last 6 months", "This year", "Last year"];
  const fmt = (amount: number) => formatWithCurrency(amount, regionCurrency);

  if (!userDcg) {
    return (
      <DcgAdminLayout>
        <div className="p-4 text-center">
          <h1 className="text-2xl font-bold">DCG Finances</h1>
          <p className="text-muted-foreground">DCG information not found.</p>
        </div>
      </DcgAdminLayout>
    );
  }

  const renderTransactionCard = (transaction: typeof transactions[0]) => (
    <div key={transaction.id} className="border border-border rounded-lg p-3 flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{transaction.category?.name}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
        </p>
        {transaction.description && (
          <p className="text-xs text-muted-foreground truncate">{transaction.description}</p>
        )}
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className={cn("text-sm font-medium", transaction.category?.type === 'Income' ? 'text-green-600' : 'text-red-600')}>
          {transaction.category?.type === 'Income' ? '+' : '-'}{fmt(Number(transaction.amount))}
        </p>
        <Badge variant={transaction.category?.type === 'Income' ? 'default' : 'secondary'} className="text-[10px]">
          {transaction.category?.type}
        </Badge>
      </div>
    </div>
  );

  const renderTransactionList = (list: typeof transactions, emptyMsg: string) => {
    if (transactionsLoading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    if (list.length === 0) return <div className="text-center py-8 text-muted-foreground text-sm">{emptyMsg}</div>;

    if (isMobile) {
      return <div className="space-y-2">{list.map(renderTransactionCard)}</div>;
    }

    return (
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
          {list.map((t) => (
            <TableRow key={t.id}>
              <TableCell>{format(new Date(t.transaction_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{t.category?.name}</TableCell>
              <TableCell>{t.description || '-'}</TableCell>
              <TableCell>
                <Badge variant={t.category?.type === 'Income' ? 'default' : 'secondary'}>
                  {t.category?.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{fmt(Number(t.amount))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <DcgAdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold tracking-tight">DCG Financial Management</h1>
            <p className="text-muted-foreground">Track and manage DCG finances</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setRecordIncomeDialogOpen(true)} size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none">
              <Plus className="mr-1.5 h-4 w-4" />
              {isMobile ? "Income" : "Record Income"}
            </Button>
            <Button onClick={() => setRecordExpenseDialogOpen(true)} variant="outline" size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none">
              <Plus className="mr-1.5 h-4 w-4" />
              {isMobile ? "Expense" : "Record Expense"}
            </Button>
          </div>
        </div>

        {/* Period Filter - scrollable on mobile */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {periods.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="whitespace-nowrap text-xs"
              >
                {period}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Income</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">{fmt(dcgIncome)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">{fmt(dcgExpenses)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Net</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className={cn("text-lg md:text-2xl font-bold", dcgNetBalance >= 0 ? 'text-green-600' : 'text-red-600')}>
                {fmt(dcgNetBalance)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-4">
              <CardTitle className="text-xs md:text-sm font-medium">Offerings</CardTitle>
              <PiggyBank className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold">{fmt(dcgOfferings)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className={cn("w-full", isMobile && "overflow-x-auto flex")}>
            <TabsTrigger value="transactions" className="flex-1 text-xs md:text-sm">All</TabsTrigger>
            <TabsTrigger value="offerings" className="flex-1 text-xs md:text-sm">Offerings</TabsTrigger>
            <TabsTrigger value="special" className="flex-1 text-xs md:text-sm">Special</TabsTrigger>
            <TabsTrigger value="expenses" className="flex-1 text-xs md:text-sm">Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">All Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderTransactionList(transactions, "No transactions found.")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offerings">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Offerings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderTransactionList(offerings, "No offerings recorded.")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Special Giving</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderTransactionList(specialGiving, "No special giving recorded.")}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Expenses</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {renderTransactionList(expenses, "No expenses recorded.")}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RecordDcgIncomeDialog open={recordIncomeDialogOpen} onOpenChange={setRecordIncomeDialogOpen} />
      <RecordDcgExpenseDialog open={recordExpenseDialogOpen} onOpenChange={setRecordExpenseDialogOpen} />
    </DcgAdminLayout>
  );
};

export default DcgFinances;
