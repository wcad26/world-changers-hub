import { useMemo, useState } from "react";
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
import {
  Loader2, CheckCircle2, Plus, Trash2, Search, Heart, Users, Bed, Utensils,
  ArrowRight, ArrowLeft, UserCheck, Calendar as CalendarIcon, MapPin, Mail, Phone, Check, User
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { format, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";
import SpecialEventOnboardForm, {
  type OnboardFormValue,
  emptyOnboardValue,
  isOnboardValid,
} from "@/components/events/SpecialEventOnboardForm";

type RelationEntry = {
  member_id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  is_child: boolean;
  relationship_type: string;
};

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
  relations?: RelationEntry[];
};

type FamilyRow = {
  relationship_type: string;
  lookupValue: string;
  lookupMode: "email" | "phone";
  status?: "idle" | "checking" | "found" | "missing";
  existing_member_id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  is_child?: boolean;
  // Prefilled rows from existing relationships use this:
  prefilled?: boolean;
  attending?: boolean;
  // When status === "missing", a full onboarding form is collected here.
  onboard?: OnboardFormValue;
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

const nativeSelectClassName =
  "flex h-10 w-full rounded-xl border border-input bg-background/60 px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function GlassSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 md:p-6 space-y-4 shadow-sm">
      <div className="flex items-start gap-2.5 pb-3 border-b border-border/30">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

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

type StepKey = "identify" | "onboard" | "details" | "extras" | "done";

function StepIndicator({ step, steps }: { step: StepKey; steps: { key: StepKey; label: string }[] }) {
  const activeIdx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.key} className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-full text-xs font-semibold transition-colors",
                  active && "bg-primary text-primary-foreground shadow",
                  done && "bg-primary/80 text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs md:text-sm font-medium hidden sm:inline",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("h-px w-6 md:w-10", i < activeIdx ? "bg-primary/60" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SpecialEventRegister() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["special-event-by-slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      let { data } = await supabase
        .from("events")
        .select("*, fundraising_campaigns:linked_fundraising_campaign_id(id,name,goal,raised,currency_code)")
        .eq("slug", slug!)
        .maybeSingle();
      if (!data) {
        const { data: byId } = await supabase
          .from("events")
          .select("*, fundraising_campaigns:linked_fundraising_campaign_id(id,name,goal,raised,currency_code)")
          .eq("id", slug!)
          .maybeSingle();
        data = byId;
      }
      return data;
    },
  });

  const [step, setStep] = useState<StepKey>("identify");

  const [lookupMode, setLookupMode] = useState<"email" | "phone">("email");
  const [lookupValue, setLookupValue] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "checking" | "found" | "missing">("idle");
  const [lastCheckedValue, setLastCheckedValue] = useState("");
  const [primaryMember, setPrimaryMember] = useState<Lookup["member"] | null>(null);
  const [registrationMode, setRegistrationMode] = useState<"individual" | "family" | null>(null);

  // Full onboarding form for new (not-yet-onboarded) primary registrants.
  const [primaryOnboard, setPrimaryOnboard] = useState<OnboardFormValue>(emptyOnboardValue());

  const [family, setFamily] = useState<FamilyRow[]>([]);

  const [needsLodging, setNeedsLodging] = useState(true);
  const [attendingDays, setAttendingDays] = useState<string[]>([]);
  const [mealPrefs, setMealPrefs] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [pledgeAmount, setPledgeAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const campaign = (event as any)?.fundraising_campaigns ?? null;
  const ev: any = event;

  const hasExtras = !!(ev?.collect_lodging || ev?.collect_meal_preferences || (ev?.collect_pledges && campaign));

  const eventDays = useMemo<string[]>(() => {
    if (!ev?.start_datetime) return [];
    const start = new Date(ev.start_datetime);
    const end = ev.end_datetime ? new Date(ev.end_datetime) : start;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    try {
      const days = eachDayOfInterval({ start, end });
      return days.slice(0, 30).map((d) => format(d, "yyyy-MM-dd"));
    } catch {
      return [format(start, "yyyy-MM-dd")];
    }
  }, [ev?.start_datetime, ev?.end_datetime]);

  const needsOnboarding = lookupStatus === "missing" && !primaryMember;

  const steps: { key: StepKey; label: string }[] = useMemo(() => {
    const base: { key: StepKey; label: string }[] = [{ key: "identify", label: "You" }];
    if (needsOnboarding) base.push({ key: "onboard", label: "Onboard" });
    if (registrationMode === "family") base.push({ key: "details", label: "Family" });
    if (hasExtras) base.push({ key: "extras", label: "Extras" });
    return base;
  }, [hasExtras, registrationMode, needsOnboarding]);

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    setLookupStatus("checking");
    const value = lookupValue.trim();
    const payload = lookupMode === "email" ? { email: value } : { phone: value };
    const { data, error } = await supabase.functions.invoke("event-pre-register-lookup", { body: payload });
    setLastCheckedValue(value);
    if (error) {
      setLookupStatus("missing");
      return;
    }
    if ((data as Lookup)?.found) {
      const lk = data as Lookup;
      setPrimaryMember(lk.member!);
      // Seed family from existing relationships — user just ticks who is attending.
      const prefilled: FamilyRow[] = (lk.relations || []).map((r) => ({
        relationship_type: r.relationship_type || "other",
        lookupValue: r.email || r.phone || "",
        lookupMode: "email",
        status: "found",
        existing_member_id: r.member_id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        phone: r.phone,
        date_of_birth: r.date_of_birth || undefined,
        is_child: r.is_child,
        prefilled: true,
        attending: false,
      }));
      setFamily(prefilled);
      setLookupStatus("found");
    } else {
      setPrimaryMember(null);
      // Initialise the onboard form with whatever the user just typed.
      setPrimaryOnboard({
        ...emptyOnboardValue(),
        attendee_type: "visitor",
        [lookupMode]: value,
      } as OnboardFormValue);
      setFamily([]);
      setLookupStatus("missing");
    }
  };

  const lookupFamily = async (i: number) => {
    const row = family[i];
    if (!row.lookupValue.trim()) return;
    setFamily((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "checking" } : r)));
    const payload = row.lookupMode === "email" ? { email: row.lookupValue.trim() } : { phone: row.lookupValue.trim() };
    const { data } = await supabase.functions.invoke("event-pre-register-lookup", { body: payload });
    setFamily((prev) =>
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
            attending: true,
          };
        }
        // Initialise an onboard form for the missing family member; inherit
        // region from the primary registrant when available.
        const onboard: OnboardFormValue = {
          ...emptyOnboardValue(),
          attendee_type: "visitor",
          region_id: primaryOnboard.region_id || "",
          [r.lookupMode]: r.lookupValue.trim(),
        } as OnboardFormValue;
        return { ...r, status: "missing", onboard, [r.lookupMode]: r.lookupValue.trim() } as FamilyRow;
      })
    );
  };

  const addFamily = () =>
    setFamily((prev) => [
      ...prev,
      { relationship_type: "spouse", lookupValue: "", lookupMode: "email", status: "idle", attending: true },
    ]);
  const removeFamily = (i: number) => setFamily((prev) => prev.filter((_, idx) => idx !== i));

  // Step 1 (identify): "found" needs a mode; "missing" can always proceed to onboard.
  const canProceedFromIdentify =
    (lookupStatus === "found" && registrationMode !== null) ||
    lookupStatus === "missing";

  // Step 2 (onboard): primary onboard form must validate AND a mode must be chosen.
  const canProceedFromOnboard =
    isOnboardValid(primaryOnboard) && registrationMode !== null;

  // Build a NewRegistrant payload from an OnboardFormValue.
  const buildNewRegistrant = (o: OnboardFormValue) => ({
    type: o.attendee_type,
    attendee_type: o.attendee_type,
    region_id: o.region_id,
    first_name: o.first_name.trim(),
    last_name: o.last_name.trim(),
    email: o.email.trim(),
    phone: o.phone.trim(),
    address: o.address.trim() || null,
    date_of_birth: o.date_of_birth || null,
    gender: o.gender || null,
    occupation: o.occupation || null,
    // Member-specific
    has_completed_foundation_school: o.has_completed_foundation_school || null,
    foundation_school_date: o.foundation_school_date || null,
    is_baptized: o.is_baptized || null,
    baptism_date: o.baptism_date || null,
    ministry_interests: o.ministry_interests,
    dcg_id: o.dcg_id || null,
    relationships: o.relationships,
    // Visitor-specific
    referral_source: o.referral_source || null,
    referral_social_media: o.referral_social_media || null,
    referral_member_ids: o.referral_member_ids,
    referral_relationship_type: o.referral_relationship_type || null,
    referral_other_details: o.referral_other_details || null,
    join_interest: o.join_interest || null,
  });

  const canSubmit = useMemo(() => {
    if (!event) return false;
    if (!primaryMember && !isOnboardValid(primaryOnboard)) return false;
    for (const f of family) {
      if (f.prefilled) continue; // prefilled rows are opt-in via `attending`
      if (!f.relationship_type) return false;
      if (f.existing_member_id) continue;
      // Manual / missing row — must have a valid onboard form.
      if (!f.onboard || !isOnboardValid(f.onboard)) return false;
    }
    return true;
  }, [event, primaryMember, primaryOnboard, family]);

  const submit = async () => {
    if (!event) return;
    setSubmitting(true);
    // Only send: prefilled rows the user ticked, or manually added rows that resolved/are valid.
    const familyToSend =
      registrationMode === "family"
        ? family.filter((f) => {
            if (f.prefilled) return !!f.attending;
            return !!f.existing_member_id || (f.onboard && isOnboardValid(f.onboard));
          })
        : [];
    try {
      const body: any = {
        event_id: (event as any).id,
        primary_member_id: primaryMember?.id ?? null,
        primary_new: primaryMember ? null : buildNewRegistrant(primaryOnboard),
        primary_phone: primaryMember?.phone || primaryOnboard.phone,
        family: familyToSend.map((f) => ({
          relationship_type: f.relationship_type,
          existing_member_id: f.existing_member_id || null,
          is_child: !!f.is_child,
          new_registrant: f.existing_member_id ? null : buildNewRegistrant(f.onboard!),
        })),
        needs_lodging: needsLodging,
        lodging_party_size: null,
        arrival_date: needsLodging && attendingDays.length ? attendingDays[0] : null,
        departure_date: needsLodging && attendingDays.length ? attendingDays[attendingDays.length - 1] : null,
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
              <Button asChild>
                <Link to="/events">Back to events</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Action buttons
  const renderActions = () => {
    if (step === "done") return null;
    const currentIdx = steps.findIndex((s) => s.key === step);
    const isLast = currentIdx === steps.length - 1;
    const isFirst = currentIdx === 0;

    const onNext = () => {
      if (isLast) {
        submit();
      } else {
        setStep(steps[currentIdx + 1].key);
      }
    };
    const onBack = () => {
      if (!isFirst) setStep(steps[currentIdx - 1].key);
    };
    const nextDisabled =
      (step === "identify" && !canProceedFromIdentify) ||
      (step === "onboard" && !canProceedFromOnboard) ||
      (isLast && (!canSubmit || submitting));

    return (
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end">
        {!isFirst && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={submitting}
            className="w-full sm:w-auto rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            "w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow",
            isFirst && "col-span-2"
          )}
        >
          {isLast ? (
            submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              <>Confirm registration <CheckCircle2 className="h-4 w-4 ml-1" /></>
            )
          ) : (
            <>Continue <ArrowRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    );
  };

  // Reusable Individual / Family mode selector
  const renderModeSelector = (firstName: string) => (
    <div className="space-y-3">
      <Alert className="border-green-500/30 bg-green-500/5">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-justify">
          Hello <strong className="text-primary">{firstName}</strong>, are you registering for{" "}
          <strong className="text-primary">{ev.name}</strong> as a family or an individual?
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-2">
        {([
          { mode: "individual", label: "Individual", Icon: User, color: "indigo" },
          { mode: "family", label: "Family", Icon: Users, color: "rose" },
        ] as const).map(({ mode, label, Icon, color }) => {
          const selected = registrationMode === mode;
          const palette =
            color === "indigo"
              ? selected
                ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                : "border-border bg-background/60 hover:border-indigo-400/50"
              : selected
                ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                : "border-border bg-background/60 hover:border-rose-400/50";
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setRegistrationMode(mode)}
              className={cn(
                "relative flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all",
                palette
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors shrink-0",
                  selected ? "border-green-500 bg-green-500" : "border-muted-foreground/40 bg-background"
                )}
              >
                {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </span>
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4 pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-6 md:p-8 shadow-xl">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative">
              <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white mb-3 border-0">Special Event Pre-Registration</Badge>
              <h1 className="text-2xl md:text-fluid-3xl font-bold leading-tight">{ev.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm opacity-90">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(ev.start_datetime), "PPP")}
                  {ev.end_datetime ? ` – ${format(new Date(ev.end_datetime), "PPP")}` : ""}
                </span>
                {ev.location_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {ev.location_name}
                  </span>
                )}
              </div>
              {campaign && (
                <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="h-4 w-4" />
                    <span className="font-semibold">{campaign.name}</span>
                  </div>
                  <div className="mt-2 text-xs opacity-90">
                    Raised {campaign.currency_code} {((campaign.raised || 0) / 100).toLocaleString()} of {campaign.currency_code}{" "}
                    {((campaign.goal || 0) / 100).toLocaleString()}
                  </div>
                  <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${Math.min(100, ((campaign.raised || 0) / Math.max(1, campaign.goal || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {step !== "done" && (
            <div className="py-1">
              <StepIndicator step={step} steps={steps} />
            </div>
          )}

          {step === "done" ? (
            <GlassSection icon={CheckCircle2} title="You're registered!">
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for registering for <strong className="text-primary">{ev.name}</strong>. You can start preparing to have a great time with the Lord.
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/events">Browse other events</Link>
                </Button>
              </div>
            </GlassSection>
          ) : (
            <>
              {step === "identify" && (
                <GlassSection
                  icon={UserCheck}
                  title="Who is registering?"
                  description="Enter the email or phone you used when you registered with WCA. If you're new, we'll get you onboarded right here."
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { mode: "email", label: "Email", Icon: Mail, color: "blue" },
                        { mode: "phone", label: "Telephone", Icon: Phone, color: "amber" },
                      ] as const).map(({ mode, label, Icon, color }) => {
                        const selected = lookupMode === mode;
                        const palette =
                          color === "blue"
                            ? selected
                              ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                              : "border-border bg-background/60 hover:border-blue-400/50"
                            : selected
                              ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "border-border bg-background/60 hover:border-amber-400/50";
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setLookupMode(mode);
                              setLookupValue("");
                              setLookupStatus("idle");
                              setPrimaryMember(null);
                            }}
                            className={cn(
                              "relative flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all",
                              palette
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors shrink-0",
                                selected ? "border-green-500 bg-green-500" : "border-muted-foreground/40 bg-background"
                              )}
                            >
                              {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                            </span>
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        className="rounded-xl bg-background/60"
                        type={lookupMode === "email" ? "email" : "tel"}
                        placeholder={lookupMode === "email" ? "you@example.com" : "Phone number"}
                        value={lookupValue}
                        onChange={(e) => {
                          setLookupValue(e.target.value);
                          setLookupStatus("idle");
                          setPrimaryMember(null);
                          setRegistrationMode(null);
                        }}
                      />
                      {!(lookupStatus === "found" && lookupValue.trim() === lastCheckedValue) && (
                        <Button onClick={handleLookup} disabled={lookupStatus === "checking" || !lookupValue.trim()} className="rounded-xl">
                          {lookupStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          <span className="ml-1">Check</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {lookupStatus === "found" && primaryMember && (
                    <>
                      {renderModeSelector(primaryMember.first_name)}
                      <div className="pt-2">{renderActions()}</div>
                    </>
                  )}

                  {lookupStatus === "missing" && (
                    <Alert className="border-amber-500/30 bg-amber-500/5">
                      <UserCheck className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-justify">
                        We don't have you in the system yet. Click <strong>Continue</strong> to onboard and complete your registration.
                      </AlertDescription>
                    </Alert>
                  )}

                  {lookupStatus === "missing" && (
                    <div className="pt-2">{renderActions()}</div>
                  )}
                </GlassSection>
              )}

              {step === "onboard" && (
                <div className="space-y-5">
                  <SpecialEventOnboardForm
                    value={primaryOnboard}
                    onChange={setPrimaryOnboard}
                  />
                  {isOnboardValid(primaryOnboard) && (
                    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-3 shadow-sm">
                      {renderModeSelector(primaryOnboard.first_name || "there")}
                    </div>
                  )}
                  <div className="pt-2">{renderActions()}</div>
                </div>
              )}

              {step === "details" && (
                <GlassSection
                  icon={Users}
                  title="Family & Children"
                  description="Tick the family members joining you. You can also add someone new."
                >
                  {family.some((f) => f.prefilled) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Your family
                      </p>
                      {family.map((row, i) =>
                        row.prefilled ? (
                          <label
                            key={i}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border px-3 py-3 cursor-pointer transition-colors",
                              row.attending
                                ? "bg-primary/10 border-primary/40"
                                : "bg-background/40 border-border/40 hover:bg-background/60"
                            )}
                          >
                            <Checkbox
                              checked={!!row.attending}
                              onCheckedChange={(v) =>
                                setFamily((p) =>
                                  p.map((r, idx) => (idx === i ? { ...r, attending: !!v } : r))
                                )
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">
                                  {row.last_name} {row.first_name}
                                </span>
                                <Badge variant="secondary" className="text-[10px] capitalize">
                                  {row.relationship_type}
                                </Badge>
                                {row.is_child && (
                                  <Badge variant="outline" className="text-[10px]">child</Badge>
                                )}
                              </div>
                            </div>
                          </label>
                        ) : null
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={addFamily} variant="outline" size="sm" className="rounded-xl">
                      <Plus className="h-4 w-4 mr-1" />
                      Add person
                    </Button>
                  </div>

                  {family.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/50 rounded-xl">
                      No family added — that's fine if you're attending alone.
                    </p>
                  )}

                  {family.map((row, i) =>
                    row.prefilled ? null : (
                      <div key={i} className="rounded-xl border border-border/40 bg-background/40 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <select
                            className={cn(nativeSelectClassName, "w-auto")}
                            value={row.relationship_type}
                            onChange={(e) => setFamily((p) => p.map((r, idx) => (idx === i ? { ...r, relationship_type: e.target.value } : r)))}
                          >
                            {REL_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <Button variant="ghost" size="icon" onClick={() => removeFamily(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { mode: "email", label: "Email", Icon: Mail, color: "blue" },
                              { mode: "phone", label: "Telephone", Icon: Phone, color: "amber" },
                            ] as const).map(({ mode, label, Icon, color }) => {
                              const selected = row.lookupMode === mode;
                              const palette =
                                color === "blue"
                                  ? selected
                                    ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                    : "border-border bg-background/60 hover:border-blue-400/50"
                                  : selected
                                    ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                    : "border-border bg-background/60 hover:border-amber-400/50";
                              return (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() =>
                                    setFamily((p) =>
                                      p.map((r, idx) =>
                                        idx === i
                                          ? { ...r, lookupMode: mode, lookupValue: "", status: "idle", existing_member_id: undefined }
                                          : r
                                      )
                                    )
                                  }
                                  className={cn(
                                    "relative flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all",
                                    palette
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors shrink-0",
                                      selected ? "border-green-500 bg-green-500" : "border-muted-foreground/40 bg-background"
                                    )}
                                  >
                                    {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                                  </span>
                                  <Icon className="h-4 w-4" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                          <Input
                            className="rounded-xl bg-background/60"
                            type={row.lookupMode === "email" ? "email" : "tel"}
                            placeholder={row.lookupMode === "email" ? "you@example.com" : "Phone number"}
                            value={row.lookupValue}
                            onChange={(e) =>
                              setFamily((p) =>
                                p.map((r, idx) =>
                                  idx === i ? { ...r, lookupValue: e.target.value, status: "idle", existing_member_id: undefined } : r
                                )
                              )
                            }
                          />
                          <Button
                            onClick={() => lookupFamily(i)}
                            disabled={row.status === "checking" || !row.lookupValue.trim()}
                            className="rounded-xl w-full"
                          >
                            {row.status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            <span className="ml-1">Check</span>
                          </Button>
                        </div>
                        {row.status === "found" && (
                          <Alert className="border-green-500/30 bg-green-500/5">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                              Linked: {row.last_name} {row.first_name}{row.is_child ? " (child)" : ""}
                            </AlertDescription>
                          </Alert>
                        )}
                        {row.status === "missing" && row.onboard && (
                          <div className="pt-3 border-t border-border/30">
                            <p className="text-sm font-medium mb-3">
                              We don't have this person yet — onboard them here.
                            </p>
                            <SpecialEventOnboardForm
                              value={row.onboard}
                              onChange={(next) =>
                                setFamily((p) =>
                                  p.map((r, idx) =>
                                    idx === i
                                      ? {
                                          ...r,
                                          onboard: next,
                                          first_name: next.first_name,
                                          last_name: next.last_name,
                                          email: next.email,
                                          phone: next.phone,
                                          date_of_birth: next.date_of_birth,
                                          gender: next.gender,
                                          address: next.address,
                                          is_child:
                                            calcAge(next.date_of_birth) !== null &&
                                            (calcAge(next.date_of_birth) as number) < 16,
                                        }
                                      : r
                                  )
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  <div className="pt-2">{renderActions()}</div>
                </GlassSection>
              )}

              {step === "extras" && (
                <div className="space-y-5">
                  {ev.collect_lodging && (
                    <GlassSection icon={Bed} title="Lodging" description="Let us know if you need accommodation arranged by the organizers.">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={needsLodging} onCheckedChange={(v) => setNeedsLodging(!!v)} />
                        I need lodging provided by the organizers
                      </label>
                      {needsLodging && (
                        <div className="space-y-3 pt-2">

                          {eventDays.length > 0 && (
                            <div>
                              <Label className="text-xs">Days you will attend</Label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                                {eventDays.map((d) => {
                                  const checked = attendingDays.includes(d);
                                  return (
                                    <label
                                      key={d}
                                      className={cn(
                                        "flex items-center gap-2 text-sm rounded-xl border border-border/40 px-3 py-2 cursor-pointer transition-colors",
                                        checked ? "bg-primary/10 border-primary/40" : "bg-background/40 hover:bg-background/60"
                                      )}
                                    >
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(v) =>
                                          setAttendingDays((prev) =>
                                            v ? [...prev, d].sort() : prev.filter((x) => x !== d)
                                          )
                                        }
                                      />
                                      {format(new Date(d), "EEE, MMM d")}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </GlassSection>
                  )}

                  {ev.collect_meal_preferences && (
                    <GlassSection icon={Utensils} title="Meal preferences" description="Select any dietary preferences or restrictions we should accommodate.">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {MEAL_OPTIONS.map((m) => (
                          <label
                            key={m}
                            className={cn(
                              "flex items-center gap-2 text-sm rounded-xl border border-border/40 px-3 py-2 cursor-pointer transition-colors",
                              mealPrefs.includes(m) ? "bg-primary/10 border-primary/40" : "bg-background/40 hover:bg-background/60"
                            )}
                          >
                            <Checkbox
                              checked={mealPrefs.includes(m)}
                              onCheckedChange={(v) => setMealPrefs((p) => (v ? [...p, m] : p.filter((x) => x !== m)))}
                            />
                            {m}
                          </label>
                        ))}
                      </div>
                      <Textarea
                        className="rounded-xl bg-background/60"
                        placeholder="Other dietary notes or allergies"
                        value={dietaryNotes}
                        onChange={(e) => setDietaryNotes(e.target.value)}
                      />
                    </GlassSection>
                  )}

                  {ev.collect_pledges && campaign && (
                    <GlassSection icon={Heart} title="Pledge to support" description="Optional — pledge an amount to help fund the event. We'll follow up to collect.">
                      <div className="rounded-xl bg-background/40 border border-border/40 p-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{campaign.name}</span>
                          <span>
                            {campaign.currency_code} {((campaign.raised || 0) / 100).toLocaleString()} / {((campaign.goal || 0) / 100).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(100, ((campaign.raised || 0) / Math.max(1, campaign.goal || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{campaign.currency_code}</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="rounded-xl bg-background/60"
                          value={pledgeAmount === "" ? "" : Number(pledgeAmount).toLocaleString("en-US")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^\d]/g, "");
                            if (digits === "") return setPledgeAmount("");
                            const n = Number(digits);
                            setPledgeAmount(Number.isFinite(n) ? n : "");
                          }}
                        />
                      </div>
                    </GlassSection>
                  )}
                  <div className="pt-2">{renderActions()}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
