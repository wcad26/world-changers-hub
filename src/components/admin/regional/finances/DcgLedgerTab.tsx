import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Wallet, Users, Download, ExternalLink, Building2, ListOrdered } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import FinanceKpiCard from "./FinanceKpiCard";
import FinanceFiltersBar from "./FinanceFiltersBar";
import LedgerTrendChart from "./LedgerTrendChart";
import { useRegionalLedger, summarizeLedger, aggregateByDcg } from "@/hooks/useRegionalLedger";
import { useDcgs } from "@/hooks/useDCGs";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import { exportCsv } from "@/utils/csvExport";
import type { PeriodRange } from "./PeriodSelector";

interface Props { range: PeriodRange }

const DcgLedgerTab: React.FC<Props> = ({ range }) => {
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: dcgs = [] } = useDcgs();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [dcgId, setDcgId] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useRegionalLedger({
    scope: "dcg", from: range.from, to: range.to, categoryId, type, dcgId,
  });

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter(r =>
      r.category?.name?.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      r.dcg?.name?.toLowerCase().includes(s) ||
      String(r.amount).includes(s)
    );
  }, [rows, search]);

  const summary = useMemo(() => summarizeLedger(filtered), [filtered]);
  const perDcg = useMemo(() => aggregateByDcg(filtered), [filtered]);
  const activeDcgCount = perDcg.length;
  const fc = (n: number) => formatCurrencyWithSymbol(n, regionCurrency);

  const handleExport = () => {
    exportCsv(`dcg-finances-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      filtered.map(r => ({
        date: r.transaction_date,
        dcg: r.dcg?.name ?? "",
        category: r.category?.name ?? "",
        type: r.category?.type ?? "",
        description: r.description ?? "",
        amount: r.amount,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="DCG Income" value={fc(summary.total_income)} icon={ArrowUpRight} tone="income" />
        <FinanceKpiCard label="DCG Expenses" value={fc(summary.total_expenses)} icon={ArrowDownRight} tone="expense" />
        <FinanceKpiCard label="DCG Net" value={fc(summary.net_balance)} icon={Wallet} tone={summary.net_balance >= 0 ? "income" : "expense"} />
        <FinanceKpiCard label="Active DCGs" value={activeDcgCount} icon={Users} tone="info" hint="With transactions in period" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2 flex-1">
          <Select value={dcgId ?? "all"} onValueChange={(v) => setDcgId(v === "all" ? null : v)}>
            <SelectTrigger className="w-56 h-9 bg-card/60 backdrop-blur-sm border-border/40"><SelectValue placeholder="DCG" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All DCGs</SelectItem>
              {dcgs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <FinanceFiltersBar
            search={search} onSearchChange={setSearch}
            categoryId={categoryId} onCategoryChange={setCategoryId}
            type={type} onTypeChange={setType}
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length} className="bg-card/60 backdrop-blur-sm border-border/40">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <LedgerTrendChart rows={filtered} regionCurrency={regionCurrency} title="DCG Trends" description="All DCG ledgers over the selected period" />

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">Per-DCG Breakdown</h3>
            <p className="text-xs text-muted-foreground">Totals by Deeper Christian Group for the selected period</p>
          </div>
        </div>
        {perDcg.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">No DCG transactions in this period.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>DCG</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Tx</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perDcg.map(d => (
                  <TableRow key={d.dcg_id} className="border-border/20 hover:bg-muted/30">
                    <TableCell className="font-medium">{d.dcg_name}</TableCell>
                    <TableCell className="text-right text-green-600 tabular-nums">{fc(d.income)}</TableCell>
                    <TableCell className="text-right text-red-600 tabular-nums">{fc(d.expenses)}</TableCell>
                    <TableCell className={`text-right font-semibold tabular-nums ${d.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fc(d.net)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{d.count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/regional/dcg/${d.dcg_id}`}><ExternalLink className="h-4 w-4 mr-1" />Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListOrdered className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-base font-semibold text-foreground">DCG Transactions</h3>
            <p className="text-xs text-muted-foreground">Itemized DCG-level ledger entries</p>
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
                  <TableHead>DCG</TableHead>
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
                    <TableCell className="font-medium">{r.dcg?.name || "—"}</TableCell>
                    <TableCell>{r.category?.name}</TableCell>
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
    </div>
  );
};

export default DcgLedgerTab;
