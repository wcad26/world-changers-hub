import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, DollarSign, TrendingUp, Download, ListOrdered, ChevronDown, Building2 } from "lucide-react";
import { format } from "date-fns";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import FinanceFiltersBar from "@/components/admin/regional/finances/FinanceFiltersBar";
import LedgerTrendChart from "@/components/admin/regional/finances/LedgerTrendChart";
import { useGlobalLedger, aggregateByRegion } from "@/hooks/useGlobalLedger";
import { summarizeLedger } from "@/hooks/useRegionalLedger";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useFxConverterFor } from "@/hooks/useDisplayCurrency";
import { exportCsv } from "@/utils/csvExport";
import type { PeriodRange } from "@/components/admin/regional/finances/PeriodSelector";

interface Props {
  range: PeriodRange;
  regionFilter: string;
  displayCurrency: string;
}

const GlobalLedgerTab: React.FC<Props> = ({ range, regionFilter, displayCurrency }) => {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [txOpen, setTxOpen] = useState(false);

  const { data: rows = [], isLoading } = useGlobalLedger({
    scope: "regional",
    from: range.from,
    to: range.to,
    regionFilter,
    categoryId,
    type,
  });

  const { targetCode, targetCurrency, baseCode, convert } = useFxConverterFor(displayCurrency);

  const convertedRows = useMemo(() => {
    return rows.map((r) => {
      const src = r.currency_code || r.region?.currency_code || baseCode;
      const v = convert(Number(r.amount) || 0, src);
      return {
        ...r,
        _originalAmount: Number(r.amount) || 0,
        _sourceCurrency: src,
        amount: v ?? 0,
        _unconverted: v == null,
      } as typeof r & { _originalAmount: number; _sourceCurrency: string; _unconverted: boolean };
    });
  }, [rows, convert, baseCode]);

  const filtered = useMemo(() => {
    if (!search) return convertedRows;
    const s = search.toLowerCase();
    return convertedRows.filter(
      (r) =>
        r.category?.name?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s) ||
        r.region?.name?.toLowerCase().includes(s) ||
        String(r.amount).includes(s)
    );
  }, [convertedRows, search]);

  const summary = useMemo(() => summarizeLedger(filtered), [filtered]);
  const perRegion = useMemo(() => aggregateByRegion(filtered as any), [filtered]);
  const unconvertedCount = useMemo(() => filtered.filter((r: any) => r._unconverted).length, [filtered]);

  const fc = (n: number) => formatWithCurrency(n, targetCurrency);

  const handleExport = () => {
    exportCsv(
      `global-finances-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      filtered.map((r) => ({
        date: r.transaction_date,
        region: r.region?.name ?? (r.region_id ? "" : "Global"),
        category: r.category?.name ?? "",
        type: r.category?.type ?? "",
        description: r.description ?? "",
        amount: r.amount,
        currency: targetCode,
        original_amount: (r as any)._originalAmount,
        original_currency: (r as any)._sourceCurrency,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/30 rounded-full px-3 py-1">
          Reporting in <span className="font-semibold text-foreground">{targetCode}</span>
          {targetCurrency?.symbol ? <span className="text-muted-foreground">({targetCurrency.symbol})</span> : null}
          {unconvertedCount > 0 && (
            <span className="text-amber-600">· {unconvertedCount} unconverted (no FX path)</span>
          )}
        </div>
      </div>
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
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          type={type}
          onTypeChange={setType}
        />
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length} className="bg-card/60 backdrop-blur-sm border-border/40">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <LedgerTrendChart rows={filtered as any} description={`Aggregated regional ledger (in ${targetCode})`} />

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">Per-Region Breakdown</h3>
            <p className="text-xs text-muted-foreground">Income, expenses, and net per region for the selected period</p>
          </div>
        </div>
        {perRegion.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">No transactions in this period.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perRegion.map((r) => (
                  <TableRow key={r.region_id ?? "global"} className="border-border/20 hover:bg-muted/30">
                    <TableCell className="font-medium">{r.region_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                    <TableCell className="text-right text-green-600 tabular-nums">{fc(r.income)}</TableCell>
                    <TableCell className="text-right text-red-600 tabular-nums">{fc(r.expenses)}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${r.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fc(r.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Collapsible open={txOpen} onOpenChange={setTxOpen} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 group">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary" />
            <div className="text-left">
              <h3 className="text-base font-semibold text-foreground">Transactions</h3>
              <p className="text-xs text-muted-foreground">All regional-level transactions in the selected scope</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${txOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
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
                    <TableHead>Region</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id} className="border-border/20 hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-muted-foreground">{format(new Date(r.transaction_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{r.region?.name ?? (r.region_id ? "—" : "Global")}</TableCell>
                      <TableCell>{r.category?.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.category?.type?.toLowerCase() === "income" ? "default" : "secondary"} className="capitalize">
                          {r.category?.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums">
                        {r._unconverted ? (
                          <span className="text-amber-600" title="No FX path defined">—</span>
                        ) : (
                          fc(Number(r.amount))
                        )}
                        {r._sourceCurrency && r._sourceCurrency !== targetCode && (
                          <div className="text-[10px] text-muted-foreground font-normal">
                            {r._sourceCurrency} {r._originalAmount.toLocaleString()}
                          </div>
                        )}
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
  );
};

export default GlobalLedgerTab;
