import { Info } from "lucide-react";
import { Event } from "@/hooks/useEvents";

interface EventDetailsGridProps {
  event: Event;
}

export function EventDetailsGrid({ event }: EventDetailsGridProps) {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About This Event
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about this event
          </p>
        </div>

        {/* Description Section */}
        <div className="glass-panel-soft p-8 md:p-12 animate-fade-in-up max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Info className="h-6 w-6 text-primary" />
            About This Event
          </h3>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-muted-foreground leading-relaxed">
              {event.description || "No description available for this event."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
