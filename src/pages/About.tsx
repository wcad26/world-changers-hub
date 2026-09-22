import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronDown, MapPin, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "@/lib/router-compat";
import { aboutContentQueryOptions } from "@/lib/public-site.functions";
import type { GlobalContentData } from "@/hooks/useGlobalContent";
import { useLanguage } from "@/hooks/useLanguage";
import { renderIcon } from "@/utils/iconMapping";
import fallbackHero from "@/assets/wca-community-hero.jpg";

const fallbackContent: GlobalContentData = {
  hero: { slides: [], mission_points: [] },
  values: [],
  milestones: [],
  team: [],
  cta: { title: "Join Our Mission", description: "Be part of a community committed to transforming lives and serving the world." },
};

export default function About() {
  const { data } = useSuspenseQuery(aboutContentQueryOptions());
  const { language } = useLanguage();
  const [openBio, setOpenBio] = useState<number | null>(null);
  const content = (data?.content as unknown as GlobalContentData | null) ?? fallbackContent;
  const slide = content.hero?.slides?.find((item) => item.image) ?? content.hero?.slides?.[0];
  const heroImage = slide?.image || fallbackHero;
  const fr = language === "fr";
  const missionPoints = content.hero?.mission_points?.filter((point) => point.trim()) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <section className="relative min-h-[72svh] border-b border-event-border bg-event-background text-event-foreground sm:min-h-[78svh]">
          <img src={heroImage} alt={fr ? "La communauté World Changers Association" : "World Changers Association community"} width={1600} height={900} fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--event-background)_0%,color-mix(in_oklab,var(--event-background)_86%,transparent)_48%,color-mix(in_oklab,var(--event-background)_22%,transparent)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--event-background)_0%,transparent_48%)] opacity-75" />
          <div className="container-custom relative z-10 flex min-h-[72svh] items-end pb-12 pt-24 sm:min-h-[78svh] sm:items-center sm:pb-16">
            <div className="max-w-3xl animate-fade-in">
              <p className="inline-flex rounded-full bg-secondary px-5 py-2 text-xs font-semibold uppercase text-secondary-foreground shadow-card">{fr ? "Notre histoire" : "Our story"}</p>
              <h1 className="mt-5 max-w-3xl text-balance font-heading text-4xl font-bold leading-[1.04] text-event-foreground sm:text-6xl lg:text-7xl">
                {slide?.title || (fr ? "Une communauté qui forme des acteurs de changement." : "A community shaping people who change their world.")}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-event-muted sm:text-lg">
                {slide?.description || (fr ? "WCA rassemble la foi, la formation au leadership et le service pour transformer les vies et les communautés." : "WCA brings faith, leadership development, and service together to transform lives and communities.")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="home-magnetic"><Link to="/locations">{fr ? "Trouver une communauté" : "Find a community"}<MapPin /></Link></Button>
                <Button asChild size="lg" variant="outline" className="border-event-border bg-event-surface/70 text-event-foreground backdrop-blur-md hover:bg-event-elevated hover:text-event-foreground"><Link to="/events">{fr ? "Voir les événements" : "Explore events"}<ArrowRight /></Link></Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="container-custom grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-semibold uppercase text-secondary">{fr ? "Qui nous sommes" : "Who we are"}</p>
              <h2 className="mt-4 text-balance font-semibold">{fr ? "Une vision vécue en communauté." : "A vision lived out in community."}</h2>
            </div>
            <div>
              <p className="text-pretty font-heading text-2xl font-semibold leading-relaxed text-foreground sm:text-3xl">
                {fr ? "Nous bâtissons un réseau de communautés spirituellement, intellectuellement et économiquement autonomes." : "We are building a network of fellowships that are spiritually, intellectually, and economically empowered."}
              </p>
              {missionPoints.length > 0 && <div className="mt-9 grid gap-4 sm:grid-cols-2">{missionPoints.map((point, index) => <div key={`${point}-${index}`} className="flex gap-3 border-t border-border pt-4 text-sm leading-6 text-muted-foreground"><Check className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />{point}</div>)}</div>}
            </div>
          </div>
        </section>

        {content.values.length > 0 && <section className="border-y border-border bg-muted/35 py-16 sm:py-24">
          <div className="container-custom">
            <div className="grid gap-7 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
              <div><p className="text-xs font-semibold uppercase text-secondary">{fr ? "Ce qui nous guide" : "What guides us"}</p><h2 className="mt-3 font-semibold">{fr ? "Nos valeurs en action" : "Our values in action"}</h2></div>
              <p className="max-w-2xl leading-7 text-muted-foreground lg:justify-self-end">{fr ? "Ces convictions façonnent notre manière de diriger, de servir et de grandir ensemble." : "These convictions shape how we lead, serve, and grow together."}</p>
            </div>
            <div className="mt-10 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-5">
              {content.values.map((value, index) => <article key={`${value.title}-${index}`} className="group min-h-64 border-b border-r border-border bg-card p-6 transition-colors hover:bg-accent/45">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">{renderIcon(value.icon, "h-5 w-5")}</div>
                <p className="mt-8 text-xs font-semibold text-secondary">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold">{value.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{value.description}</p>
              </article>)}
            </div>
          </div>
        </section>}

        {content.milestones.length > 0 && <section className="event-gradient py-16 text-event-foreground sm:py-24">
          <div className="container-custom grid gap-12 lg:grid-cols-[0.6fr_1.4fr]">
            <div className="lg:sticky lg:top-28 lg:self-start"><p className="text-xs font-semibold uppercase text-secondary">{fr ? "Notre parcours" : "Our journey"}</p><h2 className="mt-4 font-semibold text-event-foreground">{fr ? "Des étapes qui ont façonné le mouvement." : "Milestones that shaped the movement."}</h2><p className="mt-5 max-w-md leading-7 text-event-muted">{fr ? "De ses débuts au Cameroun à une communauté internationale en croissance." : "From its beginnings in Cameroon to a growing international community."}</p></div>
            <ol className="border-t border-event-border">
              {content.milestones.map((milestone, index) => <li key={`${milestone.year}-${index}`} className="grid gap-4 border-b border-event-border py-7 sm:grid-cols-[7rem_1fr] sm:py-9">
                <span className="font-heading text-2xl font-semibold text-secondary">{milestone.year}</span>
                <div><h3 className="text-xl font-semibold text-event-foreground">{milestone.title}</h3><p className="mt-3 leading-7 text-event-muted">{milestone.description}</p></div>
              </li>)}
            </ol>
          </div>
        </section>}

        {content.team.length > 0 && <section className="py-16 sm:py-24">
          <div className="container-custom">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase text-secondary">{fr ? "Direction" : "Leadership"}</p><h2 className="mt-3 font-semibold">{fr ? "Les personnes au service de la vision" : "People serving the vision"}</h2><p className="mt-4 leading-7 text-muted-foreground">{fr ? "Une équipe engagée qui apporte expérience, foi et responsabilité au mouvement." : "A committed team bringing experience, faith, and accountability to the movement."}</p></div>
            <div className="mt-10 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {content.team.map((member, index) => <article key={`${member.name}-${index}`} className="overflow-hidden border-b border-border pb-5">
                <div className="aspect-[4/4.5] overflow-hidden rounded-md bg-muted"><img src={member.image} alt={member.name} width={720} height={810} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-[1.03]" /></div>
                <p className="mt-5 text-xs font-semibold uppercase text-secondary">{member.role}</p><h3 className="mt-2 text-xl font-semibold">{member.name}</h3>
                {member.bio && <Collapsible open={openBio === index} onOpenChange={(open) => setOpenBio(open ? index : null)}><CollapsibleTrigger className="mt-4 flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-primary">{openBio === index ? (fr ? "Masquer la biographie" : "Hide biography") : (fr ? "Lire la biographie" : "Read biography")}<ChevronDown className={`h-4 w-4 transition-transform ${openBio === index ? "rotate-180" : ""}`} /></CollapsibleTrigger><CollapsibleContent><p className="pt-3 text-sm leading-6 text-muted-foreground">{member.bio}</p></CollapsibleContent></Collapsible>}
              </article>)}
            </div>
          </div>
        </section>}

        <section className="pb-16 sm:pb-24"><div className="container-custom"><div className="event-gradient grid overflow-hidden rounded-md border border-event-border text-event-foreground shadow-regal lg:grid-cols-[0.9fr_1.1fr]"><div className="p-7 sm:p-10 lg:p-12"><Sparkles className="h-8 w-8 text-secondary" /><h2 className="mt-6 text-3xl font-semibold text-event-foreground">{content.cta?.title || (fr ? "Rejoignez notre mission" : "Join our mission")}</h2><p className="mt-4 max-w-xl leading-7 text-event-muted">{content.cta?.description || (fr ? "Prenez part à une communauté qui transforme des vies." : "Take your place in a community transforming lives.")}</p></div><div className="flex flex-wrap content-center gap-3 border-t border-event-border bg-event-surface/55 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12"><Button asChild variant="secondary"><Link to="/locations">{fr ? "Trouver une communauté" : "Find a community"}<MapPin /></Link></Button><Button asChild variant="outline" className="border-event-border bg-event-background/40 text-event-foreground hover:bg-event-elevated hover:text-event-foreground"><a href="mailto:info@wcaglobal.org">{fr ? "Nous contacter" : "Contact us"}</a></Button></div></div></div></section>
      </main>
      <Footer />
    </div>
  );
}