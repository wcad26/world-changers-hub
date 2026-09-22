import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import Autoplay from "embla-carousel-autoplay";
import {
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Link, useParams } from "@/lib/router-compat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatEventDuration } from "@/utils/dateUtils";
import {
  publicRegionPageQueryOptions,
  type PublicRegionDcg,
  type PublicRegionEvent,
  type PublicRegionLocation,
} from "@/lib/public-site.functions";

type Slide = { url: string; alt: string };

function parseSlides(value: unknown): Slide[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { url: string; alt?: unknown } =>
      Boolean(item) && typeof item === "object" && typeof (item as { url?: unknown }).url === "string" && (item as { url: string }).url.length > 0)
    .map((item) => ({ url: item.url, alt: typeof item.alt === "string" ? item.alt : "" }));
}

function formatFellowshipTimes(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const record = entry as Record<string, unknown>;
          return [record.day, record.time].filter((part) => typeof part === "string" && part).join(" ");
        }
        return "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join(" · ");
  }
  return null;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mb-8 max-w-2xl sm:mb-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{eyebrow}</p>
      <h2 className="mt-2 text-balance font-heading text-2xl font-bold sm:text-3xl lg:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}
    </div>
  );
}

function RegionalEventCard({ event, fr }: { event: PublicRegionEvent; fr: boolean }) {
  const title = fr && event.name_fr ? event.name_fr : event.name;
  const imageUrl = fr && event.image_url_fr ? event.image_url_fr : event.image_url;
  const venue = (fr && event.location_name_fr ? event.location_name_fr : event.location_name) || event.address;
  const { dateRange, timeRange } = formatEventDuration(event.start_datetime, event.end_datetime);

  return (
    <Link
      to={`/events/${event.slug || event.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-card transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-primary/35 hover:shadow-regal"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={title} width={800} height={500} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="event-gradient grid h-full place-items-center"><Calendar className="h-12 w-12 text-event-foreground/70" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-event-background/90 via-event-background/10 to-transparent" />
        <Badge className="absolute left-3 top-3 border-event-border bg-event-background/85 text-event-foreground backdrop-blur-md">{event.category}</Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">{title}</h3>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{dateRange}</span></p>
          <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{timeRange}</span></p>
          {venue && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span className="line-clamp-2">{venue}</span></p>}
        </div>
        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
          {fr ? "Voir l’événement" : "View event"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function RegionalLocationCard({ location, fr }: { location: PublicRegionLocation; fr: boolean }) {
  const isCenter = location.type === "WCA Center";
  const mapUrl = location.latitude && location.longitude
    ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : `https://maps.google.com/maps?q=${encodeURIComponent([location.name, location.address, location.city].filter(Boolean).join(" "))}`;
  const phone = location.contact_phone?.replace(/\D/g, "");
  const fellowshipTimes = formatFellowshipTimes(location.fellowship_times);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-card transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-primary/35 hover:shadow-regal">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {location.image_url ? (
          <img src={location.image_url} alt={location.name} width={800} height={500} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        ) : (
          <div className="event-gradient grid h-full place-items-center"><MapPin className="h-12 w-12 text-event-muted" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-event-background/85 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-event-background/85 px-3 py-1.5 text-xs font-semibold text-event-foreground backdrop-blur-md">{isCenter ? "WCA Center" : "DCG Home"}</span>
        {location.is_featured && <span className="absolute right-4 top-4 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">{fr ? "À la une" : "Featured"}</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold">{location.name}</h3>
        <div className="mt-3 space-y-2.5 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{[location.address, location.city, location.state].filter(Boolean).join(", ") || (fr ? "Adresse bientôt disponible" : "Address available soon")}</span></p>
          {fellowshipTimes && <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{fellowshipTimes}</span></p>}
          {location.contact_phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-secondary" />{location.contact_phone}</p>}
          {location.capacity && <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-secondary" />{fr ? `Capacité : ${location.capacity} personnes` : `Capacity: ${location.capacity} people`}</p>}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button asChild variant="outline" className="px-3"><a href={mapUrl} target="_blank" rel="noreferrer"><MapPin />{fr ? "Itinéraire" : "Directions"}</a></Button>
          {phone && <Button asChild variant="secondary" className="px-3"><a href={location.whatsapp_link || `https://wa.me/${phone}`} target="_blank" rel="noreferrer">{fr ? "Contacter" : "Contact"}<ArrowRight /></a></Button>}
        </div>
      </div>
    </article>
  );
}

function RegionalDcgCard({ dcg, fr }: { dcg: PublicRegionDcg; fr: boolean }) {
  const meetingTime = dcg.meeting_time ? dcg.meeting_time.slice(0, 5) : null;
  return (
    <article className="flex h-full flex-col rounded-md border border-border bg-card p-5 shadow-card transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-primary/35 hover:shadow-regal">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-secondary/12 text-secondary"><Heart className="h-5 w-5" /></div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{dcg.member_count} {fr ? "membres" : "members"}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{dcg.name}</h3>
      {dcg.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{dcg.description}</p>}
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {(dcg.meeting_day || meetingTime) && (
          <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-secondary" />{[dcg.meeting_day, meetingTime].filter(Boolean).join(" · ")}</p>
        )}
        {dcg.location && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{dcg.location}</span></p>}
        {dcg.leader_name && <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-secondary" />{fr ? "Responsable : " : "Leader: "}{dcg.leader_name}</p>}
      </div>
    </article>
  );
}

export default function RegionalBranchHome() {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useSuspenseQuery(publicRegionPageQueryOptions(slug || ""));
  const { language } = useLanguage();
  const fr = language === "fr";
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [email, setEmail] = useState("");

  const region = data?.region;
  const locations = data?.locations ?? [];
  const dcgs = data?.dcgs ?? [];
  const events = data?.events ?? [];

  const slides = useMemo(() => {
    if (!region) return [];
    const desktop = parseSlides(region.hero_slide_images);
    if (isMobile) {
      const mobile = parseSlides(region.hero_slide_images_mobile);
      if (mobile.length) return mobile;
    } else if (isTablet) {
      const tablet = parseSlides(region.hero_slide_images_tablet);
      if (tablet.length) return tablet;
    }
    return desktop;
  }, [region, isMobile, isTablet]);

  if (!region) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold">{fr ? "Région introuvable" : "Region not found"}</h1>
            <p className="mt-3 text-muted-foreground">{fr ? "Cette page régionale n'existe pas ou a été déplacée." : "The regional branch you're looking for doesn't exist or has been moved."}</p>
            <Button asChild variant="outline" className="mt-6"><Link to="/locations">{fr ? "Retour aux lieux" : "Back to Locations"}</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const establishedYear = region.established_date ? new Date(region.established_date).getFullYear() : null;
  const description = region.description?.trim();
  const stats: Array<{ label: string; value: string | number }> = [
    ...(establishedYear ? [{ label: fr ? "Fondée en" : "Established", value: establishedYear }] : []),
    { label: "DCG Homes", value: dcgs.length },
    { label: fr ? "Lieux" : "Locations", value: locations.length },
    { label: fr ? "Événements à venir" : "Upcoming events", value: events.length },
  ];

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    toast({
      title: fr ? "Inscription réussie !" : "Successfully subscribed!",
      description: fr ? "Merci de vous être abonné à notre newsletter." : "Thank you for subscribing to our newsletter.",
    });
    setEmail("");
  };

  const scrollToEvents = () => document.getElementById("regional-events")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        {/* Editorial hero */}
        <section className="relative min-h-[74svh] border-b border-event-border bg-event-background text-event-foreground sm:min-h-[78svh]">
          {slides.length > 0 ? (
            <Carousel className="absolute inset-0 h-full w-full [&>div]:h-full" opts={{ align: "start", loop: slides.length > 1 }} plugins={slides.length > 1 ? [Autoplay({ delay: 6000 })] : []}>
              <CarouselContent className="-ml-0 h-full">
                {slides.map((slide, index) => (
                  <CarouselItem key={index} className="relative h-full pl-0">
                    <img
                      src={slide.url}
                      alt={slide.alt || region.name}
                      width={1920}
                      height={1080}
                      fetchPriority={index === 0 ? "high" : undefined}
                      loading={index === 0 ? undefined : "lazy"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="event-gradient absolute inset-0" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--event-background)_0%,color-mix(in_oklab,var(--event-background)_82%,transparent)_48%,color-mix(in_oklab,var(--event-background)_22%,transparent)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--event-background)_0%,transparent_52%)] opacity-80" />

          <div className="container-custom relative z-10 flex min-h-[74svh] items-end pb-12 pt-24 sm:min-h-[78svh] sm:items-center sm:pb-16">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-secondary px-5 py-2 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                {fr ? "Communauté régionale WCA" : "WCA regional fellowship"}
              </p>
              <h1 className="mt-5 text-balance font-heading text-4xl font-bold leading-[1.04] text-event-foreground sm:text-6xl lg:text-7xl">
                <span className="block text-lg font-medium text-event-muted sm:text-2xl">{fr ? "Bienvenue à" : "Welcome to"}</span>
                {region.name}
              </h1>
              {description && <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-event-muted sm:text-lg line-clamp-4">{description}</p>}
              <div className="mt-8 flex flex-row flex-wrap gap-3">
                <Button asChild size="lg" className="px-6">
                  <Link to={`/visitor/register/${slug}`}>{fr ? "Nouveau visiteur ? Inscrivez-vous" : "New visitor? Register here"}<ArrowRight /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-event-border bg-event-background/40 px-6 text-event-foreground backdrop-blur-md hover:bg-event-background/60" onClick={scrollToEvents}>
                  {fr ? "Voir les événements" : "See upcoming events"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section className="border-b border-border bg-muted/35 py-8 sm:py-10">
          <div className="container-custom">
            <div className={cn("grid gap-3 sm:gap-4", stats.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-3")}>
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-md border border-border bg-card p-5 text-center shadow-card">
                  <strong className="block font-heading text-2xl text-primary sm:text-3xl">{stat.value}</strong>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About this region */}
        <section className="py-14 sm:py-20">
          <div className="container-custom">
            <div className={cn("grid items-center gap-10", (region.regional_president_photo || region.regional_president) && "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]")}>
              <div>
                <SectionHeading
                  eyebrow={fr ? "À propos" : "About"}
                  title={fr ? `À propos de ${region.name}` : `About ${region.name}`}
                />
                <p className="max-w-2xl text-pretty leading-7 text-muted-foreground">
                  {description || (fr
                    ? `Bienvenue dans la communauté dynamique de ${region.name}. Nous bâtissons des relations solides et un impact positif à travers l'adoration, le service et la formation de disciples.`
                    : `Welcome to the vibrant community of ${region.name}. We are committed to building strong relationships and making a positive impact through worship, service, and discipleship.`)}
                </p>
                {region.regional_president && (
                  <div className="mt-8 border-t border-border pt-6">
                    <p className="font-heading text-lg font-semibold">{region.regional_president}</p>
                    <p className="text-sm text-muted-foreground">{fr ? "Président régional" : "Regional President"}</p>
                  </div>
                )}
              </div>
              {region.regional_president_photo && (
                <div className="mx-auto w-full max-w-sm">
                  <div className="overflow-hidden rounded-md border border-border shadow-regal">
                    <img src={region.regional_president_photo} alt={region.regional_president || (fr ? "Président régional" : "Regional President")} width={640} height={800} loading="lazy" className="aspect-[4/5] w-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Upcoming events */}
        <section id="regional-events" className="border-t border-border bg-muted/35 py-14 sm:py-20">
          <div className="container-custom">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow={fr ? "Agenda" : "What's on"}
                title={fr ? "Événements à venir" : "Upcoming events"}
                description={fr ? "Rejoignez-nous pour des rassemblements inspirants, des cultes et des événements communautaires." : "Join us for inspiring gatherings, worship services, and community events."}
              />
              <Button asChild variant="outline" className="mb-8 sm:mb-10"><Link to="/events">{fr ? "Tous les événements" : "All events"}<ArrowRight /></Link></Button>
            </div>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.slice(0, 6).map((event) => <RegionalEventCard key={event.id} event={event} fr={fr} />)}
              </div>
            ) : (
              <div className="grid place-items-center rounded-md border border-dashed border-border bg-card/60 px-6 py-16 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/60" />
                <p className="mt-4 font-semibold">{fr ? "Aucun événement à venir pour le moment" : "No upcoming events right now"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{fr ? "Revenez bientôt ou explorez tous les événements WCA." : "Check back soon, or explore all WCA events."}</p>
              </div>
            )}
          </div>
        </section>

        {/* Meeting places */}
        {locations.length > 0 && (
          <section className="py-14 sm:py-20">
            <div className="container-custom">
              <SectionHeading
                eyebrow={fr ? "Où nous trouver" : "Where to find us"}
                title={fr ? "Nos lieux de rencontre" : "Our meeting places"}
                description={fr ? "Centres WCA et lieux de communion fraternelle dans la région." : "WCA Centers and fellowship venues across the region."}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {locations.map((location) => <RegionalLocationCard key={location.id} location={location} fr={fr} />)}
              </div>
            </div>
          </section>
        )}

        {/* DCG homes */}
        {dcgs.length > 0 && (
          <section className="border-t border-border bg-muted/35 py-14 sm:py-20">
            <div className="container-custom">
              <SectionHeading
                eyebrow="Deeper Christian Groups"
                title={fr ? "Nos maisons DCG" : "Our DCG Homes"}
                description={fr ? "Des petits groupes où la foi grandit à travers l'étude de la Parole et la communion fraternelle." : "Small groups where faith grows through Word study and fellowship."}
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {dcgs.map((dcg) => <RegionalDcgCard key={dcg.id} dcg={dcg} fr={fr} />)}
              </div>
            </div>
          </section>
        )}

        {/* Contact & visit */}
        <section className="py-14 sm:py-20">
          <div className="container-custom">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
              <div>
                <SectionHeading
                  eyebrow={fr ? "Contact" : "Get in touch"}
                  title={fr ? "Planifiez votre visite" : "Plan your visit"}
                  description={fr ? "Nous serions ravis de vous accueillir. Contactez-nous ou inscrivez-vous comme visiteur." : "We would love to welcome you. Reach out to us or register as a first-time visitor."}
                />
                <div className="space-y-4 text-sm">
                  {region.address && <p className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><MapPin className="h-5 w-5" /></span><span className="pt-2.5 text-muted-foreground">{region.address}</span></p>}
                  {region.contact_phone && <p className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Phone className="h-5 w-5" /></span><a href={`tel:${region.contact_phone}`} className="pt-2.5 font-medium text-foreground">{region.contact_phone}</a></p>}
                  {region.contact_email && <p className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Mail className="h-5 w-5" /></span><a href={`mailto:${region.contact_email}`} className="pt-2.5 font-medium text-foreground break-all">{region.contact_email}</a></p>}
                  {!region.address && !region.contact_phone && !region.contact_email && (
                    <p className="text-muted-foreground">{fr ? "Coordonnées bientôt disponibles." : "Contact details available soon."}</p>
                  )}
                </div>
              </div>
              <div className="rounded-md border border-border bg-card p-6 shadow-regal sm:p-8">
                <div className="grid h-12 w-12 place-items-center rounded-md bg-secondary/12 text-secondary"><Building2 className="h-6 w-6" /></div>
                <h3 className="mt-5 font-heading text-xl font-semibold sm:text-2xl">{fr ? `Première visite à ${region.name} ?` : `First time at ${region.name}?`}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{fr ? "Inscrivez-vous en quelques secondes pour que nous puissions bien vous accueillir." : "Register in seconds so we can give you the warmest welcome."}</p>
                <Button asChild size="lg" className="mt-6 w-full sm:w-auto"><Link to={`/visitor/register/${slug}`}>{fr ? "S'inscrire comme visiteur" : "Register as a visitor"}<ArrowRight /></Link></Button>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t border-event-border bg-event-background py-14 text-event-foreground sm:py-16">
          <div className="container-custom">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance font-heading text-2xl font-bold sm:text-3xl">{fr ? "Restez informé" : "Stay updated with us"}</h2>
              <p className="mt-3 text-sm leading-6 text-event-muted sm:text-base">{fr ? `Recevez les nouvelles et les événements de ${region.name} directement dans votre boîte mail.` : `Get ${region.name} news and events straight to your inbox.`}</p>
              <form onSubmit={handleSubscribe} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={fr ? "Votre adresse e-mail" : "Your email address"}
                  className="h-12 border-event-border bg-event-background/60 text-event-foreground placeholder:text-event-muted"
                />
                <Button type="submit" size="lg" variant="secondary" className="h-12 shrink-0">{fr ? "S'abonner" : "Subscribe"}</Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
