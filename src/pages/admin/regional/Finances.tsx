import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Calendar, Receipt, PiggyBank, Download, ArrowUpRight, Filter, TrendingUp, Search, Plus, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useFinancialTransactions, useFinancialSummary } from "@/hooks/useFinancials";
import { RecordTitheDialog } from "@/components/admin/regional/RecordTitheDialog";
import RecordOfferingDialog from "@/components/admin/regional/RecordOfferingDialog";
import RecordSpecialGivingDialog from "@/components/admin/regional/RecordSpecialGivingDialog";
import RecordExpenseDialog from "@/components/admin/regional/RecordExpenseDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatWithCurrency } from "@/utils/currencyUtils";
import FundraisingTabContent from "@/components/admin/regional/FundraisingTabContent";

const RegionalFinances: React.FC = () => {
  console.log('RegionalFinances component loaded successfully');
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  
  // State for dialogs
  const [recordTitheDialogOpen, setRecordTitheDialogOpen] = useState(false);
  const [offeringDialogOpen, setOfferingDialogOpen] = useState(false);
  const [recordSpecialGivingDialogOpen, setRecordSpecialGivingDialogOpen] = useState(false);
  const [recordExpenseDialogOpen, setRecordExpenseDialogOpen] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch financial data from database
  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useFinancialTransactions();
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();

  // Debug logging
  console.log('=== FINANCIAL TRANSACTIONS DEBUG ===');
  console.log('Transactions loading:', transactionsLoading);
  console.log('Transactions error:', transactionsError);
  console.log('Transactions count:', transactions?.length || 0);
  console.log('Transactions data:', transactions);
  console.log('Summary data:', summary);

  // Use the real financial summary data from the database
  const totalIncome = summary?.total_income || 0;
  const totalExpense = summary?.total_expenses || 0;
  const netBalance = summary?.net_balance || 0;
  const totalTithes = summary?.total_tithes || 0;
  const totalOfferings = summary?.total_offerings || 0;
  const totalSpecialGiving = summary?.total_special_giving || 0;

  // Filter transactions by search term and type
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.category?.name?.toLowerCase().includes(searchLower) ||
      transaction.description?.toLowerCase().includes(searchLower) ||
      transaction.amount.toString().includes(searchTerm)
    );
  });

  console.log('Filtered transactions count:', filteredTransactions.length);
  console.log('Search term:', searchTerm);

  const tithes = filteredTransactions.filter(t => t.category?.name === 'Tithes');
  const offerings = filteredTransactions.filter(t => t.category?.name?.includes('Offering'));
  const specialGiving = filteredTransactions.filter(t => 
    ['Building Fund', 'Mission Fund', 'Youth Fund', 'Benevolence Fund'].includes(t.category?.name || '')
  );
  const expenses = filteredTransactions.filter(t => t.category?.type?.toLowerCase() === 'expense');

  console.log('Filtered by category - Tithes:', tithes.length, 'Offerings:', offerings.length, 'Special:', specialGiving.length, 'Expenses:', expenses.length);

  // Handle expense form submission
  const handleExpenseSubmit = async (data: any) => {
    console.log('Expense submitted:', data);
    setRecordExpenseDialogOpen(false);
  };

  const formatCurrency = (amount: number) => {
    return formatWithCurrency(amount, regionCurrency);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
            <p className="text-muted-foreground">
              Track and manage finances, tithes, offerings and expenses
            </p>
          </div>
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
                Total income
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
                Total expenses
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
                Net balance
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
                Total tithes
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
            <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
              <TabsList className="w-max">
                <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                <TabsTrigger value="tithes">Tithes</TabsTrigger>
                <TabsTrigger value="offerings">Offerings</TabsTrigger>
                <TabsTrigger value="special">Special Giving</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Transaction
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => setRecordTitheDialogOpen(true)} className="cursor-pointer">
                  <PiggyBank className="mr-2 h-4 w-4" />
                  Record Tithe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOfferingDialogOpen(true)} className="cursor-pointer">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Record Offering
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRecordSpecialGivingDialogOpen(true)} className="cursor-pointer">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Record Special Giving
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRecordExpenseDialogOpen(true)} className="cursor-pointer">
                  <Receipt className="mr-2 h-4 w-4" />
                  Record Expense
                </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
            </div>
          </div>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  Complete list of financial transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading transactions...</div>
                ) : transactionsError ? (
                  <div className="py-8 text-center">
                    <p className="text-destructive font-medium">Error loading transactions</p>
                    <p className="text-sm text-muted-foreground mt-2">{transactionsError.message}</p>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    {searchTerm ? (
                      <>
                        <p className="font-medium">No transactions match your search</p>
                        <p className="text-sm mt-2">Try adjusting your search term</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">No transactions found</p>
                        <p className="text-sm mt-2">Record your first transaction using the button above</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                     <TableBody>
                       {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{transaction.category?.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{transaction.description || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={transaction.category?.type?.toLowerCase() === 'income' ? 'default' : 'secondary'}>
                              {transaction.category?.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(Number(transaction.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tithes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tithes</CardTitle>
                <CardDescription>
                  Member tithes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tithes.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="font-medium">No tithe transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tithes.map((tithe) => (
                        <TableRow key={tithe.id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(tithe.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>Member</TableCell>
                          <TableCell className="hidden md:table-cell">{tithe.description || 'Tithe payment'}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(Number(tithe.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offerings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offerings</CardTitle>
                <CardDescription>
                  Service offerings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {offerings.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="font-medium">No offering transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offerings.map((offering) => (
                        <TableRow key={offering.id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(offering.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{offering.category?.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{offering.description || 'Service offering'}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(Number(offering.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="special" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Special Giving</CardTitle>
                <CardDescription>
                  Special donations and fund contributions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {specialGiving.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="font-medium">No special giving transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fund</TableHead>
                        <TableHead className="hidden md:table-cell">Donor</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {specialGiving.map((gift) => (
                        <TableRow key={gift.id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(gift.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{gift.category?.name}</TableCell>
                          <TableCell className="hidden md:table-cell">Donor</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(Number(gift.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>
                  Church expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenses.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p className="font-medium">No expense transactions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="whitespace-nowrap">{format(new Date(expense.transaction_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{expense.category?.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{expense.description || '-'}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(Number(expense.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fundraising" className="space-y-4">
            <FundraisingTabContent />
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
    </>
  );
};

export default RegionalFinances;