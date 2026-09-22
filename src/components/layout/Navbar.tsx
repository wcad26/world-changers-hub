import { useState } from "react";
import { ChevronDown, Languages, Mail, Menu, Phone } from "lucide-react";
import { Link, useLocation } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const mainLinks = [
  { to: "/", en: "Home", fr: "Accueil" },
  { to: "/about", en: "About Us", fr: "À propos" },
  { to: "/locations", en: "Locations", fr: "Emplacements" },
  { to: "/events", en: "Events", fr: "Événements" },
];

const resourceLinks = [
  { to: "/media", en: "Media & Sermons", fr: "Médias et sermons" },
  { to: "/store", en: "Store / Library", fr: "Boutique / Bibliothèque" },
  { to: "/blog", en: "News & Blog", fr: "Actualités et blog" },
  { to: "/counseling", en: "Counselling", fr: "Conseil" },
  { to: "/fundraising", en: "Fundraising", fr: "Collecte de fonds" },
];

export default function Navbar() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const label = (item: { en: string; fr: string }) => language === "fr" ? item.fr : item.en;
  const isActive = (to: string) => to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
  const resourcesActive = resourceLinks.some(({ to }) => isActive(to));
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/94 shadow-xs backdrop-blur-xl">
      <div className="container-custom flex h-[72px] items-center justify-between gap-4">
        <Link to="/" className="flex min-w-0 items-center" aria-label="World Changers Association home">
          <img src="/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png" alt="World Changers Association" className="h-10 w-auto max-w-[150px] object-contain dark:brightness-0 dark:invert" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {mainLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive(item.to) ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                isActive(item.to) ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {label(item)}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={resourcesActive ? "default" : "ghost"} className="gap-1 px-3">
                {language === "fr" ? "Ressources" : "Resources"}<ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-52">
              {resourceLinks.map((item) => <DropdownMenuItem key={item.to} asChild><Link to={item.to} className="w-full">{label(item)}</Link></DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 xl:flex">
            <Button variant="ghost" size="icon" asChild><a href="tel:+237690634860" aria-label="Call World Changers Association"><Phone /></a></Button>
            <Button variant="ghost" size="icon" asChild><a href="mailto:info@wcaglobal.org" aria-label="Email World Changers Association"><Mail /></a></Button>
          </div>
          <ThemeToggle />
          <Button size="sm" asChild className="hidden sm:inline-flex"><Link to="/locations">{language === "fr" ? "Visitez-nous" : "Visit Us"}</Link></Button>
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" aria-label="Open navigation"><Menu /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,90vw)] border-l-0 p-0">
              <div className="border-b bg-primary px-6 py-5 text-primary-foreground">
                <img src="/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png" alt="World Changers Association" className="h-10 w-auto brightness-0 invert" />
              </div>
              <nav className="space-y-1 p-4" aria-label="Mobile navigation">
                {mainLinks.map((item) => (
                  <Link key={item.to} to={item.to} className={cn("block rounded-md px-4 py-3 font-semibold", isActive(item.to) ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent")}>{label(item)}</Link>
                ))}
                <button
                  type="button"
                  onClick={() => setResourcesOpen((open) => !open)}
                  aria-expanded={resourcesOpen}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-4 py-3 font-semibold",
                    resourcesActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                  )}
                >
                  {language === "fr" ? "Ressources" : "Resources"}
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", resourcesOpen && "rotate-180")} />
                </button>
                {resourcesOpen && (
                  <div className="space-y-1 pt-1">
                    {resourceLinks.map((item) => <Link key={item.to} to={item.to} className="block rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">{label(item)}</Link>)}
                  </div>
                )}
              </nav>
              <div className="mx-4 border-t px-4 pb-1 pt-4">
                <p className="flex items-center gap-2 pb-2 text-xs font-semibold uppercase text-muted-foreground">
                  <Languages className="h-4 w-4" />{language === "fr" ? "Langue" : "Language"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("en")}
                    aria-pressed={language === "en"}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === "fr" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage("fr")}
                    aria-pressed={language === "fr"}
                  >
                    Français
                  </Button>
                </div>
                <p className="pt-2 text-xs text-muted-foreground">
                  {language === "fr" ? "Choisissez la langue du site" : "Choose the website language"}
                </p>
              </div>
              <div className="mx-4 border-t p-4">
                <Button asChild className="w-full"><Link to="/locations">{language === "fr" ? "Visitez-nous" : "Visit Us"}</Link></Button>
                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <a href="tel:+237690634860" className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" />+237 690 63 48 60</a>
                  <a href="mailto:info@wcaglobal.org" className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" />info@wcaglobal.org</a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}