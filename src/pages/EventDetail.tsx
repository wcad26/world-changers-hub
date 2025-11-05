import { useParams } from "react-router-dom";
import { useEventById } from "@/hooks/useEvents";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EventHeroSection } from "@/components/events/EventHeroSection";
import { EventQuickInfoBar } from "@/components/events/EventQuickInfoBar";
import { EventGalleryCarousel } from "@/components/events/EventGalleryCarousel";
import { EventDetailsGrid } from "@/components/events/EventDetailsGrid";
import { EventSpeakers } from "@/components/events/EventSpeakers";
import { RelatedEventsCarousel } from "@/components/events/RelatedEventsCarousel";
import { EventRegistrationSection } from "@/components/events/EventRegistrationSection";
import { EventTestimonials } from "@/components/events/EventTestimonials";
import { EventFAQ } from "@/components/events/EventFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, MessageCircle } from "lucide-react";
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
      return <Badge className="bg-[#5DBAB7] text-black border-2 border-[#5DBAB7]">Upcoming</Badge>;
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

  // Check if event registration is available
  const isUpcoming = isFuture(new Date(event.start_datetime));
  const canRegister = isUpcoming && event.status !== "Cancelled" && event.status !== "Completed";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Sticky Quick Info Bar */}
      <EventQuickInfoBar event={event} />
      
      <main className="flex-1">
        {/* Hero Slider */}
        <EventHeroSection event={event} />
        
        {/* Quick Info Section */}
        <section className="py-12 relative overflow-hidden bg-hero-pattern border-y border-primary/10">
          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 animate-pulse" />
          
          <div className="container-custom relative z-10">
            {/* Badges */}
            <div className="flex flex-nowrap gap-3 mb-6 animate-fade-in-up overflow-x-auto">
              {event.is_featured && (
                <Badge className="bg-gradient-to-r from-accent to-primary text-white px-4 py-1.5">
                  ⭐ Featured
                </Badge>
              )}
              {getStatusBadge()}
              {event.category && (
                <Badge variant="outline" className="glass-panel-soft border-primary/30">
                  {event.category}
                </Badge>
              )}
            </div>

            {/* Event Title & Action Buttons */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10 animate-fade-in-up">
              <h1 className="text-fluid-4xl md:text-fluid-5xl font-bold text-white leading-tight">
                {event.name}
              </h1>
              
              {/* Action Buttons - Only show if registration is available */}
              {canRegister && (
                <div className="flex flex-row gap-3 lg:flex-shrink-0">
                  <Button 
                    size="lg"
                    className="bg-[#35adaf] hover:bg-[#35adaf]/90 text-white whitespace-nowrap transition-all hover:scale-105"
                    onClick={() => {
                      if (event.whatsapp_contact) {
                        const phoneNumber = event.whatsapp_contact.replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${phoneNumber}`, '_blank');
                      }
                    }}
                    disabled={!event.whatsapp_contact}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Contact Us
                  </Button>
                  
                  <Button 
                    size="lg"
                    className="bg-[#542a8f] hover:bg-[#542a8f]/90 text-white whitespace-nowrap transition-all hover:scale-105"
                    onClick={() => event.registration_url && window.open(event.registration_url, '_blank')}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Register for Event
                  </Button>
                </div>
              )}
            </div>

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
        
        {/* Speakers Section */}
        <EventSpeakers eventId={event.id} />
        
        {/* Gallery Carousel */}
        <EventGalleryCarousel event={event} />
        
        {/* Registration/CTA Section */}
        <EventRegistrationSection event={event} />
        
        {/* Testimonials */}
        <EventTestimonials eventId={event.id} />
        
        {/* Related Events Carousel */}
        <RelatedEventsCarousel currentEventId={event.id} />
        
        {/* FAQ Section */}
        <EventFAQ eventId={event.id} />
        
      </main>
      
      <Footer />
    </div>
  );
}
