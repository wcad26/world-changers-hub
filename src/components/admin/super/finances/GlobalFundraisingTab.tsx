import React, { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Target, Users, HeartHandshake, Download } from "lucide-react";
import { format } from "date-fns";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import { useGlobalFundraisingCampaigns, useGlobalDonations } from "@/hooks/useGlobalFundraising";
import { formatCurrency } from "@/utils/currencyUtils";
import { exportCsv } from "@/utils/csvExport";
import type { PeriodRange } from "@/components/admin/regional/finances/PeriodSelector";

interface Props {
  range: PeriodRange;
  regionFilter: string;
}

const GlobalFundraisingTab: React.FC<Props> = ({ range, regionFilter }) => {
  const { data: campaigns = [] } = useGlobalFundraisingCampaigns(regionFilter);
  const { data: donations = [] } = useGlobalDonations(range.from, range.to, regionFilter);

  const overlapping = useMemo(() => {
    const fromMs = range.from.getTime();
    const toMs = range.to.getTime();
    return campaigns.filter((c) => {
      const startMs = c.start_date ? new Date(c.start_date).getTime() : -Infinity;
      const endMs = c.end_date ? new Date(c.end_date).getTime() : Infinity;
      return startMs <= toMs && endMs >= fromMs;
    });
  }, [campaigns, range]);

  const totalRaised = donations.reduce((a: number, d: any) => a + Number(d.amount || 0), 0) / 100;
  const totalGoal = overlapping.reduce((a, c) => a + Number(c.goal || 0), 0) / 100;
  const activeCount = overlapping.filter((c) => c.status === "Active").length;
  const completionPct = totalGoal > 0 ? Math.min(100, (totalRaised / totalGoal) * 100) : 0;
  const fc = (n: number) => formatCurrency(n, "USD");

  const handleExport = () => {
    exportCsv(
      `global-fundraising-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`,
      campaigns.map((c) => ({
        region: c.region?.name ?? (c.region_id ? "" : "Global"),
        name: c.name,
        status: c.status,
        goal: Number(c.goal) / 100,
        raised: Number(c.raised) / 100,
        start_date: c.start_date,
        end_date: c.end_date,
        currency: c.currency_code,
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="Total Raised" value={fc(totalRaised)} icon={ArrowUpRight} tone="income" hint="In selected period" />
        <FinanceKpiCard label="Combined Goal" value={fc(totalGoal)} icon={Target} tone="neutral" />
        <FinanceKpiCard label="Goal Progress" value={`${completionPct.toFixed(1)}%`} icon={HeartHandshake} tone="warning" />
        <FinanceKpiCard label="Active Campaigns" value={activeCount} icon={Users} tone="info" />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!campaigns.length} className="bg-card/60 backdrop-blur-sm border-border/40">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Campaigns</h3>
        {campaigns.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">No campaigns in this scope.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Goal</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead>Dates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const pct = c.goal > 0 ? Math.min(100, (Number(c.raised) / Number(c.goal)) * 100) : 0;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell>{c.region?.name ?? (c.region_id ? "—" : "Global")}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "Active" ? "default" : "secondary"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(c.goal) / 100, c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(c.raised) / 100, c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{pct.toFixed(1)}%</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.start_date ? format(new Date(c.start_date), "MMM d, yyyy") : "—"}
                        {c.end_date ? ` – ${format(new Date(c.end_date), "MMM d, yyyy")}` : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Donations in Period</h3>
        {donations.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">No donations in this period.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{format(new Date(d.donation_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{d.campaign?.name ?? "—"}</TableCell>
                    <TableCell>{d.anonymous ? "Anonymous" : d.donor_name || "—"}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(Number(d.amount) / 100, d.currency_code || "USD")}</TableCell>
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

export default GlobalFundraisingTab;
