import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Search, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExchangeRates,
  useDeleteExchangeRate,
  useSyncSpotRates,
  type ExchangeRate,
} from "@/hooks/useExchangeRates";
import { useBaseCurrencyCode } from "@/hooks/useSystemSettings";
import { deriveCrossRates } from "@/utils/fx";
import CreatePairDialog from "./CreatePairDialog";
import EditPairDialog from "./EditPairDialog";

export default function ExchangeRatesPanel() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ExchangeRate | null>(null);
  const [syncingPairId, setSyncingPairId] = useState<string | null>(null);

  const { data: rates = [], isLoading } = useExchangeRates();
  const { data: baseCode = "EUR" } = useBaseCurrencyCode();
  const del = useDeleteExchangeRate();
  const syncSpot = useSyncSpotRates();

  const derived = useMemo(() => deriveCrossRates(baseCode, rates), [rates, baseCode]);

  const all = useMemo(() => {
    const directRows = rates.map((r) => ({ ...r, derived: false as const }));
    const derivedRows = derived.map((r) => ({
      ...r,
      id: `${r.base_code}-${r.quote_code}-derived`,
      is_active: true,
      spot_price: r.mid,
      buy_spread_pct: 0,
      sell_spread_pct: 0,
      spread_mode: "percentage" as const,
      last_api_fetch_at: null,
      auto_sync: false,
      derived: true as const,
    }));
    const combined = [...directRows, ...derivedRows];
    const s = search.toLowerCase();
    if (!s) return combined;
    return combined.filter(
      (r) => r.base_code.toLowerCase().includes(s) || r.quote_code.toLowerCase().includes(s)
    );
  }, [rates, derived, search]);

  const handleSyncAll = async () => {
    try {
      const res = await syncSpot.mutateAsync(rates);
      toast.success(
        `Synced live market spot prices and recalculated Buy/Sell rates for ${res.updated} currency pair${
          res.updated === 1 ? "" : "s"
        }.`
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to sync spot rates");
    }
  };

  const handleSyncSingle = async (r: ExchangeRate) => {
    setSyncingPairId(r.id);
    try {
      await syncSpot.mutateAsync([r]);
      toast.success(`Refreshed spot price and Buy/Sell rates for ${r.base_code} → ${r.quote_code}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to sync pair");
    } finally {
      setSyncingPairId(null);
    }
  };

  const handleDelete = async (r: ExchangeRate) => {
    if (!confirm(`Delete ${r.base_code} → ${r.quote_code}?`)) return;
    try {
      await del.mutateAsync(r.id);
      toast.success("Currency pair removed");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete pair");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Exchange Rates & Spread Engine
            </CardTitle>
            <CardDescription>
              Import live market spot prices via API and control both <strong>Bid (Buy)</strong> and{" "}
              <strong>Ask (Sell)</strong> rates using independent Buy Spread (%) and Sell Spread (%). Cross pairs are derived via base currency ({baseCode}).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={syncSpot.isPending || rates.length === 0}
            >
              {syncSpot.isPending && !syncingPairId ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              Sync Spot Rates via API
            </Button>
            <CreatePairDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by currency code (e.g. USD, EUR, XAF, GHS, KES)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead className="text-right">Spot Price</TableHead>
                  <TableHead className="text-right">Buy Spread</TableHead>
                  <TableHead className="text-right">Sell Spread</TableHead>
                  <TableHead className="text-right text-emerald-600 dark:text-emerald-400">
                    Bid (Buy)
                  </TableHead>
                  <TableHead className="text-right text-blue-600 dark:text-blue-400">
                    Ask (Sell)
                  </TableHead>
                  <TableHead className="text-right">Mid</TableHead>
                  <TableHead className="text-right">Total Spread</TableHead>
                  <TableHead>Source / Sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No exchange rates configured yet. Click &ldquo;Add Currency Pair&rdquo; to import a spot rate and set spreads.
                    </TableCell>
                  </TableRow>
                ) : (
                  all.map((r) => {
                    const totalSpread =
                      r.derived || r.spread_mode === "manual"
                        ? r.ask > 0
                          ? ((r.ask - r.bid) / r.ask) * 100
                          : 0
                        : (Number(r.buy_spread_pct) || 0) + (Number(r.sell_spread_pct) || 0);

                    const spotVal = Number(r.spot_price ?? r.mid);

                    return (
                      <TableRow key={r.id} className={r.derived ? "text-muted-foreground bg-muted/20" : ""}>
                        <TableCell className="font-mono font-semibold whitespace-nowrap">
                          {r.base_code} → {r.quote_code}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {spotVal.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-xs">
                          {r.derived
                            ? "—"
                            : r.spread_mode === "manual"
                              ? "Manual"
                              : `-${Number(r.buy_spread_pct || 0).toFixed(2)}%`}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-xs">
                          {r.derived
                            ? "—"
                            : r.spread_mode === "manual"
                              ? "Manual"
                              : `+${Number(r.sell_spread_pct || 0).toFixed(2)}%`}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {Number(r.bid).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                          {Number(r.ask).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {Number(r.mid).toFixed(4)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-xs">
                          {totalSpread.toFixed(2)}%
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.derived ? (
                            <Badge variant="outline">Derived ({baseCode})</Badge>
                          ) : !r.is_active ? (
                            <Badge variant="secondary">Inactive</Badge>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="default" className="w-fit text-[10px] py-0">
                                {r.spread_mode === "manual" ? "Manual" : "API Spot + Spread"}
                              </Badge>
                              {r.last_api_fetch_at && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(new Date(r.last_api_fetch_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {!r.derived && (
                            <div className="flex justify-end gap-1">
                              {r.spread_mode !== "manual" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Refresh live spot price & recalculate"
                                  onClick={() => handleSyncSingle(r as ExchangeRate)}
                                  disabled={syncingPairId === r.id}
                                >
                                  <RefreshCw
                                    className={`h-4 w-4 ${
                                      syncingPairId === r.id ? "animate-spin" : ""
                                    }`}
                                  />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit spot price & spreads"
                                onClick={() => setEditing(r as ExchangeRate)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete pair"
                                onClick={() => handleDelete(r as ExchangeRate)}
                                disabled={del.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {editing && (
        <EditPairDialog
          rate={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </Card>
  );
}
