import React, { useMemo, useState } from "react";
import DcgAdminLayout from "@/components/admin/DcgAdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Plus, Download,
  ListOrdered, ChevronDown, Layers, Loader2,
} from "lucide-react";
import { format } from "date-fns";

import PeriodSelector, { type PeriodKey, resolvePeriod } from "@/components/admin/regional/finances/PeriodSelector";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import FinanceFiltersBar from "@/components/admin/regional/finances/FinanceFiltersBar";
import LedgerTrendChart from "@/components/admin/regional/finances/LedgerTrendChart";
import DcgTransactionRowActions from "@/components/admin/regional/finances/DcgTransactionRowActions";

import { useAuth } from "@/hooks/useAuth";
import { useDcgs } from "@/hooks/useDCGs";
import { useDcgFinancialTransactions } from "@/hooks/useDcgFinancials";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import { exportCsv } from "@/utils/csvExport";
import type { LedgerRow } from "@/hooks/useRegionalLedger";

import { RecordDcgIncomeDialog } from "@/components/admin/dcg/RecordDcgIncomeDialog";
import { RecordDcgExpenseDialog } from "@/components/admin/dcg/RecordDcgExpenseDialog";

const SPECIAL_CATEGORIES = ["Building Fund", "Mission Fund", "Youth Fund", "Benevolence Fund"];

const DcgFinances: React.FC = () => {
  const { userDcg, loading: authLoading } = useAuth();
  const { data: dcgs } = useDcgs();
  const currentDcg = dcgs?.find((d) => d.id === userDcg?.id);
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);

  const [period, setPeriod] = useState<PeriodKey>("3m");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const range = useMemo(() => resolvePeriod(period, customRange), [period, customRange]);

  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [incomeType, setIncomeType] = useState<"all" | "tithes" | "offerings" | "special">("all");
  const [expenseCategoryId, setExpenseCategoryId] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);

  const [incomeDlgOpen, setIncomeDlgOpen] = useState(false);
  const [expenseDlgOpen, setExpenseDlgOpen] = useState(false);

  const { data: rawRows = [], isLoading } = useDcgFinancialTransactions(userDcg?.id, {
    from: format(range.from, "yyyy-MM-dd"),
    to: format(range.to, "yyyy-MM-dd"),
  });

  // Normalize to LedgerRow shape for the shared chart + row-actions components
  const rows: LedgerRow[] = useMemo(
    () =>
      rawRows.map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        description: r.description ?? null,
        transaction_date: r.transaction_date,
        dcg_id: r.dcg_id ?? userDcg?.id ?? null,
        category_id: r.category_id,
        category: r.category ? { name: r.category.name, type: r.category.type } : null,
        dcg: { name: currentDcg?.name ?? null },
      })),
    [rawRows, userDcg?.id, currentDcg?.name],
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      const ct = r.category?.type?.toLowerCase();
      if (type !== "all" && ct !== type) return false;
      const name = r.category?.name ?? "";
      if ((type === "all" || type === "income") && ct === "income" && incomeType !== "all") {
        if (incomeType === "tithes" && !/tithe/i.test(name)) return false;
        if (incomeType === "offerings" && !/offering/i.test(name)) return false;
        if (incomeType === "special" && !SPECIAL_CATEGORIES.includes(name)) return false;
      }
      if ((type === "all" || type === "expense") && ct === "expense" && expenseCategoryId) {
        if (r.category_id !== expenseCategoryId) return false;
      }
      if (!s) return true;
      return (
        name.toLowerCase().includes(s) ||
        (r.description ?? "").toLowerCase().includes(s) ||
        String(r.amount).includes(s)
      );
    });
  }, [rows, search, type, incomeType, expenseCategoryId]);

  const summary = useMemo(() => {
    let income = 0, expenses = 0, offerings = 0;
    for (const r of filtered) {
      const ct = r.category?.type?.toLowerCase();
      const amt = Number(r.amount) || 0;
      if (ct === "income") income += amt;
      else if (ct === "expense") expenses += amt;
      if (/offering/i.test(r.category?.name ?? "")) offerings += amt;
    }
    return { income, expenses, net: income - expenses, offerings };
  }, [filtered]);

  const perCategory = useMemo(() => {
    const map = new Map<string, { name: string; type: string; count: number; total: number }>();
    for (const r of filtered) {
      const key = r.category_id || r.category?.name || "unknown";
      const cur = map.get(key) ?? {
        name: r.category?.name ?? "—",
        type: r.category?.type ?? "—",
        count: 0,
        total: 0,
      };
      cur.count += 1;
      cur.total += Number(r.amount) || 0;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);

  const handleExport = () => {
    exportCsv(
      `dcg-finances-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      filtered.map((r) => ({
        date: r.transaction_date,
        category: r.category?.name ?? "",
        type: r.category?.type ?? "",
        description: r.description ?? "",
        amount: r.amount,
      })),
    );
  };

  if (authLoading) {
    return (
      <DcgAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading…</span>
        </div>
      </DcgAdminLayout>
    );
  }

  if (!userDcg) {
    return (
      <DcgAdminLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold">DCG Finances</h1>
          <p className="text-muted-foreground">DCG information not found.</p>
        </div>
      </DcgAdminLayout>
    );
  }

  return (
    <DcgAdminLayout>
      <div className="space-y-6 px-[10px] my-[20px] pb-24">
        {/* Glass header */}
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DCG Financial Management</h1>
            <p className="text-sm text-muted-foreground">
              Track income, expenses and giving for {currentDcg?.name ?? "your DCG"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector
              period={period}
              onPeriodChange={setPeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <Button size="sm" onClick={() => setIncomeDlgOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Record Income
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpenseDlgOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Record Expense
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FinanceKpiCard label="Income" value={fc(summary.income)} icon={ArrowUpRight} tone="income" />
          <FinanceKpiCard label="Expenses" value={fc(summary.expenses)} icon={ArrowDownRight} tone="expense" />
          <FinanceKpiCard
            label="Net"
            value={fc(summary.net)}
            icon={Wallet}
            tone={summary.net >= 0 ? "income" : "expense"}
          />
          <FinanceKpiCard label="Offerings" value={fc(summary.offerings)} icon={PiggyBank} tone="primary" />
        </div>

        {/* Filters + Export */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex-1">
            <FinanceFiltersBar
              search={search}
              onSearchChange={setSearch}
              categoryId={null}
              onCategoryChange={() => {}}
              type={type}
              onTypeChange={setType}
              incomeType={incomeType}
              onIncomeTypeChange={setIncomeType}
              expenseCategoryId={expenseCategoryId}
              onExpenseCategoryChange={setExpenseCategoryId}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!filtered.length}
            className="bg-card/60 backdrop-blur-sm border-border/40"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        {/* Trend chart */}
        <LedgerTrendChart
          rows={filtered}
          regionCurrency={regionCurrency}
          title="DCG Trends"
          description="Cumulative income, expenses and net for the selected period"
        />

        {/* Itemized transactions */}
        <Collapsible
          open={txOpen}
          onOpenChange={setTxOpen}
          className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6"
        >
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 group">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-primary" />
              <div className="text-left">
                <h3 className="text-base font-semibold text-foreground">Transactions</h3>
                <p className="text-xs text-muted-foreground">Itemized ledger entries for this DCG</p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${txOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            {isLoading ? (
              <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">
                No transactions for the selected filters.
              </p>
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
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} className="border-border/20 hover:bg-muted/30">
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {format(new Date(r.transaction_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{r.category?.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {r.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={r.category?.type?.toLowerCase() === "income" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {r.category?.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`text-right whitespace-nowrap font-semibold tabular-nums ${
                            r.category?.type?.toLowerCase() === "income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {fc(Number(r.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          <DcgTransactionRowActions row={r} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <RecordDcgIncomeDialog open={incomeDlgOpen} onOpenChange={setIncomeDlgOpen} />
      <RecordDcgExpenseDialog open={expenseDlgOpen} onOpenChange={setExpenseDlgOpen} />
    </DcgAdminLayout>
  );
};

export default DcgFinances;
