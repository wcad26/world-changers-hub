import React, { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Target, Users, HeartHandshake, ArrowUpRight, HandCoins } from "lucide-react";
import { format } from "date-fns";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import CreateGlobalCampaignDialog from "./CreateGlobalCampaignDialog";
import GlobalCampaignRowActions from "./GlobalCampaignRowActions";
import RecordDonationDialog from "@/components/admin/regional/finances/RecordDonationDialog";
import { useGlobalFundraisingCampaigns, useCampaignPledges } from "@/hooks/useGlobalFundraising";
import { formatCurrency, formatWithCurrency } from "@/utils/currencyUtils";
import { useFxConverterFor } from "@/hooks/useDisplayCurrency";

interface Props {
  displayCurrency: string;
}

const GlobalCampaignsTab: React.FC<Props> = ({ displayCurrency }) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [showConverted, setShowConverted] = useState(false);
  const { data: campaigns = [], isLoading } = useGlobalFundraisingCampaigns("global");
  const { targetCode, targetCurrency, baseCode, convert } = useFxConverterFor(displayCurrency);

  const campaignIds = useMemo(() => campaigns.map((c) => c.id), [campaigns]);
  const { data: pledgesMap = {} } = useCampaignPledges(campaignIds);

  // Aggregate KPIs in display currency.
  let unconvertedKpi = 0;
  const totalRaised = campaigns.reduce((a, c) => {
    const v = convert(Number(c.raised || 0) / 100, c.currency_code || baseCode);
    if (v == null) { unconvertedKpi += 1; return a; }
    return a + v;
  }, 0);
  const totalGoal = campaigns.reduce((a, c) => {
    const v = convert(Number(c.goal || 0) / 100, c.currency_code || baseCode);
    return a + (v ?? 0);
  }, 0);
  const activeCount = campaigns.filter((c) => c.status === "Active").length;
  const pct = totalGoal > 0 ? Math.min(100, (totalRaised / totalGoal) * 100) : 0;
  const fc = (n: number) => formatWithCurrency(n, targetCurrency);

  const renderAmount = (cents: number, src: string) => {
    const native = formatCurrency(cents / 100, src || "USD");
    if (!showConverted) return native;
    const v = convert(cents / 100, src || baseCode);
    return (
      <div className="flex flex-col items-end">
        <span>{v == null ? <span className="text-amber-600">—</span> : fc(v)}</span>
        {src && src !== targetCode && (
          <span className="text-[10px] text-muted-foreground font-normal">{native}</span>
        )}
      </div>
    );
  };

  // Pledges already in major units, possibly in multiple currencies.
  const renderPledges = (campaignId: string, fallbackSrc: string) => {
    const bucket = pledgesMap[campaignId];
    if (!bucket) return <span className="text-muted-foreground">—</span>;
    const entries = Object.entries(bucket.byCurrency);
    if (entries.length === 0) return <span className="text-muted-foreground">—</span>;

    if (!showConverted) {
      // Show native sums, one per currency.
      return (
        <div className="flex flex-col items-end">
          {entries.map(([code, amt]) => (
            <span key={code} className="tabular-nums">{formatCurrency(amt, code)}</span>
          ))}
        </div>
      );
    }

    let convertedTotal = 0;
    let anyMissing = false;
    for (const [code, amt] of entries) {
      const v = convert(amt, code);
      if (v == null) { anyMissing = true; continue; }
      convertedTotal += v;
    }
    return (
      <div className="flex flex-col items-end">
        <span>{anyMissing && convertedTotal === 0 ? <span className="text-amber-600">—</span> : fc(convertedTotal)}</span>
        {entries.length > 0 && fallbackSrc && (
          <span className="text-[10px] text-muted-foreground font-normal">
            {entries.map(([code, amt]) => formatCurrency(amt, code)).join(" + ")}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Super Admin Fundraising</strong> — campaigns here are owned by the Super Admin (no region attribution).
      </div>

      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border/30 rounded-full px-3 py-1 w-fit">
        Reporting in <span className="font-semibold text-foreground">{targetCode}</span>
        {unconvertedKpi > 0 && <span className="text-amber-600">· {unconvertedKpi} unconverted</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="Total Raised" value={fc(totalRaised)} icon={ArrowUpRight} tone="income" />
        <FinanceKpiCard label="Combined Goal" value={fc(totalGoal)} icon={Target} tone="neutral" />
        <FinanceKpiCard label="Progress" value={`${pct.toFixed(1)}%`} icon={HeartHandshake} tone="warning" />
        <FinanceKpiCard label="Active Campaigns" value={activeCount} icon={Users} tone="info" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Switch id="gc-convert" checked={showConverted} onCheckedChange={setShowConverted} />
          <Label htmlFor="gc-convert" className="text-xs text-muted-foreground cursor-pointer">Show campaigns in {targetCode}</Label>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-primary-foreground">
          <Plus className="mr-2 h-4 w-4" /> Create Campaign
        </Button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Global Campaigns</h3>
        {isLoading ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Loading…</p>
        ) : campaigns.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No global campaigns yet. Create your first one.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Goal</TableHead>
                  <TableHead className="text-right">Pledges</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const p = c.goal > 0 ? Math.min(100, (Number(c.raised) / Number(c.goal)) * 100) : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{renderAmount(Number(c.goal), c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{renderPledges(c.id, c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{renderAmount(Number(c.raised), c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.toFixed(1)}%</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.start_date ? format(new Date(c.start_date), "MMM d, yyyy") : "—"}
                        {c.end_date ? ` – ${format(new Date(c.end_date), "MMM d, yyyy")}` : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <GlobalCampaignRowActions campaign={c} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateGlobalCampaignDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default GlobalCampaignsTab;
