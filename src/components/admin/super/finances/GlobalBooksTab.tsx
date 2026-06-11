import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpRight, ArrowDownRight, Wallet, Plus, ChevronDown, Receipt, DollarSign, Download, ListOrdered } from "lucide-react";
import { format } from "date-fns";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import LedgerTrendChart from "@/components/admin/regional/finances/LedgerTrendChart";
import RecordGlobalTransactionDialog from "./RecordGlobalTransactionDialog";
import { useGlobalLedger } from "@/hooks/useGlobalLedger";
import { summarizeLedger } from "@/hooks/useRegionalLedger";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useFxConverter } from "@/hooks/useDisplayCurrency";
import { exportCsv } from "@/utils/csvExport";
import type { PeriodRange } from "@/components/admin/regional/finances/PeriodSelector";

interface Props {
  range: PeriodRange;
}

const GlobalBooksTab: React.FC<Props> = ({ range }) => {
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const { data: rows = [], isLoading } = useGlobalLedger({
    scope: "regional",
    from: range.from,
    to: range.to,
    regionFilter: "global",
  });

  const { baseCode, baseCurrency, convert } = useFxConverter();
  const convertedRows = useMemo(() => rows.map((r) => {
    const src = r.currency_code || baseCode;
    const v = convert(Number(r.amount) || 0, src);
    return { ...r, _originalAmount: Number(r.amount) || 0, _sourceCurrency: src, amount: v ?? 0, _unconverted: v == null };
  }), [rows, convert, baseCode]);
  const summary = useMemo(() => summarizeLedger(convertedRows), [convertedRows]);
  const fc = (n: number) => formatWithCurrency(n, baseCurrency);

  const handleExport = () => {
    exportCsv(
      `global-books-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      rows.map((r) => ({
        date: r.transaction_date,
        category: r.category?.name ?? "",
        type: r.category?.type ?? "",
        description: r.description ?? "",
        amount: r.amount,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Super Admin Books</strong> — finances recorded here are owned by the Super Admin and are not attributed to any region.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="Income" value={fc(summary.total_income)} icon={ArrowUpRight} tone="income" />
        <FinanceKpiCard label="Expenses" value={fc(summary.total_expenses)} icon={ArrowDownRight} tone="expense" />
        <FinanceKpiCard label="Net" value={fc(summary.net_balance)} icon={Wallet} tone={summary.net_balance >= 0 ? "income" : "expense"} />
        <FinanceKpiCard label="Transactions" value={summary.transaction_count} icon={ListOrdered} tone="info" />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!rows.length} className="bg-card/60 backdrop-blur-sm border-border/40">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Record <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIncomeOpen(true)}><DollarSign className="mr-2 h-4 w-4" /> Income</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setExpenseOpen(true)}><Receipt className="mr-2 h-4 w-4" /> Expense</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LedgerTrendChart rows={rows as any} description="Super Admin books over the selected period" />

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Transactions</h3>
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No global transactions yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{format(new Date(r.transaction_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">{r.category?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.category?.type?.toLowerCase() === "income" ? "default" : "secondary"} className="capitalize">
                        {r.category?.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{fc(Number(r.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <RecordGlobalTransactionDialog open={incomeOpen} onOpenChange={setIncomeOpen} defaultType="Income" />
      <RecordGlobalTransactionDialog open={expenseOpen} onOpenChange={setExpenseOpen} defaultType="Expense" />
    </div>
  );
};

export default GlobalBooksTab;
