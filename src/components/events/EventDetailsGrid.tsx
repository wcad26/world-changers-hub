import { Info } from "lucide-react";
import { Event } from "@/hooks/useEvents";

interface EventDetailsGridProps {
  event: Event;
}

export function EventDetailsGrid({ event }: EventDetailsGridProps) {
  return (
    <section className="py-5 bg-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About This Event
          </h2>
          <p className="text-muted-foreground mx-auto">
            {event.description || "No description available for this event."}
          </p>
        </div>

        {/* Description Section - Card removed */}
      </div>
    </section>
  );
}
