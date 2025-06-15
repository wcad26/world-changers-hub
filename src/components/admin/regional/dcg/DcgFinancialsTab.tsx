
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";

// Mock data will be replaced later
const mockDcgs = [ { id: 1, name: "Victory DCG" }, { id: 2, name: "Faith DCG" } ];
const mockFinancials = [
  { id: 1, dcgId: 1, dcgName: "Victory DCG", date: "2023-09-05", type: "Tithe", amount: 350, description: "Weekly collection" },
  { id: 2, dcgId: 1, dcgName: "Victory DCG", date: "2023-09-05", type: "Offering", amount: 120, description: "Weekly collection" },
];

const DcgFinancialsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>DCG Financials</CardTitle>
        <CardDescription>Financial management for DCGs.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">All DCGs</option>
              {mockDcgs.map(dcg => (<option key={dcg.id} value={dcg.id}>{dcg.name}</option>))}
            </select>
          </div>
          <Button>
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
                {mockFinancials.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.dcgName}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default DcgFinancialsTab;
