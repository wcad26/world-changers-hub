import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, ChevronDown, Clock, Coins, HandCoins, MoreHorizontal, Receipt, Target, Undo2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export interface RegContribution {
  id: string;
  event_name: string;
  name: string;
  created_at: string;
  category: string | null;
  fee: number; // major units, 0 if not billed on this row
  fee_status: string;
  pledge: number; // major units
  group_id: string | null;
  fee_is_group: boolean;
}

export function useCampaignContributions(campaignId?: string) {
  return useQuery({
    queryKey: ["campaign-contributions", campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data: events, error: e1 } = await supabase
        .from("events")
        .select("id, name")
        .eq("linked_fundraising_campaign_id", campaignId!);
      if (e1) throw e1;
      const ids = (events || []).map((e: any) => e.id);
      const [{ data: regs, error: e2 }, { data: pledges, error: e3 }] = await Promise.all([
        ids.length
          ? supabase
              .from("event_pre_registrations")
              .select("id, event_id, member_id, group_id, is_primary, created_at, registration_fee_category, registration_fee_amount, fee_status, fee_is_group, pledge_amount, pledge_status, email, phone")
              .in("event_id", ids)
          : Promise.resolve({ data: [], error: null } as any),
        supabase.from("fundraising_pledges").select("id, amount, status, created_at").eq("campaign_id", campaignId!),
      ]);
      if (e2) throw e2;
      if (e3) throw e3;
      const memberIds: string[] = Array.from(new Set<string>((regs || []).map((r: any) => r.member_id).filter(Boolean)));
      const names = new Map<string, string>();
      for (let i = 0; i < memberIds.length; i += 200) {
        const { data } = await supabase
          .from("members")
          .select("id, profiles(first_name, last_name)")
          .in("id", memberIds.slice(i, i + 200));
        (data || []).forEach((m: any) => {
          const p = m.profiles;
          names.set(m.id, [p?.last_name, p?.first_name].filter(Boolean).join(" ") || "—");
        });
      }
      const evName = new Map((events || []).map((e: any) => [e.id, e.name]));
      const rows: RegContribution[] = (regs || []).map((r: any) => {
        const billed = r.registration_fee_amount != null && (!r.fee_is_group || r.is_primary);
        return {
          id: r.id,
          event_name: evName.get(r.event_id) || "—",
          name: (r.member_id && names.get(r.member_id)) || r.email || r.phone || "—",
          created_at: r.created_at,
          category: r.registration_fee_category,
          // registration_fee_amount is stored in minor units
          fee: billed ? Number(r.registration_fee_amount) / 100 : 0,
          fee_status: r.fee_status || "unpaid",
          // pledge_amount is stored in MAJOR units
          pledge: r.pledge_status === "cancelled" ? 0 : Number(r.pledge_amount || 0),
          group_id: r.group_id ?? null,
          fee_is_group: !!r.fee_is_group,
        };
      });
      const campaignPledges = (pledges || [])
        .filter((p: any) => p.status === "active")
        .map((p: any) => ({ amount: Number(p.amount || 0), created_at: p.created_at }));
      return { rows, campaignPledges };
    },
  });
}

const inRange = (d: string, r: { from: Date; to: Date }) => {
  const t = new Date(d).getTime();
  return t >= r.from.getTime() && t <= r.to.getTime();
};

interface Props {
  campaignId: string;
  donationsTotal: number; // major units, already filtered by period
  goal: number;
  range: { from: Date; to: Date };
  fc: (n: number) => string;
}

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string; sub?: string; tone: string }> = ({ icon, label, value, sub, tone }) => (
  <div className="rounded-2xl border border-border/40 bg-card/60 p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `color-mix(in oklab, var(${tone}) 18%, transparent)`, color: `var(${tone})` }}>{icon}</span>
    </div>
    <div className="font-semibold tabular-nums text-foreground text-lg">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </div>
);

const CampaignContributionsPanel: React.FC<Props> = ({ campaignId, donationsTotal, goal, range, fc }) => {
  const { data, isLoading } = useCampaignContributions(campaignId);
  const [q, setQ] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const setFeeStatus = useMutation({
    mutationFn: async ({ row, status }: { row: RegContribution; status: "paid" | "unpaid" | "waived" }) => {
      let qy = supabase.from("event_pre_registrations").update({ fee_status: status });
      // family / group billing: keep every member of the group in the same state
      qy = row.fee_is_group && row.group_id ? qy.eq("group_id", row.group_id) : qy.eq("id", row.id);
      const { error } = await qy;
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast({
        title: status === "paid" ? "Payment confirmed" : status === "waived" ? "Fee waived" : "Marked as awaiting cash",
      });
      qc.invalidateQueries({ queryKey: ["campaign-contributions"] });
      qc.invalidateQueries({ queryKey: ["campaign_pledges"] });
      qc.invalidateQueries({ queryKey: ["campaign_pledges_detailed"] });
      qc.invalidateQueries({ queryKey: ["campaign_donations"] });
      qc.invalidateQueries({ queryKey: ["fundraising_campaign"] });
      qc.invalidateQueries({ queryKey: ["fundraising_campaigns"] });
      qc.invalidateQueries({ queryKey: ["fundraising_analytics"] });
      qc.invalidateQueries({ queryKey: ["global_fundraising_campaigns"] });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });


  const s = useMemo(() => {
    const rows = (data?.rows || []).filter((r) => inRange(r.created_at, range));
    const cps = (data?.campaignPledges || []).filter((p) => inRange(p.created_at, range));
    const feesPaid = rows.filter((r) => r.fee_status === "paid").reduce((a, r) => a + r.fee, 0);
    const feesUnpaid = rows.filter((r) => r.fee_status === "unpaid").reduce((a, r) => a + r.fee, 0);
    const feesWaived = rows.filter((r) => r.fee_status === "waived").reduce((a, r) => a + r.fee, 0);
    const regPledges = rows.reduce((a, r) => a + r.pledge, 0);
    const campPledges = cps.reduce((a, p) => a + p.amount, 0);
    const collected = donationsTotal + feesPaid;
    const pending = feesUnpaid + regPledges + campPledges;
    const total = collected + pending;
    return {
      rows, feesPaid, feesUnpaid, feesWaived, regPledges, campPledges, collected, pending, total,
      feeCount: rows.filter((r) => r.fee > 0).length,
      pledgeCount: rows.filter((r) => r.pledge > 0).length,
      cpCount: cps.length,
      pctCollected: goal > 0 ? (collected / goal) * 100 : 0,
      pctPending: goal > 0 ? (pending / goal) * 100 : 0,
    };
  }, [data, range, donationsTotal, goal]);

  const list = s.rows
    .filter((r) => r.fee > 0 || r.pledge > 0)
    .filter((r) => !q || `${r.name} ${r.event_name}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const pc = Math.min(100, s.pctCollected);
  const pp = Math.min(100 - pc, s.pctPending);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Wallet className="h-4 w-4" />} tone="--chart-5" label="Collected" value={fc(s.collected)} sub="Donations + paid fees" />
        <Stat icon={<Clock className="h-4 w-4" />} tone="--chart-3" label="Awaiting cash" value={fc(s.pending)} sub="Unpaid fees + pledges" />
        <Stat icon={<Coins className="h-4 w-4" />} tone="--chart-6" label="Total committed" value={fc(s.total)} sub={goal > 0 ? `${((s.total / goal) * 100).toFixed(1)}% of goal` : "No goal set"} />
        <Stat icon={<Target className="h-4 w-4" />} tone="--chart-1" label="Still needed" value={fc(Math.max(0, goal - s.total))} sub={`Goal ${fc(goal)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base font-semibold">Goal progress</h3>
            <span className="text-sm tabular-nums text-muted-foreground">{fc(s.total)} / {fc(goal)}</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            <div style={{ width: `${pc}%`, background: "var(--chart-5)" }} />
            <div style={{ width: `${pp}%`, background: "color-mix(in oklab, var(--chart-3) 70%, transparent)" }} />
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-5)" }} />Collected {fc(s.collected)} ({s.pctCollected.toFixed(1)}%)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--chart-3)" }} />Awaiting cash {fc(s.pending)} ({s.pctPending.toFixed(1)}%)</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 space-y-3">
          <h3 className="text-base font-semibold">Contribution breakdown</h3>
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="flex items-center gap-2"><HandCoins className="h-4 w-4" style={{ color: "var(--chart-5)" }} />Direct donations</span><span className="tabular-nums">{fc(donationsTotal)}</span></li>
              <li className="flex justify-between"><span className="flex items-center gap-2"><Receipt className="h-4 w-4" style={{ color: "var(--chart-3)" }} />Registration fees ({s.feeCount})</span><span className="tabular-nums">{fc(s.feesPaid + s.feesUnpaid)}</span></li>
              <li className="flex justify-between pl-6 text-xs text-muted-foreground"><span>Paid</span><span className="tabular-nums">{fc(s.feesPaid)}</span></li>
              <li className="flex justify-between pl-6 text-xs text-muted-foreground"><span>Awaiting cash</span><span className="tabular-nums">{fc(s.feesUnpaid)}</span></li>
              <li className="flex justify-between pl-6 text-xs text-muted-foreground"><span>Waived (not counted)</span><span className="tabular-nums">{fc(s.feesWaived)}</span></li>
              <li className="flex justify-between"><span className="flex items-center gap-2"><Coins className="h-4 w-4" style={{ color: "var(--chart-7)" }} />Registration pledges ({s.pledgeCount})</span><span className="tabular-nums">{fc(s.regPledges)}</span></li>
              <li className="flex justify-between"><span className="flex items-center gap-2"><Coins className="h-4 w-4" style={{ color: "var(--chart-8)" }} />Campaign pledges ({s.cpCount})</span><span className="tabular-nums">{fc(s.campPledges)}</span></li>
            </ul>
          )}
        </div>
      </div>

      <Collapsible className="rounded-2xl border border-border/40 bg-card/60">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-6 group">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Registration contributions ({list.length})</h3>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-6 pb-6 space-y-3">
          <Input placeholder="Search name or event…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No registration fees or pledges in the selected period.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Pledge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{format(new Date(r.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{r.event_name}</TableCell>
                      <TableCell className="capitalize">{r.category || "—"}{r.fee > 0 && r.fee_is_group ? <span className="ml-1 text-xs text-muted-foreground">(family)</span> : null}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.fee > 0 ? fc(r.fee) : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.pledge > 0 ? fc(r.pledge) : "—"}</TableCell>
                      <TableCell>{r.fee > 0 ? <Badge variant={r.fee_status === "paid" ? "default" : "outline"} className="capitalize">{r.fee_status === "unpaid" ? "Awaiting cash" : r.fee_status}</Badge> : "—"}</TableCell>
                      <TableCell className="text-right">
                        {r.fee > 0 ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={setFeeStatus.isPending}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Registration fee</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled={r.fee_status === "paid"} onClick={() => setFeeStatus.mutate({ row: r, status: "paid" })}>
                                <Check className="h-4 w-4 mr-2" /> Confirm payment
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={r.fee_status === "unpaid"} onClick={() => setFeeStatus.mutate({ row: r, status: "unpaid" })}>
                                <Undo2 className="h-4 w-4 mr-2" /> Mark awaiting cash
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={r.fee_status === "waived"} onClick={() => setFeeStatus.mutate({ row: r, status: "waived" })}>
                                <HandCoins className="h-4 w-4 mr-2" /> Waive fee
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : "—"}
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

export default CampaignContributionsPanel;
