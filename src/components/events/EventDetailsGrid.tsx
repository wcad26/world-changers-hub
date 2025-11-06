import { Info } from "lucide-react";
import { Event } from "@/hooks/useEvents";

interface EventDetailsGridProps {
  event: Event;
}

export function EventDetailsGrid({ event }: EventDetailsGridProps) {
  return (
    <section className="py-5 bg-muted/20">
      <div className="container-custom">
        <div className="mb-6 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About This Event
          </h2>
          <div className="text-muted-foreground max-w-4xl mx-auto whitespace-pre-line text-left leading-relaxed">
            {event.description || "No description available for this event."}
          </div>
        </div>

        {/* Description Section - Card removed */}
      </div>
    </section>
  );
}
