import { Link, useParams } from "@/lib/router-compat";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { publicEventQueryOptions } from "@/lib/public-event.functions";
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
import { ArrowLeft } from "lucide-react";

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data } = useSuspenseQuery(publicEventQueryOptions(eventId));
  const event = data.event;
  const { t } = useLanguage();

  if (!event) {
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
