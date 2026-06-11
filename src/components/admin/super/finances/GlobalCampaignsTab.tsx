import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Target, Users, HeartHandshake, ArrowUpRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import FinanceKpiCard from "@/components/admin/regional/finances/FinanceKpiCard";
import CreateGlobalCampaignDialog from "./CreateGlobalCampaignDialog";
import { useGlobalFundraisingCampaigns, useDeleteGlobalCampaign } from "@/hooks/useGlobalFundraising";
import { formatCurrency } from "@/utils/currencyUtils";
import { useToast } from "@/hooks/use-toast";

const GlobalCampaignsTab: React.FC = () => {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: campaigns = [], isLoading } = useGlobalFundraisingCampaigns("global");
  const del = useDeleteGlobalCampaign();

  const totalRaised = campaigns.reduce((a, c) => a + Number(c.raised || 0), 0) / 100;
  const totalGoal = campaigns.reduce((a, c) => a + Number(c.goal || 0), 0) / 100;
  const activeCount = campaigns.filter((c) => c.status === "Active").length;
  const pct = totalGoal > 0 ? Math.min(100, (totalRaised / totalGoal) * 100) : 0;
  const fc = (n: number) => formatCurrency(n, "USD");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this global campaign? All linked donations will also be removed.")) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Campaign deleted" });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Super Admin Fundraising</strong> — campaigns here are owned by the Super Admin (no region attribution).
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FinanceKpiCard label="Total Raised" value={fc(totalRaised)} icon={ArrowUpRight} tone="income" />
        <FinanceKpiCard label="Combined Goal" value={fc(totalGoal)} icon={Target} tone="neutral" />
        <FinanceKpiCard label="Progress" value={`${pct.toFixed(1)}%`} icon={HeartHandshake} tone="warning" />
        <FinanceKpiCard label="Active Campaigns" value={activeCount} icon={Users} tone="info" />
      </div>

      <div className="flex justify-end">
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
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(c.goal) / 100, c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(c.raised) / 100, c.currency_code || "USD")}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.toFixed(1)}%</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.start_date ? format(new Date(c.start_date), "MMM d, yyyy") : "—"}
                        {c.end_date ? ` – ${format(new Date(c.end_date), "MMM d, yyyy")}` : ""}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
