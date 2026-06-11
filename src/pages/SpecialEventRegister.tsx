import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Plus, Trash2, Search, Heart, Users, Bed, Utensils, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { format } from "date-fns";

type Lookup = {
  found: boolean;
  member?: {
    id: string;
    member_id: string;
    member_type: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string | null;
  } | null;
};

type FamilyRow = {
  relationship_type: string;
  lookupValue: string;
  lookupMode: "email" | "phone";
  status?: "idle" | "checking" | "found" | "missing";
  existing_member_id?: string;
  // new registrant draft if not found
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  is_child?: boolean;
};

const REL_OPTIONS = [
  { value: "spouse", label: "Spouse" },
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
];

const MEAL_OPTIONS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Nut allergy", "Other allergy"];

const calcAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
};

export default function SpecialEventRegister() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["special-event-by-slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      // Try by slug first
      let { data } = await supabase.from("events").select("*, fundraising_campaigns:linked_fundraising_campaign_id(id,name,goal,raised,currency_code)").eq("slug", slug!).maybeSingle();
      if (!data) {
        // Fall back to id
        const { data: byId } = await supabase.from("events").select("*, fundraising_campaigns:linked_fundraising_campaign_id(id,name,goal,raised,currency_code)").eq("id", slug!).maybeSingle();
        data = byId;
      }
      return data;
    },
  });

  // Step state
  const [step, setStep] = useState<"identify" | "details" | "extras" | "done">("identify");

  // Primary identity
  const [lookupMode, setLookupMode] = useState<"email" | "phone">("email");
  const [lookupValue, setLookupValue] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "checking" | "found" | "missing">("idle");
  const [primaryMember, setPrimaryMember] = useState<Lookup["member"] | null>(null);

  // New primary draft
  const [primaryDraft, setPrimaryDraft] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    occupation: "",
    type: "visitor" as "member" | "visitor",
  });

  // Family
  const [family, setFamily] = useState<FamilyRow[]>([]);

  // Extras
  const [needsLodging, setNeedsLodging] = useState(false);
  const [lodgingPartySize, setLodgingPartySize] = useState<number | "">("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [mealPrefs, setMealPrefs] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [pledgeAmount, setPledgeAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const campaign = (event as any)?.fundraising_campaigns ?? null;

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    setLookupStatus("checking");
    const payload = lookupMode === "email" ? { email: lookupValue.trim() } : { phone: lookupValue.trim() };
    const { data, error } = await supabase.functions.invoke("event-pre-register-lookup", { body: payload });
    if (error) {
      setLookupStatus("missing");
      return;
    }
    if ((data as Lookup)?.found) {
      setPrimaryMember((data as Lookup).member!);
      // Pre-fill draft for display
      const m = (data as Lookup).member!;
      setPrimaryDraft(d => ({ ...d, first_name: m.first_name, last_name: m.last_name, email: m.email, phone: m.phone || "" }));
      setLookupStatus("found");
    } else {
      setPrimaryMember(null);
      setPrimaryDraft(d => ({ ...d, [lookupMode]: lookupValue.trim() }));
      setLookupStatus("missing");
    }
  };

  // Family lookup
  const lookupFamily = async (i: number) => {
    const row = family[i];
    if (!row.lookupValue.trim()) return;
    setFamily(prev => prev.map((r, idx) => (idx === i ? { ...r, status: "checking" } : r)));
    const payload = row.lookupMode === "email" ? { email: row.lookupValue.trim() } : { phone: row.lookupValue.trim() };
    const { data } = await supabase.functions.invoke("event-pre-register-lookup", { body: payload });
    setFamily(prev =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        if ((data as Lookup)?.found) {
          const m = (data as Lookup).member!;
          const age = calcAge(m.date_of_birth);
          return {
            ...r,
            status: "found",
            existing_member_id: m.id,
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.email,
            phone: m.phone,
            is_child: age !== null && age < 16,
          };
        }
        return { ...r, status: "missing", [r.lookupMode]: r.lookupValue.trim() } as FamilyRow;
      })
    );
  };

  const addFamily = () =>
    setFamily(prev => [
      ...prev,
      { relationship_type: "spouse", lookupValue: "", lookupMode: "email", status: "idle" },
    ]);
  const removeFamily = (i: number) => setFamily(prev => prev.filter((_, idx) => idx !== i));

  const canProceedFromIdentify = lookupStatus === "found" || (lookupStatus === "missing" && primaryDraft.first_name && primaryDraft.last_name);

  const canSubmit = useMemo(() => {
    if (!event) return false;
    // Primary needs to be resolvable
    if (!primaryMember && (!primaryDraft.first_name || !primaryDraft.last_name || !primaryDraft.email || !primaryDraft.phone)) return false;
    // Family: each row needs primary identification info
    for (const f of family) {
      if (!f.relationship_type) return false;
      if (!f.existing_member_id && (!f.first_name || !f.last_name)) return false;
    }
    return true;
  }, [event, primaryMember, primaryDraft, family]);

  const submit = async () => {
    if (!event) return;
    setSubmitting(true);
    try {
      const body: any = {
        event_id: (event as any).id,
        primary_member_id: primaryMember?.id ?? null,
        primary_new: primaryMember
          ? null
          : {
              type: primaryDraft.type,
              first_name: primaryDraft.first_name,
              last_name: primaryDraft.last_name,
              email: primaryDraft.email,
              phone: primaryDraft.phone,
              address: primaryDraft.address,
              date_of_birth: primaryDraft.date_of_birth,
              gender: primaryDraft.gender,
              occupation: primaryDraft.occupation,
            },
        primary_phone: primaryMember?.phone || primaryDraft.phone,
        family: family.map(f => ({
          relationship_type: f.relationship_type,
          existing_member_id: f.existing_member_id || null,
          is_child: !!f.is_child,
          new_registrant: f.existing_member_id
            ? null
            : {
                type: "visitor",
                first_name: f.first_name!,
                last_name: f.last_name!,
                email: f.email || "",
                phone: f.phone || "",
                date_of_birth: f.date_of_birth,
                gender: f.gender,
                address: f.address,
              },
        })),
        needs_lodging: needsLodging,
        lodging_party_size: needsLodging ? Number(lodgingPartySize || 0) || null : null,
        arrival_date: arrivalDate || null,
        departure_date: departureDate || null,
        meal_preferences: mealPrefs,
        dietary_notes: dietaryNotes || null,
        pledge_amount: pledgeAmount ? Number(pledgeAmount) : null,
        pledge_currency_code: campaign?.currency_code || null,
      };
      const { data, error } = await supabase.functions.invoke("event-special-register", { body });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      setStep("done");
      toast.success(`Registered ${(data as any).registered} attendee(s)!`);
    } catch (e: any) {
      toast.error(e.message || "Could not complete registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!event || !(event as any).is_special) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-3">
              <h2 className="text-xl font-semibold">Event not available</h2>
              <p className="text-sm text-muted-foreground">This event isn't open for special registration.</p>
              <Button asChild><Link to="/events">Back to events</Link></Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const ev: any = event;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 md:p-8">
            <Badge className="bg-amber-500/90 text-white mb-3">Special Event</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{ev.name}</h1>
            <p className="text-sm opacity-90 mt-1">
              {format(new Date(ev.start_datetime), "PPP")}
              {ev.end_datetime ? ` – ${format(new Date(ev.end_datetime), "PPP")}` : ""}
            </p>
            {ev.location_name && <p className="text-sm opacity-80 mt-1">{ev.location_name}</p>}
            {campaign && (
              <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4" />
                  <span className="font-semibold">{campaign.name}</span>
                </div>
                <div className="mt-2 text-xs opacity-80">
                  Raised {campaign.currency_code} {campaign.raised?.toLocaleString() || 0} of {campaign.currency_code} {campaign.goal?.toLocaleString() || 0}
                </div>
                <div className="mt-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${Math.min(100, ((campaign.raised || 0) / Math.max(1, campaign.goal || 1)) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Steps */}
          {step === "done" ? (
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold">You're registered!</h2>
                <p className="text-sm text-muted-foreground">We've recorded your interest. We'll be in touch with event details soon.</p>
                <Button asChild><Link to="/events">Browse other events</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* STEP 1 - Identify */}
              {step === "identify" && (
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <h2 className="font-semibold text-lg">Who is registering?</h2>
                    <p className="text-sm text-muted-foreground">Enter the email or phone you used when you registered with WCA. If you're new, we'll get you onboarded right here.</p>

                    <div className="flex gap-2">
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={lookupMode}
                        onChange={e => setLookupMode(e.target.value as any)}
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                      </select>
                      <Input
                        placeholder={lookupMode === "email" ? "you@example.com" : "Phone number"}
                        value={lookupValue}
                        onChange={e => { setLookupValue(e.target.value); setLookupStatus("idle"); setPrimaryMember(null); }}
                      />
                      <Button onClick={handleLookup} disabled={lookupStatus === "checking" || !lookupValue.trim()}>
                        {lookupStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-1">Check</span>
                      </Button>
                    </div>

                    {lookupStatus === "found" && primaryMember && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Welcome back, <strong>{primaryMember.last_name} {primaryMember.first_name}</strong> ({primaryMember.member_id}).
                        </AlertDescription>
                      </Alert>
                    )}

                    {lookupStatus === "missing" && (
                      <div className="space-y-3 border rounded-xl p-4">
                        <p className="text-sm font-medium">We don't have you yet — let's add you.</p>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label>Family Name *</Label>
                            <Input value={primaryDraft.last_name} onChange={e => setPrimaryDraft(d => ({ ...d, last_name: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Other Names *</Label>
                            <Input value={primaryDraft.first_name} onChange={e => setPrimaryDraft(d => ({ ...d, first_name: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Email *</Label>
                            <Input type="email" value={primaryDraft.email} onChange={e => setPrimaryDraft(d => ({ ...d, email: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Phone *</Label>
                            <Input value={primaryDraft.phone} onChange={e => setPrimaryDraft(d => ({ ...d, phone: e.target.value }))} />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Address</Label>
                            <Input value={primaryDraft.address} onChange={e => setPrimaryDraft(d => ({ ...d, address: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Date of birth</Label>
                            <Input type="date" value={primaryDraft.date_of_birth} onChange={e => setPrimaryDraft(d => ({ ...d, date_of_birth: e.target.value }))} />
                          </div>
                          <div>
                            <Label>Gender</Label>
                            <select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={primaryDraft.gender} onChange={e => setPrimaryDraft(d => ({ ...d, gender: e.target.value }))}>
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button disabled={!canProceedFromIdentify} onClick={() => setStep("details")}>
                        Continue <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 2 - Family */}
              {step === "details" && (
                <Card>
                  <CardContent className="p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-lg flex items-center gap-2"><Users className="h-5 w-5" /> Family & Children</h2>
                        <p className="text-sm text-muted-foreground">Add family members attending with you. Children under 16 are automatically flagged.</p>
                      </div>
                      <Button onClick={addFamily} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Add person</Button>
                    </div>

                    {family.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-xl">No family added — that's fine if you're attending alone.</p>
                    )}

                    {family.map((row, i) => (
                      <div key={i} className="border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={row.relationship_type} onChange={e => setFamily(p => p.map((r, idx) => idx === i ? { ...r, relationship_type: e.target.value } : r))}>
                            {REL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <Button variant="ghost" size="icon" onClick={() => removeFamily(i)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex gap-2">
                          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={row.lookupMode} onChange={e => setFamily(p => p.map((r, idx) => idx === i ? { ...r, lookupMode: e.target.value as any } : r))}>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                          </select>
                          <Input
                            placeholder={row.lookupMode === "email" ? "email" : "phone"}
                            value={row.lookupValue}
                            onChange={e => setFamily(p => p.map((r, idx) => idx === i ? { ...r, lookupValue: e.target.value, status: "idle", existing_member_id: undefined } : r))}
                          />
                          <Button size="sm" variant="outline" onClick={() => lookupFamily(i)} disabled={row.status === "checking"}>
                            {row.status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                          </Button>
                        </div>
                        {row.status === "found" && (
                          <Alert><CheckCircle2 className="h-4 w-4" /><AlertDescription>Linked: {row.last_name} {row.first_name}{row.is_child ? " (child)" : ""}</AlertDescription></Alert>
                        )}
                        {row.status === "missing" && (
                          <div className="grid md:grid-cols-2 gap-2 pt-2 border-t">
                            <Input placeholder="Family Name *" value={row.last_name || ""} onChange={e => setFamily(p => p.map((r, idx) => idx === i ? { ...r, last_name: e.target.value } : r))} />
                            <Input placeholder="Other Names *" value={row.first_name || ""} onChange={e => setFamily(p => p.map((r, idx) => idx === i ? { ...r, first_name: e.target.value } : r))} />
                            <Input type="date" placeholder="Date of birth" value={row.date_of_birth || ""} onChange={e => {
                              const dob = e.target.value;
                              const age = calcAge(dob);
                              setFamily(p => p.map((r, idx) => idx === i ? { ...r, date_of_birth: dob, is_child: age !== null && age < 16 } : r));
                            }} />
                            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={row.gender || ""} onChange={e => setFamily(p => p.map((r, idx) => idx === i ? { ...r, gender: e.target.value } : r))}>
                              <option value="">Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox checked={!!row.is_child} onCheckedChange={v => setFamily(p => p.map((r, idx) => idx === i ? { ...r, is_child: !!v } : r))} />
                              This is a child (under 16)
                            </label>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep("identify")}>Back</Button>
                      <Button onClick={() => setStep("extras")}>Continue <ArrowRight className="h-4 w-4 ml-1" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* STEP 3 - Extras (lodging/meals/pledge) */}
              {step === "extras" && (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {ev.collect_lodging && (
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2"><Bed className="h-5 w-5" /> Lodging</h3>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox checked={needsLodging} onCheckedChange={v => setNeedsLodging(!!v)} />
                          I need lodging provided by the organizers
                        </label>
                        {needsLodging && (
                          <div className="grid md:grid-cols-3 gap-3">
                            <div>
                              <Label>Party size</Label>
                              <Input type="number" min={1} value={lodgingPartySize} onChange={e => setLodgingPartySize(e.target.value === "" ? "" : Number(e.target.value))} />
                            </div>
                            <div>
                              <Label>Arrival date</Label>
                              <Input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
                            </div>
                            <div>
                              <Label>Departure date</Label>
                              <Input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {ev.collect_meal_preferences && (
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2"><Utensils className="h-5 w-5" /> Meal preferences</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {MEAL_OPTIONS.map(m => (
                            <label key={m} className="flex items-center gap-2 text-sm">
                              <Checkbox checked={mealPrefs.includes(m)} onCheckedChange={v => setMealPrefs(p => v ? [...p, m] : p.filter(x => x !== m))} />
                              {m}
                            </label>
                          ))}
                        </div>
                        <Textarea placeholder="Other dietary notes or allergies" value={dietaryNotes} onChange={e => setDietaryNotes(e.target.value)} />
                      </div>
                    )}

                    {ev.collect_pledges && campaign && (
                      <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2"><Heart className="h-5 w-5" /> Pledge to support</h3>
                        <p className="text-sm text-muted-foreground">Optional: pledge an amount to help fund the event. We'll follow up to collect.</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{campaign.currency_code}</span>
                          <Input type="number" min={0} placeholder="0" value={pledgeAmount} onChange={e => setPledgeAmount(e.target.value === "" ? "" : Number(e.target.value))} />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep("details")}>Back</Button>
                      <Button onClick={submit} disabled={!canSubmit || submitting}>
                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</> : "Confirm registration"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
