import { Calendar, MapPin, User, Info, Clock, Tag } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { format } from "date-fns";

interface EventDetailsGridProps {
  event: Event;
}

export function EventDetailsGrid({ event }: EventDetailsGridProps) {
  const details = [
    {
      icon: Calendar,
      title: "Event Schedule",
      content: event.end_datetime 
        ? `${format(new Date(event.start_datetime), "PPP p")} - ${format(new Date(event.end_datetime), "p")}`
        : format(new Date(event.start_datetime), "PPP p"),
    },
    {
      icon: MapPin,
      title: "Location",
      content: event.address || event.location_name || "Location to be announced",
    },
    {
      icon: Tag,
      title: "Category",
      content: event.category || "General Event",
    },
    {
      icon: Info,
      title: "Event Status",
      content: event.status || "Upcoming",
    },
  ];

  return (
    <section className="py-20 bg-muted/20">
      <div className="container-custom">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-fluid-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Event Details
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about this event
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {details.map((detail, index) => (
            <div
              key={index}
              className="glass-panel-soft p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <detail.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-2 text-lg">{detail.title}</h3>
              <p className="text-muted-foreground text-sm">{detail.content}</p>
            </div>
          ))}
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
