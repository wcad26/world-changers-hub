import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isToday, isPast, isFuture } from "date-fns";
import { Event } from "@/hooks/useEvents";

interface EventHeroSectionProps {
  event: Event;
}

export function EventHeroSection({ event }: EventHeroSectionProps) {
  const getStatusBadge = () => {
    const eventDate = new Date(event.start_datetime);
    
    if (event.status === "Completed") {
      return <Badge className="bg-muted text-muted-foreground">Completed</Badge>;
    }
    if (event.status === "Cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    if (isToday(eventDate)) {
      return <Badge className="bg-gradient-to-r from-primary to-accent text-white animate-glow">Today</Badge>;
    }
    if (isFuture(eventDate)) {
      return <Badge className="bg-primary/20 text-primary border border-primary/30">Upcoming</Badge>;
    }
    if (isPast(eventDate)) {
      return <Badge variant="secondary">Past Event</Badge>;
    }
    return null;
  };

  return (
    <div className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: event.image_url 
            ? `url(${event.image_url})` 
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-12 md:pb-20">
        <div className="container-custom">
          {/* Back Button */}
          <Link to="/events">
            <Button 
              variant="ghost" 
              className="glass-panel-soft mb-6 hover:scale-105 transition-transform"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up">
            {event.is_featured && (
              <Badge className="bg-gradient-to-r from-accent to-primary text-white px-4 py-1.5">
                ⭐ Featured Event
              </Badge>
            )}
            {getStatusBadge()}
            {event.category && (
              <Badge variant="outline" className="glass-panel-soft border-primary/30">
                {event.category}
              </Badge>
            )}
          </div>

          {/* Event Title */}
          <h1 className="text-fluid-4xl md:text-fluid-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up leading-tight">
            {event.name}
          </h1>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
            <div className="glass-panel-soft p-4 hover:scale-105 transition-transform">
              <Calendar className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-semibold">{format(new Date(event.start_datetime), "MMM dd, yyyy")}</p>
            </div>
            
            <div className="glass-panel-soft p-4 hover:scale-105 transition-transform">
              <Clock className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-semibold">{format(new Date(event.start_datetime), "h:mm a")}</p>
            </div>
            
            <div className="glass-panel-soft p-4 hover:scale-105 transition-transform col-span-2 md:col-span-1">
              <MapPin className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-semibold truncate">{event.location_name || "TBA"}</p>
            </div>
            
            <div className="glass-panel-soft p-4 hover:scale-105 transition-transform col-span-2 md:col-span-1">
              <Users className="h-5 w-5 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Capacity</p>
              <p className="font-semibold">{event.capacity ? `${event.capacity} people` : "Unlimited"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
