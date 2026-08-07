import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GlassSection, StepIndicator } from "@/components/events/EventFlowUI";
import {
  Loader2, Star, CheckCircle2, Search, UserCheck, Mail, Phone, Check,
  Sparkles, Bed, MessageSquareHeart, Calendar as CalendarIcon, MapPin,
  ArrowLeft, ArrowRight,
} from "lucide-react";

type Lang = "en" | "fr";

const T = {
  en: {
    title: "Share Your Feedback",
    subtitle: "Tell us about your experience. All questions are optional and your response is anonymous.",
    badge: "Event feedback",
    continue: "Continue",
    back: "Back",
    submitError: "Something went wrong. Please try again.",
    emptyForm: "Please answer at least one question before submitting.",
    stepExperience: "Experience",
    stepLogistics: "Logistics",
    stepTestimony: "Testimony",

    aboutYou: "About you",
    firstTime: "Is this your first time attending this event?",
    yes: "Yes",
    no: "No",
    fellowship: "Which fellowship / chapter do you belong to?",
    experience: "General experience",
    overall: "Overall experience",
    communication: "Pre-event communication",
    impactSessions: "Which sessions or teachings impacted you most?",
    teachingImpact: "How have the teachings impacted your life?",
    enjoyed: "What did you enjoy most?",
    otherSpecify: "Other (please specify)",
    logistics: "Logistics & comfort",
    lodging: "Lodging / accommodation",
    food: "Food & meals",
    children: "Children management",
    schedule: "Any feedback on the programme schedule?",
    challenges: "Did you face any challenges?",
    future: "Looking ahead",
    futureTopics: "What topics would you like covered next time?",
    suggestions: "Any other suggestions?",
    testimonialTitle: "Your testimony (optional)",
    testimonialHelp: "Share what God did for you. Approved testimonies may be published on the event page.",
    testimonial: "Your testimony",
    testimonialRole: "How should we describe you? (e.g. Student, Attendee)",
    submit: "Submit feedback",
    submitting: "Submitting...",
    thanksTitle: "Thank you!",
    thanksBody: "Your feedback has been recorded. We are grateful for your time.",
    thanksTestimony: "Your testimony has been submitted and will appear after review.",
    backToEvent: "Back to event",
    notRated: "Not rated",
    testimonialName: "Name to display (leave blank to stay anonymous)",
    anonymousNote: "This form is anonymous — we do not collect your name, email or phone number.",

  },
  fr: {
    title: "Partagez vos impressions",
    subtitle: "Parlez-nous de votre expérience. Toutes les questions sont facultatives et votre réponse est anonyme.",
    badge: "Avis sur l'événement",
    continue: "Continuer",
    back: "Retour",
    submitError: "Une erreur est survenue. Veuillez réessayer.",
    emptyForm: "Veuillez répondre à au moins une question avant d'envoyer.",

    stepExperience: "Expérience",
    stepLogistics: "Logistique",
    stepTestimony: "Témoignage",
    aboutYou: "À propos de vous",
    firstTime: "Est-ce votre première participation à cet événement ?",
    yes: "Oui",
    no: "Non",
    fellowship: "À quelle cellule / assemblée appartenez-vous ?",
    experience: "Expérience générale",
    overall: "Expérience globale",
    communication: "Communication avant l'événement",
    impactSessions: "Quelles sessions ou enseignements vous ont le plus marqué ?",
    teachingImpact: "Quel impact les enseignements ont-ils eu sur votre vie ?",
    enjoyed: "Qu'avez-vous le plus apprécié ?",
    otherSpecify: "Autre (précisez)",
    logistics: "Logistique & confort",
    lodging: "Hébergement",
    food: "Nourriture & repas",
    children: "Gestion des enfants",
    schedule: "Un retour sur le programme ?",
    challenges: "Avez-vous rencontré des difficultés ?",
    future: "Perspectives",
    futureTopics: "Quels thèmes souhaiteriez-vous aborder la prochaine fois ?",
    suggestions: "Autres suggestions ?",
    testimonialTitle: "Votre témoignage (facultatif)",
    testimonialHelp: "Partagez ce que Dieu a fait pour vous. Les témoignages approuvés peuvent être publiés.",
    testimonial: "Votre témoignage",
    testimonialRole: "Comment vous décrire ? (ex. Étudiant, Participant)",
    submit: "Envoyer",
    submitting: "Envoi...",
    thanksTitle: "Merci !",
    thanksBody: "Vos impressions ont été enregistrées. Merci pour votre temps.",
    thanksTestimony: "Votre témoignage a été soumis et apparaîtra après validation.",
    backToEvent: "Retour à l'événement",
    notRated: "Non noté",
    testimonialName: "Nom à afficher (laissez vide pour rester anonyme)",
    anonymousNote: "Ce formulaire est anonyme — nous ne collectons ni nom, ni e-mail, ni téléphone.",

  },
} as const;

export const ENJOY_OPTIONS: { value: string; en: string; fr: string }[] = [
  { value: "teachings", en: "The teachings", fr: "Les enseignements" },
  { value: "worship", en: "Worship sessions", fr: "Les moments d'adoration" },
  { value: "fellowship", en: "Fellowship with others", fr: "La communion fraternelle" },
  { value: "prayer", en: "Prayer sessions", fr: "Les temps de prière" },
  { value: "activities", en: "Activities & games", fr: "Les activités et jeux" },
  { value: "food", en: "The food", fr: "La nourriture" },
  { value: "organization", en: "The organization", fr: "L'organisation" },
  { value: "other", en: "Other", fr: "Autre" },
];

function StarRating({
  value,
  onChange,
  label,
  notRatedLabel,
}: { value: number | null; onChange: (v: number) => void; label: string; notRatedLabel: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${label}: ${n}`}
            onClick={() => onChange(n)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                value !== null && n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value ? `${value}/5` : notRatedLabel}
        </span>
      </div>
    </div>
  );
}

type StepKey = "identify" | "experience" | "logistics" | "testimony" | "done";

const EventFeedback = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const lang = (language === "fr" ? "fr" : "en") as Lang;
  const t = T[lang];
  const dateLocale = lang === "fr" ? { locale: frLocale } : undefined;

  const [step, setStep] = useState<StepKey>("identify");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [lookupMode, setLookupMode] = useState<"email" | "phone">("email");
  const [lookupValue, setLookupValue] = useState("");

  const [eventInfo, setEventInfo] = useState<{ id: string; name: string; name_fr?: string; slug?: string } | null>(null);
  const [member, setMember] = useState<any>(null);
  const [testimonySubmitted, setTestimonySubmitted] = useState(false);

  // form state
  const [firstTime, setFirstTime] = useState<string>("");
  const [fellowship, setFellowship] = useState("");
  const [overall, setOverall] = useState<number | null>(null);
  const [communication, setCommunication] = useState<number | null>(null);
  const [lodging, setLodging] = useState<number | null>(null);
  const [food, setFood] = useState<number | null>(null);
  const [children, setChildren] = useState<number | null>(null);
  const [impactSessions, setImpactSessions] = useState("");
  const [teachingImpact, setTeachingImpact] = useState("");
  const [enjoyed, setEnjoyed] = useState<string[]>([]);
  const [enjoyedOther, setEnjoyedOther] = useState("");
  const [schedule, setSchedule] = useState("");
  const [challenges, setChallenges] = useState("");
  const [futureTopics, setFutureTopics] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [testimonialRole, setTestimonialRole] = useState("");

  const { data: eventHero } = useQuery({
    queryKey: ["feedback-event-hero", slug],
    enabled: !!slug,
    queryFn: async () => {
      const cols = "id, name, name_fr, slug, start_datetime, end_datetime, location_name, location_name_fr";
      let { data } = await supabase.from("events").select(cols).eq("slug", slug!).maybeSingle();
      if (!data) {
        const { data: byId } = await supabase.from("events").select(cols).eq("id", slug!).maybeSingle();
        data = byId;
      }
      return data as any;
    },
  });

  const eventTitle = eventInfo
    ? (lang === "fr" && eventInfo.name_fr ? eventInfo.name_fr : eventInfo.name)
    : eventHero
      ? (lang === "fr" && eventHero.name_fr ? eventHero.name_fr : eventHero.name)
      : "";
  const eventLocation = eventHero
    ? (lang === "fr" && eventHero.location_name_fr ? eventHero.location_name_fr : eventHero.location_name) || ""
    : "";

  const steps: { key: StepKey; label: string }[] = [
    { key: "identify", label: t.stepIdentify },
    { key: "experience", label: t.stepExperience },
    { key: "logistics", label: t.stepLogistics },
    { key: "testimony", label: t.stepTestimony },
  ];

  const toggleEnjoyed = (v: string) =>
    setEnjoyed((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const handleLookup = async () => {
    setLookupError(null);
    const email = lookupMode === "email" ? lookupValue.trim() : "";
    const phone = lookupMode === "phone" ? lookupValue.trim() : "";
    if (!email && phone.replace(/\D/g, "").length < 9) {
      setLookupError(t.provideOne);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-feedback-lookup", {
        body: { slug, email, phone },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.found) {
        setLookupError(t.notFound);
        return;
      }
      if (!data?.eligible) {
        setLookupError(t.notEligible);
        return;
      }

      setEventInfo(data.event);
      setMember(data.member);

      const f = data.feedback;
      if (f) {
        setFirstTime(f.first_time_attending === null ? "" : f.first_time_attending ? "yes" : "no");
        setFellowship(f.fellowship || "");
        setOverall(f.overall_rating ?? null);
        setCommunication(f.communication_rating ?? null);
        setLodging(f.lodging_rating ?? null);
        setFood(f.food_rating ?? null);
        setChildren(f.children_management_rating ?? null);
        setImpactSessions(f.impactful_sessions || "");
        setTeachingImpact(f.teaching_impact || "");
        setEnjoyed(f.enjoyed_most || []);
        setEnjoyedOther(f.enjoyed_most_other || "");
        setSchedule(f.schedule_feedback || "");
        setChallenges(f.challenges || "");
        setFutureTopics(f.future_topics || "");
        setSuggestions(f.suggestions || "");
      }
      if (data.testimonial) {
        setTestimonial(data.testimonial.content || "");
        setTestimonialRole(data.testimonial.role || "");
      }
    } catch (err: any) {
      setLookupError(err?.message || t.lookupError);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!eventInfo || !member) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-feedback-submit", {
        body: {
          event_id: eventInfo.id,
          member_id: member.id,
          feedback: {
            first_time_attending: firstTime === "" ? null : firstTime === "yes",
            fellowship,
            overall_rating: overall,
            communication_rating: communication,
            lodging_rating: lodging,
            food_rating: food,
            children_management_rating: children,
            impactful_sessions: impactSessions,
            teaching_impact: teachingImpact,
            enjoyed_most: enjoyed,
            enjoyed_most_other: enjoyedOther,
            schedule_feedback: schedule,
            challenges,
            future_topics: futureTopics,
            suggestions,
          },
          testimonial: { content: testimonial, role: testimonialRole },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTestimonySubmitted(!!data?.testimonial_submitted);
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      toast({
        title: t.lookupError,
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderActions = () => {
    if (step === "done") return null;
    const currentIdx = steps.findIndex((s) => s.key === step);
    const isLast = currentIdx === steps.length - 1;
    const isFirst = currentIdx === 0;

    const onNext = () => {
      if (isLast) {
        handleSubmit();
      } else {
        setStep(steps[currentIdx + 1].key);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    const onBack = () => {
      if (!isFirst) {
        setStep(steps[currentIdx - 1].key);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    return (
      <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:justify-end">
        {!isFirst && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="w-full col-span-1 sm:w-auto rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {t.back}
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          disabled={loading}
          className={cn(
            "w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow",
            isFirst ? "col-span-3" : "col-span-2"
          )}
        >
          {isLast ? (
            loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t.submitting}</>
            ) : (
              <>{t.submit} <CheckCircle2 className="h-4 w-4 ml-1" /></>
            )
          ) : (
            <>{t.continue} <ArrowRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    );
  };

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
              <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white mb-3 border-0">{t.badge}</Badge>
              <h1 className="text-2xl md:text-fluid-3xl font-bold leading-tight">{eventTitle || t.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm opacity-90">
                {eventHero?.start_datetime && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(eventHero.start_datetime), "PPP", dateLocale)}
                    {eventHero.end_datetime ? ` – ${format(new Date(eventHero.end_datetime), "PPP", dateLocale)}` : ""}
                  </span>
                )}
                {eventLocation && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {eventLocation}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm opacity-90 max-w-xl">{t.subtitle}</p>
            </div>
          </div>

          {step !== "done" && (
            <div className="py-1">
              <StepIndicator step={step} steps={steps} />
            </div>
          )}

          {step === "done" ? (
            <GlassSection icon={CheckCircle2} title={t.thanksTitle}>
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{t.thanksBody}</p>
                {testimonySubmitted && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{t.thanksTestimony}</p>
                )}
                <Button asChild className="rounded-xl">
                  <Link to={`/events/${eventInfo?.slug || slug}`}>{t.backToEvent}</Link>
                </Button>
              </div>
            </GlassSection>
          ) : (
            <>
              {step === "identify" && (
                <GlassSection icon={UserCheck} title={t.lookupTitle} description={t.lookupHelp}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { mode: "email", label: t.email, Icon: Mail, color: "blue" },
                        { mode: "phone", label: t.phone, Icon: Phone, color: "amber" },
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
                              setLookupError(null);
                              setMember(null);
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
                        placeholder={lookupMode === "email" ? "you@example.com" : "6XX XXX XXX"}
                        maxLength={lookupMode === "email" ? 255 : 30}
                        value={lookupValue}
                        onChange={(e) => {
                          setLookupValue(e.target.value);
                          setLookupError(null);
                          setMember(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleLookup();
                          }
                        }}
                      />
                      {!member && (
                        <Button
                          type="button"
                          onClick={handleLookup}
                          disabled={loading || !lookupValue.trim()}
                          className="rounded-xl"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          <span className="ml-1">{t.check}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {member && (
                    <>
                      <Alert className="border-green-500/30 bg-green-500/5">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-justify">
                          {t.hello} <strong className="text-primary">{member.first_name}</strong>
                          {t.helloTail}
                        </AlertDescription>
                      </Alert>
                      <div className="pt-2">{renderActions()}</div>
                    </>
                  )}

                  {lookupError && (
                    <Alert className="border-amber-500/30 bg-amber-500/5">
                      <UserCheck className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-justify">{lookupError}</AlertDescription>
                    </Alert>
                  )}
                </GlassSection>
              )}

              {step === "experience" && (
                <div className="space-y-5">
                  <GlassSection icon={UserCheck} title={t.aboutYou}>
                    <div className="space-y-2">
                      <Label>{t.firstTime}</Label>
                      <RadioGroup value={firstTime} onValueChange={setFirstTime} className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="yes" id="ft-yes" />
                          <Label htmlFor="ft-yes" className="font-normal">{t.yes}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="ft-no" />
                          <Label htmlFor="ft-no" className="font-normal">{t.no}</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fellowship">{t.fellowship}</Label>
                      <Input
                        id="fellowship"
                        className="rounded-xl bg-background/60"
                        value={fellowship}
                        onChange={(e) => setFellowship(e.target.value)}
                        maxLength={160}
                      />
                    </div>
                  </GlassSection>

                  <GlassSection icon={Sparkles} title={t.experience}>
                    <StarRating value={overall} onChange={setOverall} label={t.overall} notRatedLabel={t.notRated} />
                    <StarRating value={communication} onChange={setCommunication} label={t.communication} notRatedLabel={t.notRated} />
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="sessions">{t.impactSessions}</Label>
                      <Textarea id="sessions" className="rounded-xl bg-background/60" value={impactSessions} onChange={(e) => setImpactSessions(e.target.value)} maxLength={2000} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impact">{t.teachingImpact}</Label>
                      <Textarea id="impact" className="rounded-xl bg-background/60" value={teachingImpact} onChange={(e) => setTeachingImpact(e.target.value)} maxLength={2000} rows={3} />
                    </div>
                    <div className="space-y-3">
                      <Label>{t.enjoyed}</Label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {ENJOY_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all",
                              enjoyed.includes(opt.value)
                                ? "border-primary bg-primary/5"
                                : "border-border bg-background/60 hover:border-primary/40"
                            )}
                          >
                            <Checkbox checked={enjoyed.includes(opt.value)} onCheckedChange={() => toggleEnjoyed(opt.value)} />
                            <span className="text-sm">{lang === "fr" ? opt.fr : opt.en}</span>
                          </label>
                        ))}
                      </div>
                      {enjoyed.includes("other") && (
                        <Input
                          className="rounded-xl bg-background/60"
                          value={enjoyedOther}
                          onChange={(e) => setEnjoyedOther(e.target.value)}
                          placeholder={t.otherSpecify}
                          maxLength={300}
                        />
                      )}
                    </div>
                  </GlassSection>

                  {renderActions()}
                </div>
              )}

              {step === "logistics" && (
                <div className="space-y-5">
                  <GlassSection icon={Bed} title={t.logistics}>
                    <StarRating value={lodging} onChange={setLodging} label={t.lodging} notRatedLabel={t.notRated} />
                    <StarRating value={food} onChange={setFood} label={t.food} notRatedLabel={t.notRated} />
                    <StarRating value={children} onChange={setChildren} label={t.children} notRatedLabel={t.notRated} />
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="schedule">{t.schedule}</Label>
                      <Textarea id="schedule" className="rounded-xl bg-background/60" value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={2000} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="challenges">{t.challenges}</Label>
                      <Textarea id="challenges" className="rounded-xl bg-background/60" value={challenges} onChange={(e) => setChallenges(e.target.value)} maxLength={2000} rows={3} />
                    </div>
                  </GlassSection>

                  {renderActions()}
                </div>
              )}

              {step === "testimony" && (
                <div className="space-y-5">
                  <GlassSection icon={ArrowRight} title={t.future}>
                    <div className="space-y-2">
                      <Label htmlFor="topics">{t.futureTopics}</Label>
                      <Textarea id="topics" className="rounded-xl bg-background/60" value={futureTopics} onChange={(e) => setFutureTopics(e.target.value)} maxLength={2000} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="suggestions">{t.suggestions}</Label>
                      <Textarea id="suggestions" className="rounded-xl bg-background/60" value={suggestions} onChange={(e) => setSuggestions(e.target.value)} maxLength={2000} rows={3} />
                    </div>
                  </GlassSection>

                  <GlassSection icon={MessageSquareHeart} title={t.testimonialTitle} description={t.testimonialHelp}>
                    <div className="space-y-2">
                      <Label htmlFor="testimony">{t.testimonial}</Label>
                      <Textarea id="testimony" className="rounded-xl bg-background/60" value={testimonial} onChange={(e) => setTestimonial(e.target.value)} maxLength={2000} rows={5} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trole">{t.testimonialRole}</Label>
                      <Input id="trole" className="rounded-xl bg-background/60" value={testimonialRole} onChange={(e) => setTestimonialRole(e.target.value)} maxLength={120} />
                    </div>
                  </GlassSection>

                  {renderActions()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EventFeedback;
