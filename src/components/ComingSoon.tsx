import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  highlights?: string[];
}

const ComingSoon = ({ title, description, icon: Icon, highlights = [] }: ComingSoonProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <section className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Gradient header */}
              <div className="relative bg-gradient-to-br from-primary to-accent px-6 py-12 md:px-12 md:py-16 text-center">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
                  <div className="absolute bottom-0 right-8 h-52 w-52 rounded-full bg-primary-foreground/10 blur-3xl" />
                </div>
                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Coming soon
                  </span>
                  <div className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-primary-foreground/25 bg-primary-foreground/10 backdrop-blur">
                    <Icon className="h-9 w-9 text-primary-foreground" />
                  </div>
                  <h1 className="mt-6 text-3xl md:text-5xl font-bold text-primary-foreground">{title}</h1>
                  <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85 text-base md:text-lg">
                    {description}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 md:p-10 space-y-8">
                {highlights.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {highlights.map((h) => (
                      <div
                        key={h}
                        className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-center text-sm text-muted-foreground backdrop-blur"
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-accent" />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    We're putting the finishing touches together. Check back shortly.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    <Link to="/">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to home
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                    <Link to="/events">Explore upcoming events</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ComingSoon;
