import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassSection } from "@/components/events/EventFlowUI";
import { ArrowLeft, CalendarIcon, Mail } from "lucide-react";

export interface LegalSection {
  icon: React.ElementType;
  title: string;
  description?: string;
  body: React.ReactNode;
}

interface LegalPageLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const LegalPageLayout = ({ badge, title, subtitle, lastUpdated, sections }: LegalPageLayoutProps) => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 py-6 px-4 pb-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Hero */}
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground p-6 md:p-8 shadow-xl">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative">
              <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white mb-3 border-0">{badge}</Badge>
              <h1 className="text-2xl md:text-fluid-3xl font-bold leading-tight">{title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm opacity-90">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" />
                  Last updated: {lastUpdated}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  info@wcaglobal.org
                </span>
              </div>
              <p className="mt-4 text-sm opacity-90 max-w-xl">{subtitle}</p>
            </div>
          </header>

          {sections.map((s) => (
            <GlassSection key={s.title} icon={s.icon} title={s.title} description={s.description}>
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary [&_a]:underline">
                {s.body}
              </div>
            </GlassSection>
          ))}

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to home
              </Link>
            </Button>
            <Button asChild className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow">
              <a href="mailto:info@wcaglobal.org">
                <Mail className="h-4 w-4 mr-1" /> Contact us
              </a>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LegalPageLayout;
