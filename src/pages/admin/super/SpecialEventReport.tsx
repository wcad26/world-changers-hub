import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Bed, Utensils, Heart, CalendarDays, Baby, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";

const calcAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
};

export default function SpecialEventReport() {
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event } = useQuery({
    queryKey: ["special-event-report-event", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, fundraising_campaigns:linked_fundraising_campaign_id(*)")
        .eq("id", eventId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ["special-event-registrations", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_pre_registrations")
        .select("*, members:member_id(id, member_id, member_type, region_id, profiles:profile_id(first_name, last_name, email, phone, date_of_birth, gender, address))")
        .eq("event_id", eventId!);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: donations } = useQuery({
    queryKey: ["special-event-donations", (event as any)?.linked_fundraising_campaign_id],
    enabled: !!(event as any)?.linked_fundraising_campaign_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("fundraising_donations")
        .select("*")
        .eq("campaign_id", (event as any).linked_fundraising_campaign_id);
      return data || [];
    },
  });

  const ev: any = event;
  const campaign: any = ev?.fundraising_campaigns ?? null;

  const stats = useMemo(() => {
    const regs = registrations || [];
    const primary = regs.filter((r: any) => r.is_primary);
    const totalPeople = regs.length;
    const families = primary.filter((r: any) => r.attending_with_family).length;
    const individuals = primary.length - families;

    let adults = 0, children = 0;
    for (const r of regs) {
      const dob = r.members?.profiles?.date_of_birth;
      const age = calcAge(dob);
      if (age !== null && age < 16) children++;
      else adults++;
    }

    const lodgingNeeded = primary.filter((r: any) => r.needs_lodging);
    const totalBeds = lodgingNeeded.reduce((s: number, r: any) => s + (r.lodging_party_size || 1), 0);

    const mealTotals: Record<string, number> = {};
    regs.forEach((r: any) => (r.meal_preferences || []).forEach((m: string) => { mealTotals[m] = (mealTotals[m] || 0) + 1; }));

    const totalPledged = primary.reduce((s: number, r: any) => s + Number(r.pledge_amount || 0), 0);
    const totalReceived = (donations || []).reduce((s: number, d: any) => s + Number(d.amount || 0), 0);

    // Gender
    let male = 0, female = 0, unspec = 0;
    regs.forEach((r: any) => {
      const g = (r.members?.profiles?.gender || "").toLowerCase();
      if (g === "male") male++;
      else if (g === "female") female++;
      else unspec++;
    });

    return { totalPeople, families, individuals, adults, children, lodgingNeeded: lodgingNeeded.length, totalBeds, mealTotals, totalPledged, totalReceived, male, female, unspec, target: ev?.attendance_target || null };
  }, [registrations, donations, ev]);

  const exportCsv = () => {
    if (!registrations) return;
    const headers = ["Name", "Member ID", "Type", "Email", "Phone", "Primary", "Family", "Lodging", "Party size", "Arrival", "Departure", "Meals", "Pledge"];
    const rows = registrations.map((r: any) => {
      const p = r.members?.profiles || {};
      return [
        `${p.last_name || ""} ${p.first_name || ""}`.trim(),
        r.members?.member_id || "",
        r.members?.member_type || "",
        p.email || "",
        p.phone || "",
        r.is_primary ? "Yes" : "No",
        r.attending_with_family ? "Yes" : "No",
        r.needs_lodging ? "Yes" : "No",
        r.lodging_party_size || "",
        r.arrival_date || "",
        r.departure_date || "",
        (r.meal_preferences || []).join("; "),
        r.pledge_amount || "",
      ];
    });
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev?.name || "special-event"}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!ev) {
    return <div className="p-6"><Skeleton className="h-24 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link to="/admin/super/events"><ArrowLeft className="h-4 w-4 mr-1" />Back to events</Link>
          </Button>
          <h1 className="text-2xl font-semibold">{ev.name}</h1>
          <p className="text-sm text-muted-foreground">
            Special Event Report · {format(new Date(ev.start_datetime), "PPP")}
            {ev.end_datetime ? ` – ${format(new Date(ev.end_datetime), "PPP")}` : ""}
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Users} label="Total Registered" value={stats.totalPeople} sub={`${stats.individuals} individuals · ${stats.families} families`} />
        <KPI icon={Baby} label="Adults / Children" value={`${stats.adults} / ${stats.children}`} sub={`Target: ${stats.target || "—"}`} />
        <KPI icon={Bed} label="Beds Needed" value={stats.totalBeds} sub={`${stats.lodgingNeeded} parties need lodging`} />
        <KPI icon={Heart} label="Pledged" value={campaign ? `${campaign.currency_code} ${stats.totalPledged.toLocaleString()}` : "—"} sub={campaign ? `Received: ${campaign.currency_code} ${stats.totalReceived.toLocaleString()}` : "No campaign linked"} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Utensils className="h-4 w-4" /> Meal preferences</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(stats.mealTotals).length === 0 ? (
              <p className="text-sm text-muted-foreground">No meal preferences submitted.</p>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Preference</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                <TableBody>
                  {Object.entries(stats.mealTotals).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <TableRow key={k}><TableCell>{k}</TableCell><TableCell className="text-right">{v}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4" /> Fundraising</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!campaign ? (
              <p className="text-muted-foreground">No fundraising campaign is linked to this event.</p>
            ) : (
              <>
                <div className="flex items-center justify-between"><span>Campaign</span><span className="font-medium">{campaign.name}</span></div>
                <div className="flex items-center justify-between"><span>Goal</span><span className="font-medium">{campaign.currency_code} {Number(campaign.goal || 0).toLocaleString()}</span></div>
                <div className="flex items-center justify-between"><span>Total pledged via event</span><span className="font-medium">{campaign.currency_code} {stats.totalPledged.toLocaleString()}</span></div>
                <div className="flex items-center justify-between"><span>Total received</span><span className="font-medium">{campaign.currency_code} {Number(campaign.raised || 0).toLocaleString()}</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((Number(campaign.raised || 0) + stats.totalPledged) / Math.max(1, Number(campaign.goal || 1))) * 100)}%` }} />
                </div>
                <Button asChild variant="outline" size="sm"><Link to={`/admin/super/fundraising`}>Manage campaign</Link></Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lodging breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bed className="h-4 w-4" /> Lodging requests</CardTitle></CardHeader>
        <CardContent>
          {(registrations || []).filter((r: any) => r.is_primary && r.needs_lodging).length === 0 ? (
            <p className="text-sm text-muted-foreground">No lodging requests yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Primary attendee</TableHead><TableHead className="text-right">Party size</TableHead><TableHead>Arrival</TableHead><TableHead>Departure</TableHead></TableRow></TableHeader>
              <TableBody>
                {(registrations || []).filter((r: any) => r.is_primary && r.needs_lodging).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.members?.profiles?.last_name} {r.members?.profiles?.first_name}</TableCell>
                    <TableCell className="text-right">{r.lodging_party_size || 1}</TableCell>
                    <TableCell>{r.arrival_date || "—"}</TableCell>
                    <TableCell>{r.departure_date || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All registrants */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> All registrations</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Pledge</TableHead>
                  <TableHead>Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(registrations || []).map((r: any) => {
                  const p = r.members?.profiles || {};
                  const age = calcAge(p.date_of_birth);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{p.last_name} {p.first_name}</div>
                        <div className="flex gap-1 mt-1">
                          {r.is_primary && <Badge variant="secondary">Primary</Badge>}
                          {age !== null && age < 16 && <Badge className="bg-orange-500/15 text-orange-700 border-orange-500/30">Child</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.members?.member_id}</TableCell>
                      <TableCell><Badge variant="outline">{r.members?.member_type}</Badge></TableCell>
                      <TableCell className="text-sm">{p.email}</TableCell>
                      <TableCell className="text-sm">{p.phone}</TableCell>
                      <TableCell className="text-sm">{r.pledge_amount ? `${r.pledge_currency_code || ""} ${Number(r.pledge_amount).toLocaleString()}` : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.group_id ? r.group_id.slice(0, 8) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
                {(!registrations || registrations.length === 0) && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No registrations yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
