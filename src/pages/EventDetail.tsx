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

export default function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEventById(eventId);

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
        {/* Hero Section */}
        <EventHeroSection event={event} />
        
        {/* Gallery Carousel */}
        <EventGalleryCarousel event={event} />
        
        {/* Details Grid */}
        <EventDetailsGrid event={event} />
        
        {/* Registration/CTA Section */}
        <EventRegistrationSection event={event} />
        
        {/* Testimonials */}
        <EventTestimonials />
        
        {/* Related Events Carousel */}
        <RelatedEventsCarousel currentEventId={event.id} />
        
        {/* FAQ Section */}
        <EventFAQ />
      </main>
      
      <Footer />
    </div>
  );
}
