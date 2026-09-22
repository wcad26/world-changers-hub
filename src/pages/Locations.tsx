import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, FilterX, Globe2, Heart, MapPin, Phone, Search, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@/lib/router-compat";
import { publicLocationsQueryOptions, type PublicLocation } from "@/lib/public-site.functions";
import { useLanguage } from "@/hooks/useLanguage";
import heroImage from "@/assets/wca-community-hero.jpg";

type FilterType = "all" | "center" | "dcg";

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function regionName(location: PublicLocation) {
  const region = location.region;
  if (Array.isArray(region)) return region[0]?.name ?? "";
  return region?.name ?? "";
}

function LocationCard({ location, fr }: { location: PublicLocation; fr: boolean }) {
  const region = regionName(location);
  const isCenter = location.type === "WCA Center";
  const mapUrl = location.latitude && location.longitude
    ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    : `https://maps.google.com/maps?q=${encodeURIComponent([location.name, location.address, location.city].filter(Boolean).join(" "))}`;
  const phone = location.contact_phone?.replace(/\D/g, "");

  return <article className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-card transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:border-primary/35 hover:shadow-regal">
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {location.image_url ? <img src={location.image_url} alt={location.name} width={800} height={500} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /> : <div className="event-gradient grid h-full place-items-center"><MapPin className="h-12 w-12 text-event-muted" /></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-event-background/85 via-transparent to-transparent" />
      <span className="absolute left-4 top-4 rounded-full bg-event-background/85 px-3 py-1.5 text-xs font-semibold text-event-foreground backdrop-blur-md">{isCenter ? "WCA Center" : "DCG Home"}</span>
      {location.is_featured && <span className="absolute right-4 top-4 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">{fr ? "À la une" : "Featured"}</span>}
      {region && <p className="absolute bottom-4 left-4 flex items-center gap-2 text-sm font-semibold text-event-foreground"><Globe2 className="h-4 w-4 text-secondary" />{region}</p>}
    </div>
    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{location.name}</h2>
      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" /><span>{[location.address, location.city, location.state || location.country].filter(Boolean).join(", ")}</span></p>
        {location.contact_phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-secondary" />{location.contact_phone}</p>}
        {location.capacity && <p className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-secondary" />{fr ? `Capacité : ${location.capacity} personnes` : `Capacity: ${location.capacity} people`}</p>}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
        <Button asChild variant="outline" className="px-3"><a href={mapUrl} target="_blank" rel="noreferrer"><MapPin />{fr ? "Itinéraire" : "Directions"}</a></Button>
        {phone ? <Button asChild variant="secondary" className="px-3"><a href={location.whatsapp_link || `https://wa.me/${phone}`} target="_blank" rel="noreferrer">{fr ? "Contacter" : "Contact"}<ArrowRight /></a></Button> : region ? <Button asChild variant="secondary" className="px-3"><Link to={`/locations/${slugify(region)}`}>{fr ? "Voir" : "Visit"}<ArrowRight /></Link></Button> : null}
      </div>
      {region && phone && <Link to={`/locations/${slugify(region)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">{fr ? "Voir la page régionale" : "View regional page"}<ArrowRight className="h-4 w-4" /></Link>}
    </div>
  </article>;
}

export default function Locations() {
  const { data: locations } = useSuspenseQuery(publicLocationsQueryOptions());
  const { language } = useLanguage();
  const fr = language === "fr";
  const [type, setType] = useState<FilterType>("all");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const regions = useMemo(() => [...new Set(locations.map(regionName).filter(Boolean))].sort(), [locations]);
  const filtered = useMemo(() => locations.filter((location) => {
    if (type === "center" && location.type !== "WCA Center") return false;
    if (type === "dcg" && location.type !== "DCG Location") return false;
    if (region !== "all" && regionName(location) !== region) return false;
    const needle = query.trim().toLowerCase();
    return !needle || [location.name, location.address, location.city, regionName(location)].filter(Boolean).join(" ").toLowerCase().includes(needle);
  }), [locations, query, region, type]);
  const centers = locations.filter((location) => location.type === "WCA Center").length;
  const dcgs = locations.filter((location) => location.type === "DCG Location").length;
  const reset = () => { setType("all"); setQuery(""); setRegion("all"); };

  return <div className="flex min-h-screen flex-col bg-background">
    <Navbar />
    <main className="flex-1 overflow-hidden">
      <section className="relative min-h-[68svh] border-b border-event-border bg-event-background text-event-foreground sm:min-h-[72svh]">
        <img src={heroImage} alt="WCA community" width={1920} height={1280} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--event-background)_0%,color-mix(in_oklab,var(--event-background)_86%,transparent)_50%,color-mix(in_oklab,var(--event-background)_25%,transparent)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--event-background)_0%,transparent_48%)] opacity-75" />
        <div className="container-custom relative z-10 flex min-h-[68svh] items-end pb-12 pt-24 sm:min-h-[72svh] sm:items-center sm:pb-16">
          <div className="max-w-3xl"><p className="inline-flex rounded-full bg-secondary px-5 py-2 text-xs font-semibold uppercase text-secondary-foreground">{fr ? "Un mouvement, plusieurs communautés" : "One movement, many communities"}</p><h1 className="mt-5 text-balance font-heading text-4xl font-bold leading-[1.04] text-event-foreground sm:text-6xl lg:text-7xl">{fr ? "Trouvez votre communauté WCA." : "Find your WCA community."}</h1><p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-event-muted sm:text-lg">{fr ? "Découvrez les centres WCA et les maisons DCG où la foi, la communion fraternelle et la transformation prennent vie." : "Discover WCA Centers and DCG Homes where faith, fellowship, and transformation come to life."}</p>
            <div className="mt-8 grid max-w-xl grid-cols-3 border-y border-event-border py-5"><div><strong className="block text-2xl text-event-foreground sm:text-3xl">{locations.length}</strong><span className="text-xs text-event-muted">{fr ? "Lieux" : "Locations"}</span></div><div className="border-x border-event-border px-4"><strong className="block text-2xl text-event-foreground sm:text-3xl">{centers}</strong><span className="text-xs text-event-muted">WCA Centers</span></div><div className="pl-4"><strong className="block text-2xl text-event-foreground sm:text-3xl">{dcgs}</strong><span className="text-xs text-event-muted">DCG Homes</span></div></div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/35 py-8 sm:py-10"><div className="container-custom"><div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={fr ? "Rechercher par nom, ville ou région…" : "Search by name, city, or region…"} className="h-12 bg-background pl-12" /></div>
        <div className="grid grid-cols-3 gap-2">{([['all', MapPin, fr ? 'Tous' : 'All'], ['center', Building2, 'Centers'], ['dcg', Heart, 'DCG']] as const).map(([key, Icon, label]) => <Button key={key} variant={type === key ? "default" : "outline"} onClick={() => setType(key)} className="px-3"><Icon />{label}</Button>)}</div>
        <Select value={region} onValueChange={setRegion}><SelectTrigger className="h-12 min-w-48 bg-background"><SelectValue placeholder={fr ? "Toutes les régions" : "All regions"} /></SelectTrigger><SelectContent><SelectItem value="all">{fr ? "Toutes les régions" : "All regions"}</SelectItem>{regions.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>
      </div></div></section>

      <section className="py-12 sm:py-16"><div className="container-custom">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-secondary">{fr ? "Notre réseau" : "Our network"}</p><h2 className="mt-2 text-2xl font-semibold">{type === "center" ? "WCA Centers" : type === "dcg" ? "DCG Homes" : (fr ? "Toutes les communautés" : "All communities")}</h2></div><p className="text-sm text-muted-foreground">{filtered.length} {fr ? "résultats" : "results"}</p></div>
        {filtered.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((location) => <LocationCard key={location.id} location={location} fr={fr} />)}</div> : <div className="border-y border-border py-16 text-center"><MapPin className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-4 text-xl font-semibold">{fr ? "Aucun lieu trouvé" : "No locations found"}</h2><p className="mt-2 text-sm text-muted-foreground">{fr ? "Essayez une autre recherche ou réinitialisez les filtres." : "Try another search or reset the filters."}</p><Button variant="outline" onClick={reset} className="mt-6"><FilterX />{fr ? "Réinitialiser" : "Reset filters"}</Button></div>}
      </div></section>

      <section className="pb-16 sm:pb-24"><div className="container-custom"><div className="event-gradient grid overflow-hidden rounded-md border border-event-border text-event-foreground shadow-regal lg:grid-cols-[1fr_auto]"><div className="p-7 sm:p-10"><p className="text-xs font-semibold uppercase text-secondary">{fr ? "Votre région n’est pas affichée ?" : "Not seeing your area?"}</p><h2 className="mt-3 text-3xl font-semibold text-event-foreground">{fr ? "Aidez-nous à vous connecter." : "Let us help you connect."}</h2><p className="mt-4 max-w-2xl leading-7 text-event-muted">{fr ? "Contactez-nous pour connaître les communautés à venir ou démarrer une présence WCA dans votre région." : "Contact us about upcoming communities or bringing WCA to your region."}</p></div><div className="flex items-center border-t border-event-border bg-event-surface/55 p-7 sm:p-10 lg:border-l lg:border-t-0"><Button asChild variant="secondary"><a href="mailto:info@wcaglobal.org">{fr ? "Nous contacter" : "Start a conversation"}<ArrowRight /></a></Button></div></div></div></section>
    </main>
    <Footer />
  </div>;
}