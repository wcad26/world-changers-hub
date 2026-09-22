import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowRight, MapPin, Calendar, Clock, Compass, BookOpen, Heart, Film, Quote, Users, ChevronRight } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { useFeaturedEvents } from '@/hooks/useEvents';
import { formatEventDuration } from '@/utils/dateUtils';
import { renderIcon } from '@/utils/iconMapping';
import heroImage from '@/assets/wca-community-hero.jpg';

const defaultMission = {
  title: 'Our Mission',
  description: 'We are committed to building a network of fellowships that are spiritually, intellectually, and economically empowered to bring positive change.',
  missions: [
    { icon: 'Users', title: 'Win, Train, Transform', description: 'Win the lost at all cost, train them as ministers, transform and empower them into effective leaders.', points: ['Outreach programs to reach the unreached', 'Comprehensive leadership training', 'Spiritual and professional development'] },
    { icon: 'Brain', title: 'Capacity Building', description: 'Promote capacity building for all leaders through education, mentorship, and practical experiences.', points: ['Skill development workshops', 'Mentorship programs', 'Educational resources'] },
    { icon: 'Shield', title: 'Accountability & Integrity', description: 'Ensure strict accountability for leadership transparency and integrity in all aspects.', points: ['Financial transparency', 'Ethical leadership training', 'Accountability structures'] },
  ],
};

const defaultFeatures = [
  { icon: 'MapPin', title: 'WCA Centers & DCG Homes', description: 'Find fellowship centers and discipleship group homes near you with detailed information.', link: '/locations' },
  { icon: 'Calendar', title: 'Events Calendar', description: 'Stay updated with upcoming events, conferences, and gatherings across all locations.', link: '/events' },
  { icon: 'Film', title: 'Media & Sermons', description: 'Access our library of videos, sermons, and teachings to grow your spiritual life.', link: '/media' },
  { icon: 'BookOpen', title: 'Store & Library', description: 'Purchase books, resources, and materials or borrow from our extensive library.', link: '/store' },
  { icon: 'Heart', title: 'Counseling Services', description: 'Schedule appointments with our trained counselors for spiritual guidance.', link: '/counseling' },
  { icon: 'BarChart3', title: 'Fundraising Projects', description: 'Support and track our ongoing fundraising projects and initiatives.', link: '/fundraising' },
];

function TiltSurface({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (event: MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const node = ref.current;
    if (!node) return;
    const bounds = node.getBoundingClientRect();
    node.style.setProperty('--tilt-x', `${((event.clientY - bounds.top) / bounds.height - 0.5) * -3}deg`);
    node.style.setProperty('--tilt-y', `${((event.clientX - bounds.left) / bounds.width - 0.5) * 3}deg`);
  };

  const reset = () => {
    ref.current?.style.setProperty('--tilt-x', '0deg');
    ref.current?.style.setProperty('--tilt-y', '0deg');
  };

  return <div ref={ref} onMouseMove={move} onMouseLeave={reset} className={`home-tilt ${className}`}>{children}</div>;
}

const Index = () => {
  const { data: contentData } = useHomepageContent();
  const { data: featuredEvents, isLoading: isLoadingEvents } = useFeaturedEvents();
  const homepageData = contentData?.content as any;
  const slide = homepageData?.hero?.slides?.[0];
  const mission = homepageData?.mission || defaultMission;
  const features = homepageData?.features?.features || defaultFeatures;
  const testimonials = homepageData?.testimonials?.testimonials || [];
  const leadEvent = featuredEvents?.[0];
  const supportingEvents = featuredEvents?.slice(1, 4) || [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-grow overflow-hidden">
        <section className="relative min-h-[76svh] border-b border-event-border bg-event-background text-event-foreground sm:min-h-[82svh]">
          <img src={heroImage} alt="A vibrant WCA community gathering" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--event-background)_0%,color-mix(in_oklab,var(--event-background)_88%,transparent)_38%,color-mix(in_oklab,var(--event-background)_30%,transparent)_72%,transparent_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--event-background)_0%,transparent_45%)] opacity-70" />
          <div className="container-custom relative z-10 flex min-h-[76svh] items-end pb-12 pt-24 sm:min-h-[82svh] sm:items-center sm:pb-16 sm:pt-20">
            <div className="max-w-3xl animate-fade-in">
              <div className="mb-5 inline-flex items-center rounded-full bg-secondary px-5 py-2 text-xs font-semibold uppercase text-white shadow-card">
                {slide?.subtitle || 'JOIN A COMMUNITY OF PURPOSE-DRIVEN LEADERS'}
              </div>
              <h1 className="max-w-3xl text-balance font-heading text-4xl font-bold leading-[1.04] text-event-foreground sm:text-6xl lg:text-7xl">
                {slide?.title || 'Welcome to World Changers Association'}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-event-muted sm:text-lg">
                {slide?.description || 'Rescuing the lost, transforming lives, training and empowering effective leaders who will bring positive change in their pheres of life.'}
              </p>
              <div className="mt-8 flex flex-row gap-3">
                <Button asChild size="lg" className="home-magnetic flex-1 px-4 sm:flex-none sm:px-8"><Link to={slide?.primaryButton?.link || '/about'}>{slide?.primaryButton?.text || 'About Us'}</Link></Button>
                <Button asChild size="lg" variant="outline" className="flex-1 border-event-border bg-event-surface/70 px-4 text-event-foreground backdrop-blur-md hover:bg-event-elevated hover:text-event-foreground sm:flex-none sm:px-8"><Link to={slide?.secondaryButton?.link || '/locations'}>{slide?.secondaryButton?.text || 'Find a location'}<MapPin /></Link></Button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 hidden border-l border-t border-event-border bg-event-background/80 px-7 py-5 backdrop-blur-md md:block">
            <p className="text-xs font-semibold uppercase text-secondary">One movement</p>
            <p className="mt-1 text-sm text-event-muted">Douala · Yaoundé · Buea · Kaélé · North America · Europe</p>
          </div>
        </section>

        <section id="mission" className="relative py-16 sm:py-24">
          <div className="container-custom">
            <div className="grid items-stretch gap-5 lg:grid-cols-12">
              <div className="relative overflow-hidden rounded-md border border-border bg-card p-7 shadow-card sm:p-10 lg:col-span-7 lg:p-12">
                <span className="text-base font-bold uppercase text-secondary sm:text-lg">Our Vision</span>
                <p className="mt-7 max-w-3xl text-justify font-heading text-[1.42rem] font-semibold leading-snug text-foreground sm:text-[1.78rem]">{mission.description}</p>
                <div className="mt-10 h-px w-24 bg-primary" />
                <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground">A connected community growing in faith, capability, integrity, and service.</p>
              </div>
              <div className="event-gradient relative flex min-h-80 flex-col justify-end overflow-hidden rounded-md border border-event-border p-7 text-event-foreground shadow-regal sm:p-10 lg:col-span-5">
                <div className="home-float absolute right-8 top-8 grid h-16 w-16 place-items-center rounded-full border border-event-border bg-event-surface/70 backdrop-blur-md"><Compass className="h-7 w-7 text-secondary" /></div>
                <span className="text-xs font-semibold uppercase text-secondary">{mission.title}</span>
                <p className="mt-4 text-lg leading-8 text-event-muted">{mission.missions?.[0]?.description}</p>
                <Button asChild variant="secondary" className="mt-7 w-fit"><Link to="/about">Our story<ArrowRight /></Link></Button>
              </div>
            </div>

            <div className="relative mt-12 grid gap-0 md:grid-cols-3">
              <div className="absolute left-[16.66%] right-[16.66%] top-6 hidden h-px bg-border md:block" />
              {mission.missions.map((item: any, index: number) => (
                <div key={item.title} className="relative border-b border-border py-7 md:border-b-0 md:px-7 md:py-4">
                  <div className="relative z-10 mb-6 grid h-12 w-12 place-items-center rounded-full border border-primary/25 bg-background text-primary shadow-sm">{renderIcon(item.icon, 'h-6 w-6')}</div>
                  <p className="text-xs font-semibold text-secondary">0{index + 1}</p>
                  <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <ul className="mt-5 space-y-2">
                    {item.points?.map((point: string) => <li key={point} className="flex gap-2 text-sm text-muted-foreground"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />{point}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/35 py-16 sm:py-24">
          <div className="container-custom">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase text-secondary">A place to belong and become</p>
                <h2 className="mt-4 max-w-xl text-balance font-semibold">Move from connection to transformation.</h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end">WCA brings fellowship, practical training, leadership development, and service into one connected journey—so people can grow and bring positive change where they live.</p>
            </div>

            <div className="mt-10 grid auto-rows-[minmax(190px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-12">
              {features.map((feature: any, index: number) => {
                const sizes = ['lg:col-span-7 lg:row-span-2', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'];
                return (
                  <TiltSurface key={feature.title} className={`${sizes[index] || 'lg:col-span-4'} group`}>
                    <Link to={feature.link} className={`flex h-full min-h-48 flex-col justify-between overflow-hidden rounded-md border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/35 ${index === 0 ? 'event-gradient text-event-foreground' : ''}`}>
                      <div className={`grid h-11 w-11 place-items-center rounded-md ${index === 0 ? 'bg-event-elevated text-secondary' : 'bg-primary/10 text-primary'}`}>{renderIcon(feature.icon, 'h-5 w-5')}</div>
                      <div className="mt-8">
                        <h3 className={`text-xl font-semibold ${index === 0 ? 'text-event-foreground' : ''}`}>{feature.title}</h3>
                        <p className={`mt-3 max-w-lg text-sm leading-6 ${index === 0 ? 'text-event-muted' : 'text-muted-foreground'}`}>{feature.description}</p>
                        <span className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${index === 0 ? 'text-secondary' : 'text-primary'}`}>Explore<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </Link>
                  </TiltSurface>
                );
              })}
            </div>
          </div>
        </section>

        <section className="event-gradient relative py-16 text-event-foreground sm:py-24">
          <div className="container-custom">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div className="lg:sticky lg:top-24">
                <p className="text-xs font-semibold uppercase text-secondary">Across regions, one purpose</p>
                <h2 className="mt-4 text-balance font-semibold text-event-foreground">A global movement, rooted in local community.</h2>
                <p className="mt-5 max-w-lg leading-7 text-event-muted">Connect with a WCA fellowship, discover gatherings near you, and grow alongside people committed to faith, leadership, and positive change.</p>
                <Button asChild variant="secondary" className="mt-7"><Link to="/locations">Explore our locations<MapPin /></Link></Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Douala', 'Yaoundé', 'Buea', 'Kaélé', 'North America', 'Europe'].map((location, index) => (
                  <Link key={location} to="/locations" className={`group grid min-h-36 content-between rounded-md border border-event-border bg-event-surface/55 p-5 backdrop-blur-sm transition-[transform,background-color] hover:-translate-y-1 hover:bg-event-elevated ${index === 0 || index === 5 ? 'sm:col-span-2' : ''}`}>
                    <span className="text-xs font-semibold text-secondary">0{index + 1}</span>
                    <span className="flex items-center justify-between font-heading text-xl font-semibold">{location}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="container-custom">
            <div className="mb-10 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div><p className="text-xs font-semibold uppercase text-secondary">Gather with us</p><h2 className="mt-3 font-semibold">{homepageData?.events?.title || 'Upcoming Events'}</h2><p className="mt-3 max-w-2xl text-muted-foreground">{homepageData?.events?.description || 'Join us at our upcoming events and be part of our growing community.'}</p></div>
              <Button asChild variant="outline"><Link to="/events">View all events<ArrowRight /></Link></Button>
            </div>

            {isLoadingEvents ? <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]"><Skeleton className="aspect-[16/10] rounded-md" /><div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-md" />)}</div></div>
            : leadEvent ? (
              <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                <TiltSurface>
                  <Link to={`/events/${leadEvent.slug || leadEvent.id}`} className="group relative block min-h-[420px] overflow-hidden rounded-md border border-border bg-event-background shadow-regal">
                    {leadEvent.image_url ? <img src={leadEvent.image_url} alt={leadEvent.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" /> : <div className="event-gradient absolute inset-0" />}
                    <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--event-background)_0%,color-mix(in_oklab,var(--event-background)_55%,transparent)_48%,transparent_80%)]" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-event-foreground sm:p-8">
                      <p className="text-xs font-semibold uppercase text-secondary">Next featured gathering</p>
                      <h3 className="mt-3 max-w-2xl text-2xl font-semibold sm:text-3xl">{leadEvent.name}</h3>
                      <EventMeta event={leadEvent} />
                    </div>
                  </Link>
                </TiltSurface>
                <div className="divide-y divide-border border-y border-border">
                  {supportingEvents.length ? supportingEvents.map((event) => <Link key={event.id} to={`/events/${event.slug || event.id}`} className="group grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-4 py-5"><div className="h-20 overflow-hidden rounded-sm bg-muted">{event.image_url ? <img src={event.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <Calendar className="m-auto mt-7 h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0"><p className="truncate font-heading font-semibold group-hover:text-primary">{event.name}</p><p className="mt-2 text-xs text-muted-foreground">{formatEventDuration(event.start_datetime, event.end_datetime).dateRange}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-primary" /></Link>) : <div className="py-10 text-sm text-muted-foreground">More gatherings will appear here as they are featured.</div>}
                </div>
              </div>
            ) : <div className="border-y border-border py-14 text-center"><Calendar className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-4 text-muted-foreground">No featured events at the moment. Check back soon.</p></div>}
          </div>
        </section>

        {testimonials.length > 0 && <section className="border-y border-border bg-muted/35 py-16 sm:py-24">
          <div className="container-custom grid gap-10 lg:grid-cols-[0.55fr_1.45fr]">
            <div><Quote className="h-10 w-10 text-secondary" /><p className="mt-5 text-xs font-semibold uppercase text-secondary">Stories of transformation</p><h2 className="mt-3 text-2xl font-semibold">Voices from our community</h2></div>
            <div className="grid gap-5 md:grid-cols-2">{testimonials.slice(0, 4).map((testimonial: any) => <figure key={testimonial.id} className="border-l-2 border-primary pl-6"><blockquote className="text-lg leading-8 text-foreground">“{testimonial.quote}”</blockquote><figcaption className="mt-5 text-sm font-semibold">{testimonial.author}<span className="ml-2 font-normal text-muted-foreground">{testimonial.role}</span></figcaption></figure>)}</div>
          </div>
        </section>}

        <section className="py-16 sm:py-24">
          <div className="container-custom">
            <div className="event-gradient grid overflow-hidden rounded-md border border-event-border text-event-foreground shadow-regal lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-7 sm:p-10 lg:p-12"><Users className="h-9 w-9 text-secondary" /><h2 className="mt-7 text-3xl font-semibold text-event-foreground">{homepageData?.newsletter?.title || 'Stay connected to the movement.'}</h2><p className="mt-4 max-w-xl leading-7 text-event-muted">{homepageData?.newsletter?.description || 'Receive updates about gatherings, resources, and opportunities to get involved.'}</p></div>
              <form className="grid content-center gap-3 border-t border-event-border bg-event-surface/55 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12" onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="home-email" className="text-sm font-semibold">Your contact details</label>
                <div className="grid gap-3 sm:grid-cols-2"><Input id="home-email" type="email" placeholder={homepageData?.newsletter?.placeholder || 'Email address'} className="border-event-border bg-event-background/50 text-event-foreground placeholder:text-event-muted" /><Input type="tel" placeholder="Phone number" className="border-event-border bg-event-background/50 text-event-foreground placeholder:text-event-muted" /></div>
                <Button type="submit" variant="secondary" className="mt-1 sm:w-fit">{homepageData?.newsletter?.buttonText || 'Subscribe'}<ArrowRight /></Button>
                <p className="text-xs text-event-muted">{homepageData?.newsletter?.disclaimer || 'We respect your privacy. Unsubscribe at any time.'}</p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

function EventMeta({ event }: { event: any }) {
  const { dateRange, timeRange } = formatEventDuration(event.start_datetime, event.end_datetime);
  return <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-event-muted"><span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-secondary" />{dateRange}</span><span className="flex items-center gap-2"><Clock className="h-4 w-4 text-secondary" />{timeRange}</span>{event.location_name && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary" />{event.location_name}</span>}</div>;
}

export default Index;
