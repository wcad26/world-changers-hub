import { Link } from "@/lib/router-compat";
import { isFuture } from "date-fns";
import { ArrowRight, CalendarDays, Check, MessageCircle, ShieldCheck, UserPlus } from "lucide-react";
import type { Event } from "@/hooks/useEvents";
import { useEventRegistrationFees } from "@/hooks/useEventRegistrationFees";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

export function EventRegistrationPanel({ event }: { event: Event }) {
  const { language, t } = useLanguage();
  const { data: fees = [] } = useEventRegistrationFees(event.is_special ? event.id : undefined);
  const canRegister = isFuture(new Date(event.start_datetime)) && event.status !== "Cancelled" && event.status !== "Completed";
  const preRegistrationPath = `/events/${event.slug || event.id}/register`;
  const feedbackPath = `/events/${event.slug || event.id}/feedback`;

  const openWhatsApp = () => {
    if (!event.whatsapp_contact) return;
    window.open(`https://wa.me/${event.whatsapp_contact.replace(/[^0-9]/g, "")}`, "_blank", "noopener,noreferrer");
  };

  const featureLabels = [
    event.collect_lodging && (language === "fr" ? "Besoins d’hébergement demandés" : "Accommodation needs requested"),
    event.collect_meal_preferences && (language === "fr" ? "Repas, allergies et informations de santé demandés" : "Meal, allergy and health details requested"),
    event.collect_pledges && event.linked_fundraising_campaign_id && (language === "fr" ? "Soutien facultatif à la campagne disponible" : "Optional campaign support available"),
  ].filter(Boolean) as string[];

  return (
    <aside className="rounded-lg border border-event-border bg-event-surface p-5 event-shadow lg:sticky lg:top-24 lg:p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-accent">
        {canRegister ? (language === "fr" ? "Réservez votre place" : "Reserve your place") : (language === "fr" ? "Événement terminé" : "Event complete")}
      </p>
      <h2 className="mt-3 font-sora text-2xl font-bold text-event-foreground">
        {canRegister ? (language === "fr" ? "Participez à cet événement" : "Join this event") : (language === "fr" ? "Votre avis compte" : "Your voice matters")}
      </h2>
      <p className="mt-3 text-sm leading-6 text-event-muted">
        {canRegister
          ? fees.length > 0
            ? (language === "fr" ? "Les frais sont calculés automatiquement pour chaque participant ou famille admissible pendant l’inscription." : "Fees are calculated automatically for each attendee or qualifying family during registration.")
            : t("reserveSpot")
          : (language === "fr" ? "Partagez votre expérience pour nous aider à améliorer les prochains événements." : "Share your experience to help shape future events.")}
      </p>

      <div className="mt-6 space-y-3">
        {canRegister && event.is_special && event.requires_pre_registration && (
          <Button asChild size="lg" className="h-12 w-full justify-between px-5 font-semibold">
            <Link to={preRegistrationPath}><span className="flex items-center gap-2"><UserPlus />{language === "fr" ? "Se préinscrire" : "Pre-register"}</span><ArrowRight /></Link>
          </Button>
        )}
        {canRegister && event.registration_url && (
          <Button asChild size="lg" variant={event.requires_pre_registration ? "outline" : "default"} className="h-12 w-full border-event-border px-5 font-semibold">
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer"><CalendarDays />{t("registerForEvent")}</a>
          </Button>
        )}
        {!canRegister && (
          <Button asChild size="lg" className="h-12 w-full px-5 font-semibold">
            <Link to={feedbackPath}>{language === "fr" ? "Partager vos impressions" : "Share feedback"}</Link>
          </Button>
        )}
        {event.whatsapp_contact && (
          <Button type="button" variant="outline" size="lg" onClick={openWhatsApp} className="h-12 w-full border-event-border bg-event-elevated text-event-foreground hover:bg-primary hover:text-primary-foreground">
            <MessageCircle />{t("contactUs")}
          </Button>
        )}
      </div>

      {featureLabels.length > 0 && (
        <div className="mt-6 border-t border-event-border pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-event-muted">{language === "fr" ? "Informations d’inscription" : "Registration information"}</p>
          <ul className="space-y-3">
            {featureLabels.map((label) => (
              <li key={label} className="flex items-start gap-3 text-sm text-event-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Check className="h-3 w-3" /></span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex items-center gap-2 border-t border-event-border pt-5 text-xs text-event-muted">
        <ShieldCheck className="h-4 w-4 text-accent" />
        {language === "fr" ? "Inscription sécurisée par WCA" : "Secure registration by WCA"}
      </div>
    </aside>
  );
}

export function EventMobileActionBar({ event }: { event: Event }) {
  const { language, t } = useLanguage();
  const canRegister = isFuture(new Date(event.start_datetime)) && event.status !== "Cancelled" && event.status !== "Completed";
  const path = canRegister ? `/events/${event.slug || event.id}/register` : `/events/${event.slug || event.id}/feedback`;
  const hasInternalRegistration = canRegister && event.is_special && event.requires_pre_registration;
  const label = canRegister ? (language === "fr" ? "Se préinscrire" : "Pre-register") : (language === "fr" ? "Donner votre avis" : "Share feedback");

  if (canRegister && !hasInternalRegistration && !event.registration_url && !event.whatsapp_contact) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-event-border bg-event-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
      {hasInternalRegistration || !canRegister ? (
        <Button asChild className="h-12 w-full font-semibold"><Link to={path}>{label}<ArrowRight /></Link></Button>
      ) : event.registration_url ? (
        <Button asChild className="h-12 w-full font-semibold"><a href={event.registration_url} target="_blank" rel="noopener noreferrer">{t("registerForEvent")}<ArrowRight /></a></Button>
      ) : (
        <Button className="h-12 w-full font-semibold" onClick={() => window.open(`https://wa.me/${event.whatsapp_contact?.replace(/[^0-9]/g, "")}`, "_blank", "noopener,noreferrer")}><MessageCircle />{t("contactUs")}</Button>
      )}
    </div>
  );
}