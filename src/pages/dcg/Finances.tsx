import React, { useMemo, useState } from "react";
import DcgAdminLayout from "@/components/admin/DcgAdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, Plus, Download,
  Loader2, AlertCircle, Search, Inbox, ListOrdered, TrendingUp,
} from "lucide-react";
import { format, subMonths, startOfYear } from "date-fns";

import { useCurrentDcg, useDcgFinancialTransactions } from "@/hooks/useDcgFinancials";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import { exportCsv } from "@/utils/csvExport";

import { RecordDcgIncomeDialog } from "@/components/admin/dcg/RecordDcgIncomeDialog";
import { RecordDcgExpenseDialog } from "@/components/admin/dcg/RecordDcgExpenseDialog";

type PeriodKey = "all" | "1m" | "3m" | "6m" | "ytd" | "1y";

const resolvePeriod = (p: PeriodKey): { from?: Date; to?: Date } => {
  const now = new Date();
  switch (p) {
    case "1m": return { from: subMonths(now, 1), to: now };
    case "3m": return { from: subMonths(now, 3), to: now };
    case "6m": return { from: subMonths(now, 6), to: now };
    case "ytd": return { from: startOfYear(now), to: now };
    case "1y": return { from: subMonths(now, 12), to: now };
    case "all":
    default: return {};
  }
};

const DcgFinances: React.FC = () => {
  const { data: currentDcg, isLoading: dcgLoading, error: dcgError } = useCurrentDcg();
  const dcgId = currentDcg?.id;
  const { data: regionCurrency } = useRegionCurrency(currentDcg?.region_id);

  const [period, setPeriod] = useState<PeriodKey>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const range = useMemo(() => resolvePeriod(period), [period]);
  const filters = useMemo(
    () => ({
      from: range.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
    }),
    [range],
  );

  const {
    data: rows = [],
    isLoading: txLoading,
    error: txError,
    refetch,
  } = useDcgFinancialTransactions(dcgId, filters);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      const ct = (r.category?.type || "").toLowerCase();
      if (typeFilter !== "all" && ct !== typeFilter) return false;
      if (!s) return true;
      return (
        (r.category?.name || "").toLowerCase().includes(s) ||
        (r.description || "").toLowerCase().includes(s) ||
        String(r.amount).includes(s)
      );
    });
  }, [rows, search, typeFilter]);

  const summary = useMemo(() => {
    let income = 0, expenses = 0, offerings = 0;
    for (const r of filtered) {
      const ct = (r.category?.type || "").toLowerCase();
      const amt = Number(r.amount) || 0;
      if (ct === "income") income += amt;
      else if (ct === "expense") expenses += amt;
      if (/offering/i.test(r.category?.name || "")) offerings += amt;
    }
    return {
      income,
      expenses,
      net: income - expenses,
      offerings,
      count: filtered.length,
    };
  }, [filtered]);

  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);

  const handleExport = () => {
    exportCsv(
      `dcg-${currentDcg?.name ?? "finances"}-${format(new Date(), "yyyyMMdd")}.csv`,
      filtered.map((r) => ({
        date: r.transaction_date,
        category: r.category?.name ?? "",
        type: r.category?.type ?? "",
        description: r.description ?? "",
        amount: r.amount,
      })),
    );
  };

  // Loading state
  if (dcgLoading) {
    return (
      <DcgAdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading your DCG…</span>
        </div>
      </DcgAdminLayout>
    );
  }

  // No DCG resolved
  if (dcgError || !currentDcg) {
    return (
      <DcgAdminLayout>
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" /> No DCG Access
            </CardTitle>
            <CardDescription>
              We couldn't find an active DCG assigned to your account. Please contact your regional
              administrator to be assigned as a DCG leader.
            </CardDescription>
          </CardHeader>
          {dcgError ? (
            <CardContent>
              <p className="text-xs text-destructive">{(dcgError as Error).message}</p>
            </CardContent>
          ) : null}
        </Card>
      </DcgAdminLayout>
    );
  }

  return (
    <DcgAdminLayout>
      <div className="space-y-6 px-4 py-5 pb-24">
        {/* Header */}
        <div className="rounded-2xl border bg-card p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">DCG Financial Management</h1>
            <p className="text-sm text-muted-foreground">
              Track income, expenses and giving for{" "}
              <span className="font-medium text-foreground">{currentDcg.name}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="1m">Last month</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="ytd">Year to date</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setIncomeOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Record Income
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpenseOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Record Expense
            </Button>
          </div>
        </div>

        {/* Errors */}
        {txError ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive text-base">
                <AlertCircle className="h-4 w-4" /> Failed to load transactions
              </CardTitle>
              <CardDescription>{(txError as Error).message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        ) : null}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="Income" value={fc(summary.income)} icon={ArrowUpRight} tone="positive" />
          <KpiCard label="Expenses" value={fc(summary.expenses)} icon={ArrowDownRight} tone="negative" />
          <KpiCard
            label="Net Balance"
            value={fc(summary.net)}
            icon={Wallet}
            tone={summary.net >= 0 ? "positive" : "negative"}
          />
          <KpiCard label="Offerings" value={fc(summary.offerings)} icon={PiggyBank} tone="neutral" />
          <KpiCard label="Transactions" value={String(summary.count)} icon={ListOrdered} tone="neutral" />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="md:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income only</SelectItem>
              <SelectItem value="expense">Expense only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!filtered.length}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListOrdered className="h-4 w-4 text-primary" /> Transactions
            </CardTitle>
            <CardDescription>
              All income and expense entries for {currentDcg.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <div className="py-12 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading transactions…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {rows.length === 0
                    ? "No transactions recorded yet for this DCG."
                    : "No transactions match the current filters."}
                </p>
                {rows.length === 0 ? (
                  <div className="mt-4 flex justify-center gap-2">
                    <Button size="sm" onClick={() => setIncomeOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Record Income
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setExpenseOpen(true)}>
                      <Plus className="mr-1.5 h-4 w-4" /> Record Expense
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setPeriod("all");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => {
                      const ct = (r.category?.type || "").toLowerCase();
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {format(new Date(r.transaction_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {r.category?.name ?? "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground max-w-[300px] truncate">
                            {r.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={ct === "income" ? "default" : "secondary"} className="capitalize">
                              {r.category?.type ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`text-right whitespace-nowrap font-semibold tabular-nums ${
                              ct === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {ct === "expense" ? "-" : "+"}
                            {fc(Number(r.amount))}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RecordDcgIncomeDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        dcgId={currentDcg.id}
        regionCurrency={regionCurrency}
      />
      <RecordDcgExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        dcgId={currentDcg.id}
        regionCurrency={regionCurrency}
      />
    </DcgAdminLayout>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "positive" | "negative" | "neutral";
}> = ({ label, value, icon: Icon, tone }) => {
  const toneClass =
    tone === "positive"
      ? "text-green-600 bg-green-500/10"
      : tone === "negative"
      ? "text-red-600 bg-red-500/10"
      : "text-primary bg-primary/10";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-1 tabular-nums">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${toneClass}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DcgFinances;
