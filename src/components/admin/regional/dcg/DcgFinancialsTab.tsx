
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, AlertCircle } from "lucide-react";
import { useDcgs } from '@/hooks/useDCGs';
import { useFinancialTransactions } from '@/hooks/useFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddTransactionDialog } from './AddTransactionDialog';

const DcgFinancialsTab = () => {
  const [selectedDcgId, setSelectedDcgId] = useState<string>('all');
  const [isAddTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const { data: dcgs, isLoading: isLoadingDcgs } = useDcgs();
  const { data: transactions, isLoading: isLoadingTransactions, isError, error } = useFinancialTransactions();

  const filteredTransactions = (transactions || []).filter(
    transaction => selectedDcgId === 'all' || !selectedDcgId || transaction.dcg_id === selectedDcgId
  );

  const isLoading = isLoadingDcgs || isLoadingTransactions;

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
            <Button onClick={() => setAddTransactionDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
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
                  {!isLoading && !isError && filteredTransactions.length > 0 && (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.dcg?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(transaction.transaction_date!).toLocaleDateString()}</TableCell>
                        <TableCell>{(transaction.category as any)?.name || 'N/A'}</TableCell>
                        <TableCell>${Number(transaction.amount).toFixed(2)}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                   {!isLoading && !isError && filteredTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          No financial transactions found.
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
