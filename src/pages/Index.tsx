import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Mission from '@/components/home/Mission';
import Features from '@/components/home/Features';
import { ArrowRight, MapPin, Calendar, Bell, Clock } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { GlassCard } from '@/components/ui/GlassPanels';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { useFeaturedEvents } from '@/hooks/useEvents';
import { formatEventDuration } from '@/utils/dateUtils';

const testimonials = [
  {
    id: 1,
    quote: "The leadership training I received at WCA transformed not just my career, but my entire approach to life and service.",
    author: "Michael Johnson",
    role: "Business Leader"
  },
  {
    id: 2,
    quote: "Finding WCA was a turning point in my spiritual journey. The community here has become like family to me.",
    author: "Sarah Williams",
    role: "Community Member"
  },
  {
    id: 3,
    quote: "The mentorship program equipped me with the tools I needed to make a real difference in my community.",
    author: "David Chen",
    role: "Social Entrepreneur"
  }
];

const Index = () => {
  const { data: contentData } = useHomepageContent();
  const { data: featuredEvents, isLoading: isLoadingEvents } = useFeaturedEvents();
  const homepageData = contentData?.content as any;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <Mission />
        <Features />
        
        {/* Upcoming Events Section */}
        <section className="py-16 sm:py-20">
          <div className="container-custom">
            <div className="mb-12 flex flex-col items-center justify-between gap-5 md:flex-row">
              <div>
                <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-secondary md:text-left">Gather with us</p>
                <h2 className="text-center font-heading font-semibold text-foreground md:text-left">
                  {homepageData?.events?.title || 'Upcoming Events'}
                </h2>
                <p className="mt-2 text-center text-muted-foreground md:text-left">
                  {homepageData?.events?.description || 'Join us at our upcoming events and be part of our growing community.'}
                </p>
              </div>
              <Link to="/events" className="inline-flex min-h-10 items-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-xs transition-colors hover:bg-accent md:mt-0">
                View All Events
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
            
            {isLoadingEvents ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="mb-4 h-48 rounded-md bg-muted"></div>
                    <div className="space-y-2 p-6">
                      <div className="h-6 w-3/4 rounded bg-muted"></div>
                      <div className="h-4 w-full rounded bg-muted"></div>
                      <div className="h-4 w-1/2 rounded bg-muted"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredEvents && featuredEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {featuredEvents.slice(0, 6).map((event) => {
                  const { dateRange, timeRange, isMultiDay } = formatEventDuration(event.start_datetime, event.end_datetime);
                  
                  return (
                    <GlassCard key={event.id} className="overflow-hidden">
                      <div className="h-48 relative overflow-hidden">
                        {event.image_url ? (
                          <img 
                            src={event.image_url} 
                            alt={event.name} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="event-gradient flex h-full w-full items-center justify-center">
                            <Calendar size={48} className="text-event-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-xl mb-2">{event.name}</h3>
                        {event.description && (
                          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                        )}
                        <div className="mb-2 flex items-center text-muted-foreground">
                          <Calendar size={16} className="mr-2 text-primary" />
                          <span className="text-sm">{dateRange}</span>
                          {isMultiDay && <span className="ml-2 rounded-sm bg-secondary/10 px-2 py-1 text-xs text-secondary">Multi-day</span>}
                        </div>
                        <div className="mb-2 flex items-center text-muted-foreground">
                          <Clock size={16} className="mr-2 text-primary" />
                          <span className="text-sm">{timeRange}</span>
                        </div>
                        {event.location_name && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin size={16} className="mr-2 text-primary" />
                            <span className="text-sm">{event.location_name}</span>
                          </div>
                        )}
                        <Link 
                          to="/events" 
                          className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                        >
                          Learn More
                        </Link>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto mb-4 text-muted-foreground/60" />
                <p className="text-muted-foreground">No featured events at the moment. Check back soon!</p>
              </div>
            )}
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="border-y border-border/70 bg-muted/35 py-16 sm:py-20">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="mb-4 inline-block rounded-sm bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                Testimonials
              </div>
              <h2 className="font-heading font-semibold text-foreground">
                {homepageData?.testimonials?.title || 'Stories of Transformation'}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {homepageData?.testimonials?.description || 'Hear from members of our community whose lives have been changed through our programs and fellowships.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {(homepageData?.testimonials?.testimonials || testimonials).map((testimonial: any) => (
                <GlassCard key={testimonial.id} className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="font-heading text-4xl text-primary">“</div>
                  </div>
                  <p className="mb-6 text-center italic leading-6 text-muted-foreground">
                    {testimonial.quote}
                  </p>
                  <div className="flex flex-col items-center">
                    <div className="event-gradient mb-3 h-12 w-12 rounded-full"></div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="event-gradient border-b border-event-border py-16 text-event-foreground sm:py-20">
          <div className="container-custom">
            <div className="mx-auto max-w-4xl text-center">
              <Bell size={40} className="mx-auto mb-8 text-secondary" />
              <h2 className="font-bold mb-4">
                {homepageData?.newsletter?.title || 'Stay Updated With WCA'}
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-event-muted">
                {homepageData?.newsletter?.description || 'Subscribe to our newsletter to receive updates about events, resources, and opportunities to get involved.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto justify-center">
                <input 
                  type="email" 
                  placeholder={homepageData?.newsletter?.placeholder || 'Enter your email'}
                  className="min-h-11 flex-[5] rounded-md border border-event-border bg-event-surface/80 px-4 py-3 text-event-foreground placeholder:text-event-muted focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <input 
                  type="tel" 
                  placeholder="Phone number"
                  className="min-h-11 flex-[3] rounded-md border border-event-border bg-event-surface/80 px-4 py-3 text-event-foreground placeholder:text-event-muted focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                <button className="min-h-11 whitespace-nowrap rounded-md bg-primary-foreground px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary-foreground/90">
                  {homepageData?.newsletter?.buttonText || 'Subscribe'}
                </button>
              </div>
              <p className="mt-4 text-xs text-event-muted">
                {homepageData?.newsletter?.disclaimer || 'We respect your privacy. Unsubscribe at any time.'}
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
