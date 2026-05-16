import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpRight, ArrowDownRight, DollarSign, PiggyBank, Receipt, TrendingUp, Plus, ChevronDown, Download, Wallet, ListOrdered } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import FinanceKpiCard from "./FinanceKpiCard";
import FinanceFiltersBar from "./FinanceFiltersBar";
import LedgerTrendChart from "./LedgerTrendChart";
import { useRegionalLedger, summarizeLedger } from "@/hooks/useRegionalLedger";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import { RecordTitheDialog } from "@/components/admin/regional/RecordTitheDialog";
import RecordOfferingDialog from "@/components/admin/regional/RecordOfferingDialog";
import RecordSpecialGivingDialog from "@/components/admin/regional/RecordSpecialGivingDialog";
import RecordExpenseDialog from "@/components/admin/regional/RecordExpenseDialog";
import { exportCsv } from "@/utils/csvExport";
import type { PeriodRange } from "./PeriodSelector";

interface Props { range: PeriodRange }

const RegionalLedgerTab: React.FC<Props> = ({ range }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [titheOpen, setTitheOpen] = useState(false);
  const [offeringOpen, setOfferingOpen] = useState(false);
  const [specialOpen, setSpecialOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const { data: rows = [], isLoading } = useRegionalLedger({
    scope: "regional", from: range.from, to: range.to, categoryId, type,
  });

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      r.category?.name?.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      String(r.amount).includes(s)
    );
  }, [rows, search]);

  const summary = useMemo(() => summarizeLedger(filtered), [filtered]);
  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);

  const handleExport = () => {
    exportCsv(`regional-finances-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      filtered.map(r => ({
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <FinanceKpiCard label="Total Income" value={fc(summary.total_income)} icon={ArrowUpRight} tone="income" />
        <FinanceKpiCard label="Total Expenses" value={fc(summary.total_expenses)} icon={ArrowDownRight} tone="expense" />
        <FinanceKpiCard label="Net Balance" value={fc(summary.net_balance)} icon={Wallet} tone={summary.net_balance >= 0 ? "income" : "expense"} />
        <FinanceKpiCard label="Tithes" value={fc(summary.tithes)} icon={PiggyBank} tone="neutral" />
        <FinanceKpiCard label="Offerings" value={fc(summary.offerings)} icon={DollarSign} tone="info" />
        <FinanceKpiCard label="Special Giving" value={fc(summary.special_giving)} icon={TrendingUp} tone="warning" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <FinanceFiltersBar
          search={search} onSearchChange={setSearch}
          categoryId={categoryId} onCategoryChange={setCategoryId}
          type={type} onTypeChange={setType}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length} className="bg-card/60 backdrop-blur-sm border-border/40">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-primary-foreground shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Record <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setTitheOpen(true)}><PiggyBank className="mr-2 h-4 w-4" /> Tithe</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOfferingOpen(true)}><DollarSign className="mr-2 h-4 w-4" /> Offering</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSpecialOpen(true)}><ArrowUpRight className="mr-2 h-4 w-4" /> Special Giving</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExpenseOpen(true)}><Receipt className="mr-2 h-4 w-4" /> Expense</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <LedgerTrendChart rows={filtered} regionCurrency={regionCurrency} description="Regional ledger over the selected period" />

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListOrdered className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">Transactions</h3>
            <p className="text-xs text-muted-foreground">Regional-level income and expenses (excludes DCG ledgers)</p>
          </div>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No transactions for the selected filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id} className="border-border/20 hover:bg-muted/30">
                    <TableCell className="whitespace-nowrap text-muted-foreground">{format(new Date(r.transaction_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="font-medium">{r.category?.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{r.description || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.category?.type?.toLowerCase() === "income" ? "default" : "secondary"} className="capitalize">
                        {r.category?.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums">{fc(Number(r.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <RecordTitheDialog open={titheOpen} onOpenChange={setTitheOpen} />
      <RecordOfferingDialog open={offeringOpen} onOpenChange={setOfferingOpen} />
      <RecordSpecialGivingDialog open={specialOpen} onOpenChange={setSpecialOpen} />
      <RecordExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} onSubmit={async () => setExpenseOpen(false)} />
    </div>
  );
};

export default RegionalLedgerTab;
