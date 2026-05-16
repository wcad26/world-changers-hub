import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import {
  ArrowLeft, HeartHandshake, Target, TrendingUp, Users, CalendarDays,
  Pencil, Share2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useFundraisingCampaign,
  useCampaignDonations,
} from "@/hooks/useFundraisingCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { useRegionCurrency, useCurrencies } from "@/hooks/useCurrencies";
import { formatCurrencyWithSymbol } from "@/utils/currencyUtils";
import EditFundraisingCampaignDialog from "@/components/admin/regional/EditFundraisingCampaignDialog";
import ViewDonationDialog from "@/components/admin/regional/finances/ViewDonationDialog";
import FundraisingDonationRowActions from "@/components/admin/regional/finances/FundraisingDonationRowActions";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; sub?: React.ReactNode }>
  = ({ icon, label, value, sub }) => (
  <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary">
        {icon}
      </span>
    </div>
    <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
    {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
  </div>
);

const FundraisingCampaignReport: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { userRegion } = useAuth();
  const { data: regionCurrency } = useRegionCurrency(userRegion?.id);
  const { data: currencies = [] } = useCurrencies();
  const { data: campaign, isLoading: campaignLoading } = useFundraisingCampaign(campaignId);
  const { data: donations = [], isLoading: donationsLoading } = useCampaignDonations(campaignId || "");

  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const cur = useMemo(() => {
    if (!campaign) return regionCurrency;
    return (
      currencies.find((c) => c.code?.toLowerCase() === (campaign.currency_code || "").toLowerCase()) ||
      regionCurrency
    );
  }, [campaign, currencies, regionCurrency]);

  const fc = (n: number) => formatCurrencyWithSymbol(n, cur);

  const totals = useMemo(() => {
    const raised = donations.reduce((s, d) => s + Number(d.amount || 0), 0) / 100;
    const goal = (campaign?.goal || 0) / 100;
    const donorsSet = new Set<string>();
    donations.forEach((d) => {
      if (d.anonymous) donorsSet.add(`anon:${d.id}`);
      else if (d.donor_id) donorsSet.add(`id:${d.donor_id}`);
      else if (d.donor_email) donorsSet.add(`em:${d.donor_email.toLowerCase()}`);
      else if (d.donor_name) donorsSet.add(`nm:${d.donor_name.toLowerCase()}`);
      else donorsSet.add(`anon:${d.id}`);
    });
    const donorCount = donorsSet.size;
    const avg = donations.length > 0 ? raised / donations.length : 0;
    const pct = goal > 0 ? (raised / goal) * 100 : 0;
    return { raised, goal, donorCount, avg, pct };
  }, [donations, campaign]);

  const daysInfo = useMemo(() => {
    if (!campaign?.start_date) return { label: "—", value: "—" };
    const today = new Date();
    if (campaign.end_date) {
      const end = parseISO(campaign.end_date);
      const remaining = differenceInCalendarDays(end, today);
      if (remaining >= 0) return { label: "Days remaining", value: `${remaining}` };
      return { label: "Days ended", value: `${Math.abs(remaining)}d ago` };
    }
    const start = parseISO(campaign.start_date);
    const elapsed = differenceInCalendarDays(today, start);
    return { label: "Days running", value: `${Math.max(0, elapsed)}` };
  }, [campaign]);

  const trendData = useMemo(() => {
    const byDay = new Map<string, number>();
    donations.forEach((d) => {
      const day = format(new Date(d.donation_date), "yyyy-MM-dd");
      byDay.set(day, (byDay.get(day) || 0) + Number(d.amount || 0) / 100);
    });
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, amount]) => ({
        day,
        label: format(parseISO(day), "MMM dd"),
        amount: Math.round(amount * 100) / 100,
      }));
  }, [donations]);

  const topDonors = useMemo(() => {
    const map = new Map<string, { key: string; name: string; total: number; count: number }>();
    donations.forEach((d) => {
      const name = d.anonymous ? "Anonymous" : (d.donor_name || d.donor_email || "Unknown");
      const key = d.anonymous ? `anon:${d.id}` : (d.donor_email?.toLowerCase() || d.donor_name?.toLowerCase() || `d:${d.id}`);
      const existing = map.get(key) || { key, name, total: 0, count: 0 };
      existing.total += Number(d.amount || 0) / 100;
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [donations]);

  const openView = (d: any) => { setSelected(d); setViewOpen(true); };

  const handleShare = () => {
    const url = `${window.location.origin}/fundraising/${campaign?.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied to clipboard");
  };

  if (campaignLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading campaign report…
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
        <div className="mt-8 text-center text-muted-foreground">Campaign not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/regional/finances")} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Finances
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{campaign.name}</h1>
            <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>{campaign.status}</Badge>
            {campaign.is_public ? <Badge variant="outline">Public</Badge> : <Badge variant="outline">Private</Badge>}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {campaign.start_date ? format(parseISO(campaign.start_date), "MMM dd, yyyy") : "—"}
            {" → "}
            {campaign.end_date ? format(parseISO(campaign.end_date), "MMM dd, yyyy") : "Ongoing"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4 mr-2" /> Share</Button>
          <Button onClick={() => setEditOpen(true)} className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Raised" value={fc(totals.raised)} sub={`of ${fc(totals.goal)}`} />
        <KpiCard icon={<Target className="h-4 w-4" />} label="Goal" value={fc(totals.goal)} />
        <KpiCard icon={<HeartHandshake className="h-4 w-4" />} label="Progress" value={`${totals.pct.toFixed(2)}%`} sub={totals.goal > 0 ? `${fc(Math.max(0, totals.goal - totals.raised))} to go` : "No goal set"} />
        <KpiCard icon={<Users className="h-4 w-4" />} label="Donors" value={totals.donorCount} sub={`${donations.length} donation${donations.length === 1 ? "" : "s"}`} />
        <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Avg donation" value={fc(totals.avg)} />
        <KpiCard icon={<CalendarDays className="h-4 w-4" />} label={daysInfo.label} value={daysInfo.value} />
      </div>

      {/* Progress + Description */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Goal progress</h3>
            <span className="text-sm tabular-nums text-muted-foreground">
              {fc(totals.raised)} <span className="text-foreground/60">/</span> {fc(totals.goal)}
            </span>
          </div>
          <Progress value={Math.min(100, totals.pct)} className="h-3" />
          <p className="text-xs text-muted-foreground">{totals.pct.toFixed(2)}% of goal achieved</p>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 space-y-2">
          <h3 className="text-base font-semibold">About this campaign</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.description || "No description provided."}</p>
        </div>
      </div>

      {/* Trend */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Donations over time</h3>
        </div>
        {trendData.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-sm">No donations recorded yet.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="donationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => fc(Number(v))} width={90} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                  formatter={(v: any) => [fc(Number(v)), "Raised"]}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#donationGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top donors */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">Top donors</h3>
        </div>
        {topDonors.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No donors yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDonors.map((d, i) => (
                  <TableRow key={d.key} className="border-border/20">
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-green-600">{fc(d.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* All donations */}
      <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <HeartHandshake className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold">All donations ({donations.length})</h3>
        </div>
        {donationsLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
          </div>
        ) : donations.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">No donations recorded for this campaign.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/30">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead className="hidden md:table-cell">Message</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((d: any) => {
                  const donationWithCampaign = { ...d, campaign };
                  return (
                    <TableRow key={d.id} className="border-border/20 hover:bg-muted/30 cursor-pointer" onClick={() => openView(donationWithCampaign)}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{format(new Date(d.donation_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{d.anonymous ? <span className="italic text-muted-foreground">Anonymous</span> : (d.donor_name || "—")}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{d.message || "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-semibold tabular-nums text-green-600">{fc(Number(d.amount) / 100)}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <FundraisingDonationRowActions donation={donationWithCampaign} onView={() => openView(donationWithCampaign)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EditFundraisingCampaignDialog open={editOpen} onOpenChange={setEditOpen} campaign={campaign} />
      <ViewDonationDialog open={viewOpen} onOpenChange={setViewOpen} donation={selected} />
    </div>
  );
};

export default FundraisingCampaignReport;
