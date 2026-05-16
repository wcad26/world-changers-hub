import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Wallet, Users, Download, ExternalLink } from "lucide-react";
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
            <SelectTrigger className="w-56"><SelectValue placeholder="DCG" /></SelectTrigger>
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
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <LedgerTrendChart rows={filtered} regionCurrency={regionCurrency} title="DCG Trends" description="All DCG ledgers over the selected period" />

      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Per-DCG Breakdown</CardTitle>
          <CardDescription>Totals by Deeper Christian Group for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {perDcg.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No DCG transactions in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={d.dcg_id}>
                      <TableCell className="font-medium">{d.dcg_name}</TableCell>
                      <TableCell className="text-right text-green-600">{fc(d.income)}</TableCell>
                      <TableCell className="text-right text-red-600">{fc(d.expenses)}</TableCell>
                      <TableCell className={`text-right font-semibold ${d.net >= 0 ? "text-green-600" : "text-red-600"}`}>{fc(d.net)}</TableCell>
                      <TableCell className="text-right">{d.count}</TableCell>
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
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>DCG Transactions</CardTitle>
          <CardDescription>Itemized DCG-level ledger entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No transactions for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(r.transaction_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{r.dcg?.name || "—"}</TableCell>
                      <TableCell>{r.category?.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.description || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.category?.type?.toLowerCase() === "income" ? "default" : "secondary"}>
                          {r.category?.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">{fc(Number(r.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DcgLedgerTab;
