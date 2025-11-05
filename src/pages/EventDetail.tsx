import { useParams } from "react-router-dom";
import { useEventById } from "@/hooks/useEvents";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EventHeroSection } from "@/components/events/EventHeroSection";
import { EventQuickInfoBar } from "@/components/events/EventQuickInfoBar";
import { EventGalleryCarousel } from "@/components/events/EventGalleryCarousel";
import { EventDetailsGrid } from "@/components/events/EventDetailsGrid";
import { RelatedEventsCarousel } from "@/components/events/RelatedEventsCarousel";
import { EventRegistrationSection } from "@/components/events/EventRegistrationSection";
import { EventTestimonials } from "@/components/events/EventTestimonials";
import { EventFAQ } from "@/components/events/EventFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEventById(eventId);

  const getStatusBadge = () => {
    if (!event) return null;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="h-[90vh] bg-muted animate-pulse" />
          <div className="container-custom py-20">
            <div className="space-y-8">
              <Skeleton className="h-12 w-3/4 mx-auto" />
              <Skeleton className="h-64 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center glass-panel-soft p-12 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find the event you're looking for.
            </p>
            <a
              href="/events"
              className="text-primary hover:underline font-semibold"
            >
              ← Back to Events
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Sticky Quick Info Bar */}
      <EventQuickInfoBar event={event} />
      
      <main className="flex-1">
        {/* Hero Slider */}
        <EventHeroSection event={event} />
        
        {/* Event Title & Badges Section */}
        <section className="py-8 bg-background border-b">
          <div className="container-custom">
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
            <h1 className="text-fluid-4xl md:text-fluid-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in-up leading-tight">
              {event.name}
            </h1>
          </div>
        </section>
        
        {/* Quick Info Section */}
        <section className="py-12 relative overflow-hidden bg-hero-pattern border-y border-primary/10">
          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 animate-pulse" />
          
          <div className="container-custom relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90">
                <Calendar className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{format(new Date(event.start_datetime), "MMM dd, yyyy")}</p>
              </div>
              
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90">
                <Clock className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{format(new Date(event.start_datetime), "h:mm a")}</p>
              </div>
              
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90 col-span-2 md:col-span-1">
                <MapPin className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold truncate">{event.location_name || "TBA"}</p>
              </div>
              
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90 col-span-2 md:col-span-1">
                <Users className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-semibold">{event.capacity ? `${event.capacity} people` : "Unlimited"}</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Details Grid - About Event */}
        <EventDetailsGrid event={event} />
        
        {/* Static Section Divider - EDITABLE */}
        <section className="py-12 bg-background">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Event Highlights</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse through our collection of memorable moments and see what makes our events special
            </p>
          </div>
        </section>
        
        {/* Gallery Carousel */}
        <EventGalleryCarousel event={event} />
        
        {/* Static CTA Banner - EDITABLE */}
        <section className="py-16 bg-primary/5 border-y">
          <div className="container-custom text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Join?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
              Reserve your spot today and be part of something extraordinary
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Contact us at events@example.com
            </p>
          </div>
        </section>
        
        {/* Registration/CTA Section */}
        <EventRegistrationSection event={event} />
        
        {/* Testimonials */}
        <EventTestimonials eventId={event.id} />
        
        {/* Related Events Carousel */}
        <RelatedEventsCarousel currentEventId={event.id} />
        
        {/* FAQ Section */}
        <EventFAQ eventId={event.id} />
        
        {/* Static Event Guidelines - EDITABLE */}
        <section className="py-12 bg-background border-t">
          <div className="container-custom max-w-4xl">
            <h3 className="text-xl font-bold mb-4 text-foreground">Event Guidelines</h3>
            <div className="space-y-2 text-muted-foreground text-sm">
              <p>• Please arrive 15 minutes before the event starts</p>
              <p>• Dress code: Smart casual unless otherwise specified</p>
              <p>• Photography is allowed for personal use</p>
              <p>• For cancellations, please notify us 24 hours in advance</p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
