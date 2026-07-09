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
import { fr as frLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
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
  prefilled?: boolean;
  attending?: boolean;
  onboard?: OnboardFormValue;
};

// Stored values stay English so backend payload and analytics don't change.
const REL_OPTIONS: { value: string; key: Parameters<ReturnType<typeof useLanguage>["t"]>[0] }[] = [
  { value: "spouse", key: "sr_rel_spouse" },
  { value: "child", key: "sr_rel_child" },
  { value: "parent", key: "sr_rel_parent" },
  { value: "sibling", key: "sr_rel_sibling" },
  { value: "guardian", key: "sr_rel_guardian" },
  { value: "other", key: "sr_rel_other" },
];

const HEALTH_OPTIONS: { value: string; key: Parameters<ReturnType<typeof useLanguage>["t"]>[0] }[] = [
  { value: "Food allergy", key: "sr_health_food" },
  { value: "Drug allergy", key: "sr_health_drug" },
  { value: "Asthma / Respiratory", key: "sr_health_asthma" },
  { value: "Diabetes", key: "sr_health_diabetes" },
  { value: "Hypertension", key: "sr_health_hypertension" },
  { value: "Mobility / Accessibility", key: "sr_health_mobility" },
  { value: "Other health/allergy", key: "sr_health_other" },
];

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
  const { t, language, localizedField } = useLanguage();
  const dateLocale = language === "fr" ? { locale: frLocale } : undefined;

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

  const [primaryOnboard, setPrimaryOnboard] = useState<OnboardFormValue>(emptyOnboardValue());

  const [family, setFamily] = useState<FamilyRow[]>([]);

  const [needsLodging, setNeedsLodging] = useState(true);
  const [attendingDays, setAttendingDays] = useState<string[]>([]);
  const [mealPrefs, setMealPrefs] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [pledgeAmount, setPledgeAmount] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [isUpdatingExisting, setIsUpdatingExisting] = useState(false);
  const [wasUpdated, setWasUpdated] = useState(false);
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");

  const campaign = (event as any)?.fundraising_campaigns ?? null;
  const ev: any = event;

  const eventName = (localizedField(ev?.name, ev?.name_fr) as string) || ev?.name || "";
  const eventLocation = (localizedField(ev?.location_name, ev?.location_name_fr) as string) || ev?.location_name || "";

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
    const base: { key: StepKey; label: string }[] = [{ key: "identify", label: t("sr_step_you") }];
    if (needsOnboarding) base.push({ key: "onboard", label: t("sr_step_onboard") });
    if (registrationMode === "family") base.push({ key: "details", label: t("sr_step_family") });
    if (hasExtras) base.push({ key: "extras", label: t("sr_step_extras") });
    return base;
  }, [hasExtras, registrationMode, needsOnboarding, t]);

  const handleLookup = async () => {
    if (!lookupValue.trim()) return;
    setLookupStatus("checking");
    const value = lookupValue.trim();
    const payload: any = lookupMode === "email" ? { email: value } : { phone: value };
    if ((event as any)?.id) payload.event_id = (event as any).id;
    const { data, error } = await supabase.functions.invoke("event-pre-register-lookup", { body: payload });
    setLastCheckedValue(value);
    if (error) {
      setLookupStatus("missing");
      return;
    }
    if ((data as Lookup)?.found) {
      const lk = data as Lookup & { existing_registration?: any };
      setPrimaryMember(lk.member!);
      const existingReg = lk.existing_registration || null;
      setIsUpdatingExisting(!!existingReg);
      setPrimaryEmail(existingReg?.email || lk.member?.email || (lookupMode === "email" ? value : ""));
      setPrimaryPhone(existingReg?.phone || lk.member?.phone || (lookupMode === "phone" ? value : ""));

      // Build family rows. Prefer the people already on the existing registration
      // (so we can pre-attend them); fall back to all known relations.
      const existingFamilyIds = new Set<string>(
        (existingReg?.family || []).map((f: any) => f.member_id)
      );
      const baseRelations = (lk.relations || []);
      // Add any registered family that isn't already in relations (edge case).
      (existingReg?.family || []).forEach((f: any) => {
        if (!baseRelations.find((r) => r.member_id === f.member_id)) {
          baseRelations.push({
            member_id: f.member_id,
            profile_id: "",
            first_name: f.first_name,
            last_name: f.last_name,
            email: f.email,
            phone: f.phone,
            date_of_birth: f.date_of_birth,
            is_child: !!f.is_child,
            relationship_type: f.relationship_type || "other",
          });
        }
      });

      const prefilled: FamilyRow[] = baseRelations.map((r) => ({
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
        attending: existingFamilyIds.has(r.member_id),
      }));
      setFamily(prefilled);

      if (existingReg) {
        // Preload extras + pledge
        setNeedsLodging(!!existingReg.needs_lodging);
        if (Array.isArray(existingReg.meal_preferences)) {
          setMealPrefs(existingReg.meal_preferences);
        }
        if (existingReg.dietary_notes) setDietaryNotes(existingReg.dietary_notes);
        if (existingReg.pledge_amount) setPledgeAmount(Number(existingReg.pledge_amount));
        // Default mode based on previous registration
        setRegistrationMode(existingFamilyIds.size > 0 ? "family" : "individual");
        // Days: if arrival + departure exist, mark them
        if (existingReg.arrival_date && existingReg.departure_date) {
          setAttendingDays([existingReg.arrival_date, existingReg.departure_date].filter((v, i, a) => a.indexOf(v) === i));
        }
      }
      setLookupStatus("found");
    } else {
      setPrimaryMember(null);
      setIsUpdatingExisting(false);
      setPrimaryEmail("");
      setPrimaryPhone("");
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

  const canProceedFromIdentify =
    (lookupStatus === "found" && registrationMode !== null) ||
    lookupStatus === "missing";

  const canProceedFromOnboard =
    isOnboardValid(primaryOnboard) && registrationMode !== null;

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
    has_completed_foundation_school: o.has_completed_foundation_school || null,
    foundation_school_date: o.foundation_school_date || null,
    is_baptized: o.is_baptized || null,
    baptism_date: o.baptism_date || null,
    ministry_interests: o.ministry_interests,
    dcg_id: o.dcg_id || null,
    relationships: o.relationships,
    referral_source: o.referral_source || null,
    referral_social_media: o.referral_social_media || null,
    referral_member_ids: o.referral_member_ids,
    referral_relationship_type: o.referral_relationship_type || null,
    referral_other_details: o.referral_other_details || null,
    join_interest: o.join_interest || null,
  });

  const countDigits = (value?: string | null) => (value?.match(/\d/g) || []).length;
  const isValidEmail = (value?: string | null) => /^\S+@\S+\.\S+$/.test((value || "").trim());

  const getOnboardMissingFields = (o: OnboardFormValue) => {
    const missing: string[] = [];
    if (!o.region_id) missing.push(t("sr_region_label"));
    if (!o.last_name?.trim()) missing.push(t("sr_family_name"));
    if (!o.first_name?.trim()) missing.push(t("sr_other_names"));
    if (!isValidEmail(o.email)) missing.push(t("sr_email"));
    if (!o.phone?.trim() || countDigits(o.phone) < 9) missing.push(t("sr_phone"));
    if (!o.address?.trim()) missing.push(t("sr_address"));
    if (!o.date_of_birth) missing.push(t("sr_dob"));
    if (!o.gender) missing.push(t("sr_gender"));
    if (o.attendee_type === "member") {
      if (!o.dcg_id) missing.push(t("sr_dcg_label"));
    } else {
      if (!o.occupation) missing.push(t("sr_occupation"));
      if (o.referral_source === "invited_by" && (o.referral_member_ids.length === 0 || !o.referral_relationship_type)) {
        missing.push(t("sr_referral_q"));
      }
      if (o.referral_source === "social_media" && !o.referral_social_media) missing.push(t("sr_referral_social_media"));
      if (o.referral_source === "other" && !o.referral_other_details?.trim()) missing.push(t("sr_referral_other"));
    }
    return missing;
  };

  const getSubmissionValidationErrors = () => {
    const errors: string[] = [];
    if (!event) errors.push(t("sr_event_unavailable_title"));
    if (primaryMember) {
      if (!isValidEmail(primaryEmail || primaryMember.email)) errors.push(`${t("sr_primary_contact")}: ${t("sr_email")}`);
      if (countDigits(primaryPhone || primaryMember.phone) < 9) errors.push(`${t("sr_primary_contact")}: ${t("sr_phone")}`);
    } else {
      const missing = getOnboardMissingFields(primaryOnboard);
      if (missing.length) errors.push(`${t("sr_personal_info")}: ${missing.join(", ")}`);
    }

    if (registrationMode === "family") {
      family.forEach((f, idx) => {
        if (f.prefilled) return;
        const label = `${t("sr_family_member")} ${idx + 1}`;
        if (!f.relationship_type) errors.push(`${label}: ${t("sr_relationship_required")}`);
        if (f.existing_member_id) return;
        if (!f.onboard) {
          errors.push(`${label}: ${t("sr_check_or_complete")}`);
          return;
        }
        const missing = getOnboardMissingFields(f.onboard);
        if (missing.length) errors.push(`${label}: ${missing.join(", ")}`);
      });
    }

    return errors;
  };

  const canSubmit = useMemo(() => {
    return !!event;
  }, [event]);

  const safeParseError = async (err: any) => {
    try {
      const res = err?.context;
      if (res && typeof res.json === "function") return await res.json();
    } catch { /* ignore */ }
    return null;
  };

  const submit = async () => {
    if (!event) return;
    const validationErrors = getSubmissionValidationErrors();
    if (validationErrors.length) {
      toast.error(t("sr_validation_title"), {
        description: validationErrors.slice(0, 4).join(" • "),
      });
      return;
    }

    const familyToSend =
      registrationMode === "family"
        ? family.filter((f) => {
            if (f.prefilled) return !!f.attending;
            return !!f.existing_member_id || (f.onboard && isOnboardValid(f.onboard));
          })
        : [];

    // Client-side duplicate check: same email/phone reused across attendees.
    const normEmail = (s?: string | null) => (s ?? "").trim().toLowerCase();
    const normPhone = (s?: string | null) => (s ?? "").replace(/\D+/g, "");
    const emailSlots: string[] = [];
    const phoneSlots: string[] = [];
    const primaryEmailVal = primaryMember ? primaryEmail || primaryMember.email : primaryOnboard.email;
    if (primaryEmailVal) emailSlots.push(normEmail(primaryEmailVal));
    const primaryPhoneVal = primaryMember ? primaryPhone || primaryMember.phone : primaryOnboard.phone;
    if (primaryPhoneVal) phoneSlots.push(normPhone(primaryPhoneVal));
    familyToSend.forEach((f) => {
      const em = f.existing_member_id ? normEmail(f.email) : normEmail(f.onboard?.email);
      const ph = f.existing_member_id ? normPhone(f.phone) : normPhone(f.onboard?.phone);
      if (em) emailSlots.push(em);
      if (ph) phoneSlots.push(ph);
    });
    const firstDup = (arr: string[]) => {
      const seen = new Set<string>();
      for (const v of arr) {
        if (!v) continue;
        if (seen.has(v)) return v;
        seen.add(v);
      }
      return null;
    };
    const dupE = firstDup(emailSlots);
    if (dupE) {
      toast.error(t("sr_dup_email").replace("{value}", dupE), { description: t("sr_dup_hint") });
      return;
    }
    const dupP = firstDup(phoneSlots);
    if (dupP) {
      toast.error(t("sr_dup_phone").replace("{value}", dupP), { description: t("sr_dup_hint") });
      return;
    }

    setSubmitting(true);
    try {
      const body: any = {
        event_id: (event as any).id,
        primary_member_id: primaryMember?.id ?? null,
        primary_new: primaryMember ? null : buildNewRegistrant(primaryOnboard),
        primary_pledger_name: primaryMember
          ? `${primaryMember.last_name || ""} ${primaryMember.first_name || ""}`.trim()
          : `${primaryOnboard.last_name || ""} ${primaryOnboard.first_name || ""}`.trim(),
        primary_email: primaryEmailVal,
        primary_phone: primaryPhoneVal,
        family: familyToSend.map((f) => ({
          relationship_type: f.relationship_type,
          existing_member_id: f.existing_member_id || null,
          is_child: !!f.is_child,
          submitted_email: f.existing_member_id ? f.email || null : f.onboard?.email || null,
          submitted_phone: f.existing_member_id ? f.phone || null : f.onboard?.phone || null,
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
      const errPayload: any = (data as any)?.error ? data : error?.context ? await safeParseError(error) : null;
      if (errPayload?.error || error) {
        const code = errPayload?.error;
        if (code === "duplicate_contact") {
          const key = errPayload.field === "phone" ? "sr_dup_phone" : "sr_dup_email";
          toast.error(t(key).replace("{value}", errPayload.value ?? ""), { description: t("sr_dup_hint") });
        } else if (code === "duplicate_member") {
          toast.error(t("sr_dup_member"));
        } else {
          throw new Error(errPayload?.detail || errPayload?.error || error?.message || t("sr_toast_error"));
        }
        return;
      }
      setWasUpdated(!!(data as any)?.was_update);
      setStep("done");
      const isUpdate = !!(data as any)?.was_update;
      toast.success(
        isUpdate
          ? t("sr_toast_updated")
          : `${t("sr_toast_success_prefix")} ${(data as any).registered} ${t("sr_toast_success_suffix")}`
      );
    } catch (e: any) {
      toast.error(e.message || t("sr_toast_error"));
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
              <h2 className="text-xl font-semibold">{t("sr_event_unavailable_title")}</h2>
              <p className="text-sm text-muted-foreground">{t("sr_event_unavailable_desc")}</p>
              <Button asChild>
                <Link to="/events">{t("sr_back_to_events")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const renderActions = () => {
    if (step === "done") return null;
    const currentIdx = steps.findIndex((s) => s.key === step);
    const isLast = currentIdx === steps.length - 1;
    const isFirst = currentIdx === 0;

    const onNext = () => {
      if (isLast) {
        submit();
      } else if (step === "onboard" && !isOnboardValid(primaryOnboard)) {
        const missing = getOnboardMissingFields(primaryOnboard);
        toast.error(t("sr_validation_title"), {
          description: missing.slice(0, 6).join(", "),
        });
      } else {
        setStep(steps[currentIdx + 1].key);
      }
    };
    const onBack = () => {
      if (!isFirst) setStep(steps[currentIdx - 1].key);
    };
    const nextDisabled =
      (step === "identify" && !canProceedFromIdentify) ||
      (isLast && (!canSubmit || submitting));

    return (
      <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:justify-end">
        {!isFirst && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={submitting}
            className="w-full col-span-1 sm:w-auto rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("sr_back")}
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            "w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow",
            isFirst ? "col-span-3" : "col-span-2"
          )}
        >
          {isLast ? (
            submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("sr_submitting")}
              </>
            ) : (
              <>{isUpdatingExisting ? t("sr_update_cta") : t("sr_confirm")} <CheckCircle2 className="h-4 w-4 ml-1" /></>
            )
          ) : (
            <>{t("sr_continue")} <ArrowRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    );
  };

  const renderModeSelector = (firstName: string) => (
    <div className="space-y-3">
      <Alert className="border-green-500/30 bg-green-500/5">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-justify">
          {t("sr_hello_prefix")} <strong className="text-primary">{firstName}</strong>{t("sr_hello_middle")}{" "}
          <strong className="text-primary">{eventName}</strong> {t("sr_hello_suffix")}
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-2">
        {([
          { mode: "individual", label: t("sr_individual"), Icon: User, color: "indigo" },
          { mode: "family", label: t("sr_family_mode"), Icon: Users, color: "rose" },
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
              <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white mb-3 border-0">{t("sr_badge")}</Badge>
              <h1 className="text-2xl md:text-fluid-3xl font-bold leading-tight">{eventName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm opacity-90">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  {format(new Date(ev.start_datetime), "PPP", dateLocale)}
                  {ev.end_datetime ? ` – ${format(new Date(ev.end_datetime), "PPP", dateLocale)}` : ""}
                </span>
                {eventLocation && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {eventLocation}
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
                    {t("sr_fundraising_goal")}: {campaign.currency_code}{" "}
                    {((campaign.goal || 0) / 100).toLocaleString()}
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
            <GlassSection icon={CheckCircle2} title={wasUpdated ? t("sr_done_updated_title") : t("sr_done_title")}>
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {wasUpdated ? (
                    <>{t("sr_done_updated_body_prefix")} <strong className="text-primary">{eventName}</strong>{t("sr_done_updated_body_suffix")}</>
                  ) : (
                    <>{t("sr_done_body_prefix")} <strong className="text-primary">{eventName}</strong>{t("sr_done_body_suffix")}</>
                  )}
                </p>
                <Button asChild className="rounded-xl">
                  <Link to="/events">{t("sr_browse_other")}</Link>
                </Button>
              </div>
            </GlassSection>
          ) : (
            <>
              {step === "identify" && (
                <GlassSection
                  icon={UserCheck}
                  title={t("sr_identify_title")}
                  description={t("sr_identify_desc")}
                >
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { mode: "email", label: t("sr_email"), Icon: Mail, color: "blue" },
                        { mode: "phone", label: t("sr_telephone"), Icon: Phone, color: "amber" },
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
                              setPrimaryEmail("");
                              setPrimaryPhone("");
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
                        placeholder={lookupMode === "email" ? t("sr_email_placeholder") : t("sr_phone_placeholder")}
                        value={lookupValue}
                        onChange={(e) => {
                          setLookupValue(e.target.value);
                          setLookupStatus("idle");
                          setPrimaryMember(null);
                          setPrimaryEmail("");
                          setPrimaryPhone("");
                          setRegistrationMode(null);
                        }}
                      />
                      {!(lookupStatus === "found" && lookupValue.trim() === lastCheckedValue) && (
                        <Button onClick={handleLookup} disabled={lookupStatus === "checking" || !lookupValue.trim()} className="rounded-xl">
                          {lookupStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          <span className="ml-1">{t("sr_check")}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {lookupStatus === "found" && primaryMember && (
                    <>
                      {isUpdatingExisting && (
                        <Alert className="border-blue-500/30 bg-blue-500/5">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-justify">
                            <strong>{t("sr_update_banner_title")}.</strong> {t("sr_update_banner_desc")}
                          </AlertDescription>
                        </Alert>
                      )}
                      {renderModeSelector(primaryMember.first_name)}
                      <div className="grid gap-3 sm:grid-cols-2 pt-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("sr_email")}</Label>
                          <Input
                            className="rounded-xl bg-background/60"
                            type="email"
                            placeholder={t("sr_email_placeholder")}
                            value={primaryEmail}
                            onChange={(e) => setPrimaryEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t("sr_phone")}</Label>
                          <Input
                            className="rounded-xl bg-background/60"
                            type="tel"
                            placeholder={t("sr_phone_placeholder_full")}
                            value={primaryPhone}
                            onChange={(e) => setPrimaryPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="pt-2">{renderActions()}</div>
                    </>
                  )}

                  {lookupStatus === "missing" && (
                    <Alert className="border-amber-500/30 bg-amber-500/5">
                      <UserCheck className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-justify">
                        {t("sr_not_in_system")} <strong>{t("sr_not_in_system_cta")}</strong> {t("sr_not_in_system_tail")}
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
                  title={t("sr_family_section_title")}
                  description={t("sr_family_section_desc")}
                >
                  {family.some((f) => f.prefilled) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {t("sr_your_family")}
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
                                  {t((REL_OPTIONS.find(o => o.value === row.relationship_type)?.key) || "sr_rel_other")}
                                </Badge>
                                {row.is_child && (
                                  <Badge variant="outline" className="text-[10px]">{t("sr_child_badge")}</Badge>
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
                      {t("sr_add_person")}
                    </Button>
                  </div>

                  {family.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/50 rounded-xl">
                      {t("sr_no_family")}
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
                              <option key={o.value} value={o.value}>{t(o.key)}</option>
                            ))}
                          </select>
                          <Button variant="ghost" size="icon" onClick={() => removeFamily(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {([
                              { mode: "email", label: t("sr_email"), Icon: Mail, color: "blue" },
                              { mode: "phone", label: t("sr_telephone"), Icon: Phone, color: "amber" },
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
                            placeholder={row.lookupMode === "email" ? t("sr_email_placeholder") : t("sr_phone_placeholder")}
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
                            <span className="ml-1">{t("sr_check")}</span>
                          </Button>
                        </div>
                        {row.status === "found" && (
                          <Alert className="border-green-500/30 bg-green-500/5">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription>
                              {t("sr_linked")}: {row.last_name} {row.first_name}{row.is_child ? ` (${t("sr_child_badge")})` : ""}
                            </AlertDescription>
                          </Alert>
                        )}
                        {row.status === "missing" && row.onboard && (
                          <div className="pt-3 border-t border-border/30">
                            <p className="text-sm font-medium mb-3">{t("sr_dont_have_person")}</p>
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
                    <GlassSection icon={Bed} title={t("sr_lodging_title")} description={t("sr_lodging_desc")}>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={needsLodging} onCheckedChange={(v) => setNeedsLodging(!!v)} />
                        {t("sr_need_lodging")}
                      </label>
                      {needsLodging && (
                        <div className="space-y-3 pt-2">
                          {eventDays.length > 0 && (
                            <div>
                              <Label className="text-xs">{t("sr_days_attend")}</Label>
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
                                      {format(new Date(d), "EEE, MMM d", dateLocale)}
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
                    <GlassSection icon={Utensils} title={t("sr_health_title")} description={t("sr_health_desc")}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {HEALTH_OPTIONS.map((m) => (
                          <label
                            key={m.value}
                            className={cn(
                              "flex items-center gap-2 text-sm rounded-xl border border-border/40 px-3 py-2 cursor-pointer transition-colors",
                              mealPrefs.includes(m.value) ? "bg-primary/10 border-primary/40" : "bg-background/40 hover:bg-background/60"
                            )}
                          >
                            <Checkbox
                              checked={mealPrefs.includes(m.value)}
                              onCheckedChange={(v) => setMealPrefs((p) => (v ? [...p, m.value] : p.filter((x) => x !== m.value)))}
                            />
                            {t(m.key)}
                          </label>
                        ))}
                      </div>
                      <Textarea
                        className="rounded-xl bg-background/60"
                        placeholder={t("sr_other_health_placeholder")}
                        value={dietaryNotes}
                        onChange={(e) => setDietaryNotes(e.target.value)}
                      />
                    </GlassSection>
                  )}

                  {ev.collect_pledges && campaign && (
                    <GlassSection icon={Heart} title={t("sr_pledge_title")} description={t("sr_pledge_desc")}>
                      <div className="rounded-xl bg-background/40 border border-border/40 p-3 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{campaign.name}</span>
                          <span>
                            {campaign.currency_code} {((campaign.goal || 0) / 100).toLocaleString()}
                          </span>
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
