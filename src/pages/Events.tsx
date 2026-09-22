import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Calendar, Clock, Filter, MapPin, Search } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/lib/router-compat";
import type { Event } from "@/hooks/useEvents";
import { publicEventsQueryOptions } from "@/lib/public-site.functions";
import { useLanguage } from "@/hooks/useLanguage";
import { formatEventDuration } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

const categories = ["All", "Conference", "Worship", "Revival", "Outreach", "Training", "Workshop", "Community Service", "Bible Study", "Retreat", "Seminar", "DCG Meeting", "Other"];

function EventCard({ event, language, past = false }: { event: Event; language: string; past?: boolean }) {
  const imageUrl = language === "fr" && event.image_url_fr ? event.image_url_fr : event.image_url;
  const title = language === "fr" && event.name_fr ? event.name_fr : event.name;
  const location = language === "fr" && event.location_name_fr ? event.location_name_fr : event.location_name;
  const { dateRange, timeRange } = formatEventDuration(event.start_datetime, event.end_datetime);

  return (
    <Link to={`/events/${event.slug || event.id}`} className="group overflow-hidden rounded-md border bg-card text-card-foreground shadow-card transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-primary/35 hover:shadow-regal">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {imageUrl ? <img src={imageUrl} alt={title} className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", past && "saturate-[.65]")} loading="lazy" /> : <div className="event-gradient grid h-full place-items-center"><Calendar className="h-12 w-12 text-event-foreground/70" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-event-background/90 via-event-background/10 to-transparent" />
        <Badge className="absolute left-3 top-3 border-event-border bg-event-background/85 text-event-foreground backdrop-blur-md">{event.category}</Badge>
        {past && <Badge variant="secondary" className="absolute right-3 top-3">Past</Badge>}
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">{title}</h3>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{dateRange}</span></p>
          <p className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{timeRange}</span></p>
          {location && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span className="line-clamp-2">{location}</span></p>}
        </div>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">{language === "fr" ? "Voir l’événement" : "View event"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const { data: allEvents } = useSuspenseQuery(publicEventsQueryOptions());
  const { language } = useLanguage();
  const now = new Date().toISOString();
  const upcoming = allEvents.filter((event) => event.start_datetime >= now);
  const past = allEvents.filter((event) => event.start_datetime < now).reverse();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const filterEvents = (events: Event[]) => events.filter((event) => {
    const categoryMatch = selectedCategory === "All" || event.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categoryMatch;
    const searchable = [event.name, event.name_fr, event.location_name, event.location_name_fr, event.description, event.description_fr].filter(Boolean).join(" ").toLowerCase();
    return categoryMatch && searchable.includes(query);
  });
  const filteredUpcoming = useMemo(() => filterEvents(upcoming), [upcoming, searchQuery, selectedCategory]);
  const filteredPast = useMemo(() => filterEvents(past), [past, searchQuery, selectedCategory]);

  const renderList = (events: Event[], loading: boolean, error: boolean, empty: string, isPast = false) => {
    if (loading) return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="aspect-[4/3] w-full rounded-md" />)}</div>;
    if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>{language === "fr" ? "Erreur" : "Error"}</AlertTitle><AlertDescription>{language === "fr" ? "Impossible de charger les événements. Veuillez réessayer." : "Events could not be loaded. Please try again."}</AlertDescription></Alert>;
    if (!events.length) return <div className="border-y border-border py-14 text-center"><Calendar className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">{empty}</h3><p className="mt-2 text-sm text-muted-foreground">{language === "fr" ? "Essayez une autre recherche ou catégorie." : "Try another search or category."}</p></div>;
    return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{events.map((event) => <EventCard key={event.id} event={event} language={language} past={isPast} />)}</div>;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <section className="event-gradient border-b border-event-border py-12 text-event-foreground md:py-16">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase text-secondary">{language === "fr" ? "Calendrier WCA" : "WCA Calendar"}</p>
              <h1 className="mt-3 font-bold">{language === "fr" ? "Événements à venir" : "Upcoming Events"}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-event-muted">{language === "fr" ? "Rencontrez notre communauté lors de nos prochains rassemblements, conférences et rencontres." : "Connect with our community at upcoming gatherings, conferences, and meetings."}</p>
            </div>
            <div className="mx-auto mt-8 max-w-3xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-event-muted" />
                <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={language === "fr" ? "Rechercher des événements…" : "Search events…"} className="h-12 border-event-border bg-event-surface/90 pl-12 text-event-foreground placeholder:text-event-muted focus-visible:ring-secondary" />
              </div>
              <Button variant="outline" onClick={() => setShowFilters((current) => !current)} className="mt-4 w-full border-event-border bg-event-surface text-event-foreground hover:bg-event-elevated hover:text-event-foreground md:hidden"><Filter />{showFilters ? (language === "fr" ? "Masquer les filtres" : "Hide filters") : (language === "fr" ? "Afficher les filtres" : "Show filters")}</Button>
              <div className={cn("mt-5 flex-wrap justify-center gap-2", showFilters ? "flex" : "hidden md:flex")}>
                {categories.map((category) => <Button key={category} size="sm" variant={selectedCategory === category ? "secondary" : "outline"} onClick={() => setSelectedCategory(category)} className={cn(selectedCategory !== category && "border-event-border bg-event-surface text-event-muted hover:bg-event-elevated hover:text-event-foreground")}>{category === "All" && language === "fr" ? "Tous" : category}</Button>)}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container-custom">
            <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase text-secondary">{language === "fr" ? "À venir" : "Next gatherings"}</p><h2 className="mt-2 text-2xl font-bold">{language === "fr" ? "Prochains événements" : "Upcoming Events"}</h2></div><span className="text-sm text-muted-foreground">{filteredUpcoming.length} {language === "fr" ? "événements" : "events"}</span></div>
            {renderList(filteredUpcoming, false, false, language === "fr" ? "Aucun événement à venir" : "No upcoming events found")}
          </div>
        </section>

        <section className="border-y bg-muted/45 py-12 md:py-16">
          <div className="container-custom">
            <div className="mb-7"><p className="text-sm font-semibold uppercase text-secondary">{language === "fr" ? "Archives" : "Archive"}</p><h2 className="mt-2 text-2xl font-bold">{language === "fr" ? "Événements passés" : "Past Events"}</h2></div>
            {renderList(filteredPast, false, false, language === "fr" ? "Aucun événement passé" : "No past events found", true)}
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container-custom grid items-center gap-6 border-y border-primary/20 py-10 md:grid-cols-[1fr_auto]">
            <div><p className="text-sm font-semibold uppercase text-secondary">{language === "fr" ? "Organisez avec WCA" : "Host with WCA"}</p><h2 className="mt-2 text-2xl font-bold">{language === "fr" ? "Organisez un événement dans votre région" : "Organize an event in your region"}</h2><p className="mt-3 max-w-2xl text-muted-foreground">{language === "fr" ? "Nous accompagnons les responsables locaux avec des ressources et un soutien pratique." : "We support local leaders with the resources and practical guidance to host meaningful gatherings."}</p></div>
            <div className="flex flex-wrap gap-3"><Button asChild><Link to="/locations">{language === "fr" ? "Trouver une région" : "Find a location"}</Link></Button><Button variant="outline" asChild><a href="mailto:info@wcaglobal.org">{language === "fr" ? "Nous contacter" : "Contact us"}</a></Button></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
