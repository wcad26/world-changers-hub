import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowUpRight, ArrowDownRight, Wallet, Users, Download, ListOrdered, ChevronDown, Building2 } from "lucide-react";
import { format } from "date-fns";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import FinanceFiltersBar from "@/components/admin/regional/finances/FinanceFiltersBar";
import LedgerTrendChart from "@/components/admin/regional/finances/LedgerTrendChart";
import { useGlobalLedger, aggregateByRegion } from "@/hooks/useGlobalLedger";
import { summarizeLedger, aggregateByDcg } from "@/hooks/useRegionalLedger";
import { formatWithCurrency } from "@/utils/currencyUtils";
import { useFxConverterFor } from "@/hooks/useDisplayCurrency";
import { exportCsv } from "@/utils/csvExport";
import type { PeriodRange } from "@/components/admin/regional/finances/PeriodSelector";

interface Props {
  range: PeriodRange;
  regionFilter: string;
  displayCurrency: string;
}

const GlobalDcgLedgerTab: React.FC<Props> = ({ range, regionFilter, displayCurrency }) => {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [txOpen, setTxOpen] = useState(false);

  const { data: rows = [], isLoading } = useGlobalLedger({
    scope: "dcg",
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
      };
    });
  }, [rows, convert, baseCode]);

  const filtered = useMemo(() => {
    if (!search) return convertedRows;
    const s = search.toLowerCase();
    return convertedRows.filter(
      (r) =>
        r.category?.name?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s) ||
        r.dcg?.name?.toLowerCase().includes(s) ||
        r.region?.name?.toLowerCase().includes(s)
    );
  }, [convertedRows, search]);

  const summary = useMemo(() => summarizeLedger(filtered), [filtered]);
  const perDcg = useMemo(() => aggregateByDcg(filtered as any), [filtered]);
  const perRegion = useMemo(() => aggregateByRegion(filtered as any), [filtered]);
  const unconvertedCount = useMemo(() => filtered.filter((r: any) => r._unconverted).length, [filtered]);

  const fc = (n: number) => formatWithCurrency(n, targetCurrency);

  const handleExport = () => {
    exportCsv(
      `global-dcg-finances-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      filtered.map((r) => ({
        date: r.transaction_date,
        region: r.region?.name ?? "",
        dcg: r.dcg?.name ?? "",
        category: r.category?.name ?? "",
        type: r.category?.type ?? "",
        description: r.description ?? "",
        amount: r.amount,
        currency: targetCode,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/30 rounded-full px-3 py-1 w-fit">
        Reporting in <span className="font-semibold text-foreground">{targetCode}</span>
        {unconvertedCount > 0 && <span className="text-amber-600">· {unconvertedCount} unconverted</span>}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="DCG Income" value={fc(summary.total_income)} icon={ArrowUpRight} tone="income" />
        <FinanceKpiCard label="DCG Expenses" value={fc(summary.total_expenses)} icon={ArrowDownRight} tone="expense" />
        <FinanceKpiCard label="DCG Net" value={fc(summary.net_balance)} icon={Wallet} tone={summary.net_balance >= 0 ? "income" : "expense"} />
        <FinanceKpiCard label="Active DCGs" value={perDcg.length} icon={Users} tone="info" hint="With transactions" />
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

      <LedgerTrendChart rows={filtered as any} title="DCG Trends" description={`All DCG ledgers in the selected scope (in ${targetCode})`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">By Region</h3>
          </div>
          {perRegion.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No data.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perRegion.map((r) => (
                  <TableRow key={r.region_id ?? "global"}>
                    <TableCell className="font-medium">{r.region_name}</TableCell>
                    <TableCell className="text-right text-green-600 tabular-nums">{fc(r.income)}</TableCell>
                    <TableCell className="text-right text-red-600 tabular-nums">{fc(r.expenses)}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${r.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fc(r.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">By DCG</h3>
          </div>
          {perDcg.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">No DCG transactions.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>DCG</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perDcg.map((d) => (
                  <TableRow key={d.dcg_id}>
                    <TableCell className="font-medium">{d.dcg_name}</TableCell>
                    <TableCell className="text-right text-green-600 tabular-nums">{fc(d.income)}</TableCell>
                    <TableCell className="text-right text-red-600 tabular-nums">{fc(d.expenses)}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${d.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fc(d.net)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Collapsible open={txOpen} onOpenChange={setTxOpen} className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 group">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-primary" />
            <div className="text-left">
              <h3 className="text-base font-semibold text-foreground">DCG Transactions</h3>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${txOpen ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">No transactions.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>DCG</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{format(new Date(r.transaction_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{r.region?.name ?? "—"}</TableCell>
                      <TableCell className="font-medium">{r.dcg?.name || "—"}</TableCell>
                      <TableCell>{r.category?.name}</TableCell>
                      <TableCell>
                        <Badge variant={r.category?.type?.toLowerCase() === "income" ? "default" : "secondary"} className="capitalize">
                          {r.category?.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {r._unconverted ? <span className="text-amber-600">—</span> : fc(Number(r.amount))}
                        {r._sourceCurrency && r._sourceCurrency !== targetCode && (
                          <div className="text-[10px] text-muted-foreground font-normal">{r._sourceCurrency} {r._originalAmount.toLocaleString()}</div>
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

export default GlobalDcgLedgerTab;
