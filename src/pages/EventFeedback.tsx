import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
    subtitle: "Tell us about your experience. All questions are optional.",
    lookupTitle: "Find your registration",
    lookupHelp: "Enter the email or phone number you used to register or attend.",
    email: "Email",
    phone: "Phone number",
    or: "or",
    continue: "Continue",
    notFound: "We couldn't find your details. Please check your email or phone number.",
    notEligible: "We couldn't find a registration or attendance record for you at this event.",
    lookupError: "Something went wrong. Please try again.",
    hello: "Hello",
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
    provideOne: "Please enter an email or phone number.",
  },
  fr: {
    title: "Partagez vos impressions",
    subtitle: "Parlez-nous de votre expérience. Toutes les questions sont facultatives.",
    lookupTitle: "Retrouvez votre inscription",
    lookupHelp: "Entrez l'e-mail ou le numéro de téléphone utilisé pour vous inscrire ou participer.",
    email: "E-mail",
    phone: "Numéro de téléphone",
    or: "ou",
    continue: "Continuer",
    notFound: "Nous n'avons pas trouvé vos informations. Vérifiez votre e-mail ou téléphone.",
    notEligible: "Aucune inscription ni présence n'a été trouvée pour vous à cet événement.",
    lookupError: "Une erreur est survenue. Veuillez réessayer.",
    hello: "Bonjour",
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
    provideOne: "Veuillez saisir un e-mail ou un numéro de téléphone.",
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

const EventFeedback = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = (language === "fr" ? "fr" : "en") as Lang;
  const t = T[lang];

  const [step, setStep] = useState<"lookup" | "form" | "done">("lookup");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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

  const toggleEnjoyed = (v: string) =>
    setEnjoyed((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    if (!email.trim() && phone.replace(/\D/g, "").length < 9) {
      setLookupError(t.provideOne);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("event-feedback-lookup", {
        body: { slug, email: email.trim(), phone: phone.trim() },
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
      setStep("form");
    } catch (err: any) {
      setLookupError(err?.message || t.lookupError);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const eventTitle = eventInfo
    ? (lang === "fr" && eventInfo.name_fr ? eventInfo.name_fr : eventInfo.name)
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container-custom max-w-3xl py-12 md:py-16">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground mb-4">
              <MessageSquareHeart className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-2">{eventTitle || t.subtitle}</p>
          </div>

          {step === "lookup" && (
            <Card className="glass-panel-soft border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-primary" />
                  {t.lookupTitle}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t.lookupHelp}</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLookup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fb-email">{t.email}</Label>
                    <Input
                      id="fb-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      maxLength={255}
                    />
                  </div>
                  <div className="text-center text-xs uppercase tracking-wide text-muted-foreground">{t.or}</div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-phone">{t.phone}</Label>
                    <Input
                      id="fb-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="6XX XXX XXX"
                      maxLength={30}
                    />
                  </div>
                  {lookupError && (
                    <p className="text-sm text-destructive">{lookupError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.continue}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-center text-muted-foreground">
                {t.hello}, <span className="font-semibold text-foreground">{member?.first_name}</span> — {t.subtitle}
              </p>

              <Card className="glass-panel-soft border-primary/10">
                <CardHeader><CardTitle className="text-lg">{t.aboutYou}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
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
                    <Input id="fellowship" value={fellowship} onChange={(e) => setFellowship(e.target.value)} maxLength={160} />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel-soft border-primary/10">
                <CardHeader><CardTitle className="text-lg">{t.experience}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <StarRating value={overall} onChange={setOverall} label={t.overall} notRatedLabel={t.notRated} />
                  <StarRating value={communication} onChange={setCommunication} label={t.communication} notRatedLabel={t.notRated} />
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="sessions">{t.impactSessions}</Label>
                    <Textarea id="sessions" value={impactSessions} onChange={(e) => setImpactSessions(e.target.value)} maxLength={2000} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="impact">{t.teachingImpact}</Label>
                    <Textarea id="impact" value={teachingImpact} onChange={(e) => setTeachingImpact(e.target.value)} maxLength={2000} rows={3} />
                  </div>
                  <div className="space-y-3">
                    <Label>{t.enjoyed}</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {ENJOY_OPTIONS.map((opt) => (
                        <label key={opt.value} className="flex items-center gap-3 rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/40">
                          <Checkbox checked={enjoyed.includes(opt.value)} onCheckedChange={() => toggleEnjoyed(opt.value)} />
                          <span className="text-sm">{lang === "fr" ? opt.fr : opt.en}</span>
                        </label>
                      ))}
                    </div>
                    {enjoyed.includes("other") && (
                      <Input
                        value={enjoyedOther}
                        onChange={(e) => setEnjoyedOther(e.target.value)}
                        placeholder={t.otherSpecify}
                        maxLength={300}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel-soft border-primary/10">
                <CardHeader><CardTitle className="text-lg">{t.logistics}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <StarRating value={lodging} onChange={setLodging} label={t.lodging} notRatedLabel={t.notRated} />
                  <StarRating value={food} onChange={setFood} label={t.food} notRatedLabel={t.notRated} />
                  <StarRating value={children} onChange={setChildren} label={t.children} notRatedLabel={t.notRated} />
                  <div className="space-y-2">
                    <Label htmlFor="schedule">{t.schedule}</Label>
                    <Textarea id="schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} maxLength={2000} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challenges">{t.challenges}</Label>
                    <Textarea id="challenges" value={challenges} onChange={(e) => setChallenges(e.target.value)} maxLength={2000} rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel-soft border-primary/10">
                <CardHeader><CardTitle className="text-lg">{t.future}</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="topics">{t.futureTopics}</Label>
                    <Textarea id="topics" value={futureTopics} onChange={(e) => setFutureTopics(e.target.value)} maxLength={2000} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suggestions">{t.suggestions}</Label>
                    <Textarea id="suggestions" value={suggestions} onChange={(e) => setSuggestions(e.target.value)} maxLength={2000} rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-panel-soft border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg">{t.testimonialTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t.testimonialHelp}</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="testimony">{t.testimonial}</Label>
                    <Textarea id="testimony" value={testimonial} onChange={(e) => setTestimonial(e.target.value)} maxLength={2000} rows={5} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trole">{t.testimonialRole}</Label>
                    <Input id="trole" value={testimonialRole} onChange={(e) => setTestimonialRole(e.target.value)} maxLength={120} />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? t.submitting : t.submit}
              </Button>
            </form>
          )}

          {step === "done" && (
            <Card className="glass-panel-soft border-primary/10 text-center">
              <CardContent className="py-12 space-y-4">
                <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                <h2 className="text-2xl font-bold">{t.thanksTitle}</h2>
                <p className="text-muted-foreground">{t.thanksBody}</p>
                {testimonySubmitted && <p className="text-muted-foreground">{t.thanksTestimony}</p>}
                <Button variant="outline" onClick={() => navigate(`/events/${eventInfo?.slug || slug}`)}>
                  {t.backToEvent}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventFeedback;
