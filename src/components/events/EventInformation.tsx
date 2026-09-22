import { BedDouble, CalendarDays, Clock3, HeartHandshake, Mail, MapPin, Phone, Target, UserRound, UtensilsCrossed, UsersRound } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/hooks/useEvents";
import { useLanguage } from "@/hooks/useLanguage";

export function EventInformation({ event }: { event: Event }) {
  const { language, localizedField, t } = useLanguage();
  const address = localizedField(event.address, event.address_fr);
  const location = localizedField(event.location_name, event.location_name_fr);
  const description = localizedField(event.description, event.description_fr);
  const requirements = localizedField(event.requirements, event.requirements_fr);
  const features = [
    event.collect_lodging && { icon: BedDouble, title: language === "fr" ? "Hébergement" : "Lodging", copy: language === "fr" ? "Les besoins d’hébergement sont recueillis lors de l’inscription." : "Lodging needs are collected during registration." },
    event.collect_meal_preferences && { icon: UtensilsCrossed, title: language === "fr" ? "Repas et santé" : "Meals & health", copy: language === "fr" ? "Indiquez vos préférences alimentaires, allergies et besoins de santé." : "Share meal preferences, allergies and health needs." },
    event.collect_pledges && { icon: HeartHandshake, title: language === "fr" ? "Promesse et soutien" : "Pledge & support", copy: language === "fr" ? "Vous pouvez soutenir la campagne liée pendant l’inscription." : "Support the linked campaign while registering." },
  ].filter(Boolean) as { icon: typeof BedDouble; title: string; copy: string }[];

  const details = [
    { icon: CalendarDays, label: t("date"), value: event.end_datetime ? `${format(new Date(event.start_datetime), "dd/MM/yyyy")} – ${format(new Date(event.end_datetime), "dd/MM/yyyy")}` : format(new Date(event.start_datetime), "dd/MM/yyyy") },
    { icon: Clock3, label: t("time"), value: `${format(new Date(event.start_datetime), "h:mm a")}${event.end_datetime ? ` – ${format(new Date(event.end_datetime), "h:mm a")}` : ""}` },
    { icon: MapPin, label: t("location"), value: [location, address].filter(Boolean).join(" · ") || "TBA" },
    { icon: UsersRound, label: t("capacity"), value: event.capacity ? `${event.capacity} ${t("people")}` : t("unlimited") },
  ];

  return (
    <div className="space-y-16 md:space-y-20">
      <section aria-labelledby="event-overview" className="p-0">
        <div className="mb-7 flex items-center gap-3">
          <span className="h-px w-10 bg-accent" />
          <p className="font-manrope text-xs font-bold uppercase tracking-widest text-accent">{language === "fr" ? "L’essentiel" : "At a glance"}</p>
        </div>
        <h2 id="event-overview" className="mb-7 font-sora text-3xl font-bold text-event-foreground md:text-4xl">{t("aboutEvent")}</h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-event-border bg-event-border sm:grid-cols-2">
          {details.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 gap-4 bg-event-surface p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-event-elevated text-accent"><Icon className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-event-muted">{label}</p>
                <p className="mt-1 break-words font-semibold text-event-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 whitespace-pre-line font-manrope text-base leading-8 text-event-muted md:text-lg">
          {description || (language === "fr" ? "Aucune description disponible pour cet événement." : "No description is available for this event.")}
        </div>
      </section>

      {features.length > 0 && (
        <section className="p-0" aria-labelledby="event-expect">
          <h2 id="event-expect" className="mb-7 font-sora text-2xl font-bold text-event-foreground md:text-3xl">{language === "fr" ? "À quoi s’attendre" : "What to expect"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-lg border border-event-border bg-event-surface p-5">
                <Icon className="mb-5 h-6 w-6 text-accent" />
                <h3 className="font-sora text-base font-semibold text-event-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-event-muted">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {(event.organizer_name || event.organizer_email || event.organizer_phone) && (
        <section className="p-0" aria-labelledby="event-organizer">
          <h2 id="event-organizer" className="mb-6 font-sora text-2xl font-bold text-event-foreground md:text-3xl">{language === "fr" ? "Organisateur" : "Organizer"}</h2>
          <div className="grid gap-4 rounded-lg border border-event-border bg-event-surface p-5 sm:grid-cols-2">
            {event.organizer_name && (
              <div className="flex items-center gap-3 text-event-foreground"><UserRound className="h-5 w-5 shrink-0 text-accent" /><span className="font-semibold">{event.organizer_name}</span></div>
            )}
            {event.organizer_email && (
              <a href={`mailto:${event.organizer_email}`} className="flex min-w-0 items-center gap-3 text-event-muted hover:text-accent"><Mail className="h-5 w-5 shrink-0" /><span className="truncate">{event.organizer_email}</span></a>
            )}
            {event.organizer_phone && (
              <a href={`tel:${event.organizer_phone}`} className="flex min-w-0 items-center gap-3 text-event-muted hover:text-accent"><Phone className="h-5 w-5 shrink-0" /><span>{event.organizer_phone}</span></a>
            )}
          </div>
        </section>
      )}

      {requirements && (
        <section className="rounded-lg border border-primary/30 bg-primary/10 p-6 md:p-8" aria-labelledby="event-requirements">
          <div className="flex items-start gap-4">
            <Target className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div>
              <h2 id="event-requirements" className="font-sora text-xl font-semibold text-event-foreground">{language === "fr" ? "Ce qu’il faut prévoir" : "What to prepare"}</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-event-muted">{requirements}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}