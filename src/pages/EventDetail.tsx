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
        {/* Static Page Header Section - EDITABLE */}
        <section className="bg-gradient-to-b from-background to-muted/20 py-8 border-b">
          <div className="container-custom text-center">
            <p className="text-sm uppercase tracking-wider text-primary font-semibold mb-2">
              Discover Amazing Events
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Join Us For Unforgettable Experiences
            </h1>
          </div>
        </section>

        {/* Hero Section */}
        <EventHeroSection event={event} />
        
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
        
        {/* Details Grid */}
        <EventDetailsGrid event={event} />
        
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
        
        {/* Static Divider - EDITABLE */}
        <section className="py-8 bg-muted/10">
          <div className="container-custom text-center">
            <h3 className="text-2xl font-semibold mb-2 text-foreground">Explore More Events</h3>
            <p className="text-muted-foreground">
              Check out other upcoming events you might enjoy
            </p>
          </div>
        </section>
        
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
