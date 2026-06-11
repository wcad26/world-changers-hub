import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useEventById } from "@/hooks/useEvents";
import { useEventBySlugWithHistory } from "@/hooks/useEventBySlugWithHistory";
import { useLanguage } from "@/hooks/useLanguage";
import { isUUID } from "@/utils/slugUtils";
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
import { Calendar, Clock, MapPin, Users, MessageCircle, UserPlus } from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  // Detect if eventId is a UUID or slug
  const isEventIdUUID = eventId ? isUUID(eventId) : false;
  
  // Fetch event by appropriate method
  const { data: eventById, isLoading: isLoadingById, error: errorById } = useEventById(isEventIdUUID ? eventId : undefined);
  const { data: eventData, isLoading: isLoadingBySlug, error: errorBySlug } = useEventBySlugWithHistory(!isEventIdUUID ? eventId : undefined);
  
  // Handle automatic redirects for old slugs
  useEffect(() => {
    if (eventData?.isRedirect && eventData.newSlug) {
      navigate(`/events/${eventData.newSlug}`, { replace: true });
    }
  }, [eventData, navigate]);
  
  // Use whichever query is active
  const event = isEventIdUUID ? eventById : eventData?.event;
  const isLoading = isEventIdUUID ? isLoadingById : isLoadingBySlug;
  const error = isEventIdUUID ? errorById : errorBySlug;
  
  const { localizedField, t } = useLanguage();
  const [preRegOpen, setPreRegOpen] = useState(false);

  const getStatusBadge = () => {
    if (!event) return null;
    const eventDate = new Date(event.start_datetime);
    
    if (event.status === "Completed") {
      return <Badge className="bg-muted text-muted-foreground">{t('completed')}</Badge>;
    }
    if (event.status === "Cancelled") {
      return <Badge variant="destructive">{t('cancelled')}</Badge>;
    }
    if (isToday(eventDate)) {
      return <Badge className="bg-gradient-to-r from-primary to-accent text-white animate-glow">{t('today')}</Badge>;
    }
    if (isFuture(eventDate)) {
      return <Badge className="bg-[#5DBAB7] text-black border-2 border-[#5DBAB7]">{t('upcoming')}</Badge>;
    }
    if (isPast(eventDate)) {
      return <Badge variant="secondary">{t('pastEvent')}</Badge>;
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
            <h2 className="text-2xl font-bold mb-4">{t('eventNotFound')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('eventNotFoundDesc')}
            </p>
            <a
              href="/events"
              className="text-primary hover:underline font-semibold"
            >
              {t('backToEvents')}
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
                  ⭐ {t('featured')}
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
                {localizedField(event.name, event.name_fr)}
              </h1>
              
              {/* Action Buttons - Only show if registration is available */}
              {canRegister && (
                <div className="flex flex-col gap-2 lg:gap-3 w-full max-w-sm">
                  {(event as any).is_special && (event as any).requires_pre_registration && (
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 px-3 py-2 text-sm md:px-6 md:py-3 md:text-base shadow-lg w-full"
                      onClick={() => setPreRegOpen(true)}
                    >
                      <UserPlus className="mr-1.5 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
                      Pre-Register
                    </Button>
                  )}

                  <Button 
                    className="bg-[#35adaf] hover:bg-[#35adaf]/90 text-white transition-all hover:scale-105 px-3 py-2 text-sm md:px-6 md:py-3 md:text-base w-full"
                    onClick={() => {
                      if (event.whatsapp_contact) {
                        const phoneNumber = event.whatsapp_contact.replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${phoneNumber}`, '_blank');
                      }
                    }}
                    disabled={!event.whatsapp_contact}
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
                    {t('contactUs')}
                  </Button>
                  
                  {event.registration_url && (
                    <Button 
                      className="bg-[#542a8f] hover:bg-[#542a8f]/90 text-white transition-all hover:scale-105 px-3 py-2 text-sm md:px-6 md:py-3 md:text-base w-full"
                      onClick={() => window.open(event.registration_url, '_blank')}
                    >
                      <Calendar className="mr-1.5 h-4 w-4 md:mr-2 md:h-5 md:w-5" />
                      {t('registerForEvent')}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90">
                <Calendar className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">{t('date')}</p>
                <p className="font-semibold">{format(new Date(event.start_datetime), "MMM dd, yyyy")}</p>
              </div>
              
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90">
                <Clock className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">{t('time')}</p>
                <p className="font-semibold">{format(new Date(event.start_datetime), "h:mm a")}</p>
              </div>
              
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90 col-span-2 md:col-span-1">
                <MapPin className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">{t('location')}</p>
                <p className="font-semibold truncate">{localizedField(event.location_name, event.location_name_fr) || "TBA"}</p>
              </div>
              
              <div className="glass-panel-soft p-4 hover:scale-105 transition-all duration-300 border border-white/10 backdrop-blur-md bg-white/90 dark:bg-background/90 col-span-2 md:col-span-1">
                <Users className="h-5 w-5 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">{t('capacity')}</p>
                <p className="font-semibold">{event.capacity ? `${event.capacity} ${t('people')}` : t('unlimited')}</p>
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
      
      <EventPreRegistrationDialog open={preRegOpen} onOpenChange={setPreRegOpen} event={event} />
      <Footer />
    </div>
  );
}
