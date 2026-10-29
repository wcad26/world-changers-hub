import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Loader2, Plus, RefreshCw, Sliders, Sparkles } from "lucide-react";
import { useCurrencies } from "@/hooks/useCurrencies";
import { useCreateExchangeRate } from "@/hooks/useExchangeRates";
import { computeRatesFromSpotAndSpreads, fetchLiveSpotPrice } from "@/utils/fx";
import { cn } from "@/lib/utils";

const SPREAD_PRESETS = [0, 0.5, 1.0, 1.5, 2.0, 3.0, 5.0];

export default function CreatePairDialog() {
  const [open, setOpen] = useState(false);
  const { data: currencies = [] } = useCurrencies();
  const create = useCreateExchangeRate();

  const [baseCode, setBaseCode] = useState("USD");
  const [quoteCode, setQuoteCode] = useState("XAF");
  const [spreadMode, setSpreadMode] = useState<"percentage" | "manual">("percentage");
  const [spotPrice, setSpotPrice] = useState<string>("605");
  const [buySpreadPct, setBuySpreadPct] = useState<string>("1.5");
  const [sellSpreadPct, setSellSpreadPct] = useState<string>("2.0");
  const [manualBid, setManualBid] = useState<string>("595.925");
  const [manualAsk, setManualAsk] = useState<string>("617.10");
  const [autoSync, setAutoSync] = useState(true);
  const [fetchingSpot, setFetchingSpot] = useState(false);
  const [spotSource, setSpotSource] = useState<string | null>(null);

  const calc = useMemo(
    () =>
      computeRatesFromSpotAndSpreads(
        Number(spotPrice) || 0,
        Number(buySpreadPct) || 0,
        Number(sellSpreadPct) || 0
      ),
    [spotPrice, buySpreadPct, sellSpreadPct]
  );

  const handleFetchSpot = async (b = baseCode, q = quoteCode, silent = false) => {
    if (!b || !q || b === q) return;
    setFetchingSpot(true);
    try {
      const res = await fetchLiveSpotPrice(b, q);
      setSpotPrice(String(res.spot));
      setSpotSource(res.source);
      const next = computeRatesFromSpotAndSpreads(
        res.spot,
        Number(buySpreadPct) || 0,
        Number(sellSpreadPct) || 0
      );
      setManualBid(String(next.bid));
      setManualAsk(String(next.ask));
      if (!silent) {
        toast.success(`Imported live spot: 1 ${b} = ${res.spot} ${q} (${res.source})`);
      }
    } catch (e: any) {
      if (!silent) toast.error(e.message || "Could not fetch spot rate");
    } finally {
      setFetchingSpot(false);
    }
  };

  useEffect(() => {
    if (open && baseCode && quoteCode && baseCode !== quoteCode) {
      handleFetchSpot(baseCode, quoteCode, true);
    }
  }, [open, baseCode, quoteCode]);

  const effectiveBid = spreadMode === "percentage" ? calc.bid : Number(manualBid) || 0;
  const effectiveAsk = spreadMode === "percentage" ? calc.ask : Number(manualAsk) || 0;
  const effectiveMid = (effectiveBid + effectiveAsk) / 2;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseCode || !quoteCode || baseCode === quoteCode) {
      toast.error("Base and Quote currencies must be different.");
      return;
    }
    if (effectiveBid <= 0 || effectiveAsk <= 0) {
      toast.error("Bid and Ask rates must be greater than zero.");
      return;
    }
    if (effectiveAsk < effectiveBid) {
      toast.error("Ask (Sell) rate must be greater than or equal to Bid (Buy) rate.");
      return;
    }

    try {
      await create.mutateAsync({
        base_code: baseCode,
        quote_code: quoteCode,
        spot_price: Number(spotPrice) || effectiveMid,
        buy_spread_pct: spreadMode === "percentage" ? Number(buySpreadPct) || 0 : 0,
        sell_spread_pct: spreadMode === "percentage" ? Number(sellSpreadPct) || 0 : 0,
        spread_mode: spreadMode,
        bid: effectiveBid,
        ask: effectiveAsk,
        auto_sync: spreadMode === "percentage" ? autoSync : false,
        last_api_fetch_at: new Date().toISOString(),
      });
      toast.success(`Added ${baseCode} → ${quoteCode} exchange rate`);
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create exchange rate pair");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Currency Pair
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exchange Rate Pair</DialogTitle>
          <DialogDescription>
            Import the live market spot rate via API and configure your Buy Spread and Sell Spread to automatically determine Bid and Ask rates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* 1. Base & Quote Selector */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-1.5">
              <Label>Base Currency (1 Unit)</Label>
              <Select value={baseCode} onValueChange={setBaseCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pb-2.5 text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <Label>Quote Currency</Label>
              <Select value={quoteCode} onValueChange={setQuoteCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Quote" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 2. Spot Price + Live API Import */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Market Spot Price ({baseCode} → {quoteCode})
                </Label>
                <p className="text-xs text-muted-foreground">
                  1 {baseCode} = Spot {quoteCode} {spotSource ? `· Source: ${spotSource}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFetchSpot(baseCode, quoteCode, false)}
                disabled={fetchingSpot || baseCode === quoteCode}
                className="h-8 text-xs"
              >
                {fetchingSpot ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                )}
                Fetch Live Spot via API
              </Button>
            </div>
            <Input
              type="number"
              step="any"
              value={spotPrice}
              onChange={(e) => setSpotPrice(e.target.value)}
              className="bg-background font-mono text-base font-semibold"
              placeholder="e.g. 605.00"
            />
          </div>

          {/* 3. Mode Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5 bg-muted/30">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-semibold">Pricing Calculation Mode</p>
                <p className="text-[11px] text-muted-foreground">
                  {spreadMode === "percentage"
                    ? "Buy & Sell rates are calculated automatically from Spot Price ± Spreads"
                    : "Manual override of raw Bid and Ask figures"}
                </p>
              </div>
            </div>
            <div className="flex rounded-lg border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setSpreadMode("percentage")}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-colors",
                  spreadMode === "percentage"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                Spot + Spreads
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualBid(String(calc.bid));
                  setManualAsk(String(calc.ask));
                  setSpreadMode("manual");
                }}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-colors",
                  spreadMode === "manual"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                Manual
              </button>
            </div>
          </div>

          {/* 4. Dual Spread Controls OR Manual Override */}
          {spreadMode === "percentage" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-border p-3.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Buy Spread (%)
                  </Label>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    -{Number(buySpreadPct || 0).toFixed(2)}% below spot
                  </Badge>
                </div>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="50"
                  value={buySpreadPct}
                  onChange={(e) => setBuySpreadPct(e.target.value)}
                  className="font-mono"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {SPREAD_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBuySpreadPct(String(p))}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-mono transition-colors",
                        Number(buySpreadPct) === p
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border p-3.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Sell Spread (%)
                  </Label>
                  <Badge variant="outline" className="font-mono text-[11px]">
                    +{Number(sellSpreadPct || 0).toFixed(2)}% above spot
                  </Badge>
                </div>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="50"
                  value={sellSpreadPct}
                  onChange={(e) => setSellSpreadPct(e.target.value)}
                  className="font-mono"
                />
                <div className="flex flex-wrap gap-1 pt-1">
                  {SPREAD_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSellSpreadPct(String(p))}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-mono transition-colors",
                        Number(sellSpreadPct) === p
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bid Rate (Buy)</Label>
                <Input
                  type="number"
                  step="any"
                  value={manualBid}
                  onChange={(e) => setManualBid(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ask Rate (Sell)</Label>
                <Input
                  type="number"
                  step="any"
                  value={manualAsk}
                  onChange={(e) => setManualAsk(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* 5. Real-Time Computed Preview Card */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Computed Exchange Rates</span>
              <span className="font-mono">
                Total Spread: {calc.totalSpreadPct.toFixed(2)}% ({calc.effectiveSpreadAmount} {quoteCode})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Bid (Buy Rate)
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                  {effectiveBid.toFixed(4)}
                </p>
                <p className="text-[10px] text-muted-foreground">1 {baseCode} → {quoteCode}</p>
              </div>
              <div className="rounded-lg bg-muted/60 border border-border p-2.5">
                <p className="text-[11px] font-medium text-muted-foreground">Mid (Reporting)</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                  {effectiveMid.toFixed(4)}
                </p>
                <p className="text-[10px] text-muted-foreground"> Reference Midpoint</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5">
                <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                  Ask (Sell Rate)
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold text-foreground">
                  {effectiveAsk.toFixed(4)}
                </p>
                <p className="text-[10px] text-muted-foreground">1 {baseCode} → {quoteCode}</p>
              </div>
            </div>
          </div>

          {spreadMode === "percentage" && (
            <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-medium">Include in 1-Click Spot Sync</p>
                <p className="text-xs text-muted-foreground">
                  Automatically refresh spot price and recalculate Bid/Ask when syncing live market rates.
                </p>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Save Exchange Rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
