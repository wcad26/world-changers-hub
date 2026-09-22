import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { useEffect } from "react";
import { useEventById } from "@/hooks/useEvents";
import { useEventBySlugWithHistory } from "@/hooks/useEventBySlugWithHistory";
import { useLanguage } from "@/hooks/useLanguage";
import { isUUID } from "@/utils/slugUtils";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { EventExperienceHeader } from "@/components/events/EventExperienceHeader";
import { EventInformation } from "@/components/events/EventInformation";
import { EventMobileActionBar, EventRegistrationPanel } from "@/components/events/EventRegistrationPanel";
import { EventGalleryCarousel } from "@/components/events/EventGalleryCarousel";
import { EventSpeakers } from "@/components/events/EventSpeakers";
import { RelatedEventsCarousel } from "@/components/events/RelatedEventsCarousel";
import { EventTestimonials } from "@/components/events/EventTestimonials";
import { EventFAQ } from "@/components/events/EventFAQ";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

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
  
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-event-background">
        <Navbar />
        <main className="flex-1">
          <div className="h-[68vh] bg-event-surface animate-pulse" />
          <div className="container-custom py-14">
            <div className="space-y-8">
              <Skeleton className="h-10 w-2/3 bg-event-elevated" />
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
                <Skeleton className="h-80 bg-event-elevated" />
                <Skeleton className="h-96 bg-event-elevated" />
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
      <div className="min-h-screen flex flex-col bg-event-background text-event-foreground">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-md p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('eventNotFound')}</h2>
            <p className="text-event-muted mb-6">
              {t('eventNotFoundDesc')}
            </p>
            <Link to="/events" className="inline-flex items-center gap-2 font-semibold text-accent hover:underline"><ArrowLeft className="h-4 w-4" />{t('backToEvents')}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="event-experience min-h-screen bg-event-background font-manrope text-event-foreground pb-24 lg:pb-0">
      <Navbar />
      <main>
        <EventExperienceHeader event={event} />
        <div className="container-custom py-14 md:py-20">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-16">
            <EventInformation event={event} />
            <EventRegistrationPanel event={event} />
          </div>
        </div>
        <EventSpeakers eventId={event.id} />
        <EventGalleryCarousel event={event} />
        <EventTestimonials eventId={event.id} />
        <EventFAQ eventId={event.id} />
        <RelatedEventsCarousel currentEventId={event.id} />
      </main>
      <Footer />
      <EventMobileActionBar event={event} />
    </div>
  );
}
