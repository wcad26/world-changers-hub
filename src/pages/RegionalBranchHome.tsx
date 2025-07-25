import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useRegionalLocations, useRegionalDCGs, useRegionalEvents } from '@/hooks/useRegionalData';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { 
  MapPin, 
  Clock, 
  ExternalLink, 
  Phone, 
  Calendar, 
  Users, 
  Mail, 
  ArrowLeft, 
  ChevronRight, 
  Instagram, 
  Facebook, 
  Youtube, 
  Menu, 
  X,
  Heart, 
  Globe,
  MessageCircle,
  HandHeart,
  Home,
  Navigation,
  Star,
  CheckCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const RegionalBranchHome = () => {
  const { region } = useParams<{region: string}>();
  const [activeTab, setActiveTab] = useState('about');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch real data from database
  const { data: regionData, isLoading: regionLoading, error: regionError } = useRegionBySlug(region);
  const { data: locations = [], isLoading: locationsLoading } = useRegionalLocations(regionData?.id);
  const { data: dcgs = [], isLoading: dcgsLoading } = useRegionalDCGs(regionData?.id);
  const { data: events = [], isLoading: eventsLoading } = useRegionalEvents(regionData?.id);
  
  const isLoading = regionLoading || locationsLoading || dcgsLoading || eventsLoading;
  
  // Handle subscription to newsletter
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    toast({
      title: "Subscription successful!",
      description: "Thank you for subscribing to our newsletter.",
      duration: 5000,
    });
    
    const form = e.target as HTMLFormElement;
    form.reset();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [region]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    const sections = ['about', 'events', 'dcg', 'visit'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileNavOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded-lg mx-auto max-w-xs"></div>
              <div className="h-4 bg-muted rounded mx-auto max-w-md"></div>
              <div className="h-4 bg-muted rounded mx-auto max-w-sm"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (regionError || !regionData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16">
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="fluid-text-2xl font-bold mb-4">Region not found</h2>
            <p className="fluid-text-base mb-6 text-muted-foreground">The regional branch you are looking for does not exist.</p>
            <Link to="/locations" className="button-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Locations
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get the main center location for this region
  const mainCenter = locations.find(loc => loc.type === 'WCA Center');
  const dcgLocations = locations.filter(loc => loc.type === 'DCG Location');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      
      {/* Mobile-First Hero Section */}
      <div className="pt-16">
        <div className="relative mobile-hero">
          <div className="absolute inset-0">
            <img 
              src={mainCenter?.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80"} 
              alt={regionData.name}
              className="w-full h-full object-cover" 
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/40"></div>
          </div>
          
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center py-8">
            <div className="max-w-4xl space-y-4">
              <Link 
                to="/locations" 
                className="inline-flex items-center text-white/80 hover:text-white mb-2 transition-colors fluid-text-sm touch-target"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Locations
              </Link>
              
              <h1 className="font-bold text-white leading-tight fluid-text-4xl">
                Welcome to
                <span className="block text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {regionData.name}
                </span>
              </h1>
              
              <p className="text-white/90 max-w-2xl fluid-text-base">
                {regionData.name} Region • Established {regionData.established_date ? new Date(regionData.established_date).getFullYear() : 'Recently'}
              </p>
              
              <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:gap-4">
                <button 
                  onClick={() => scrollToSection('visit')}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-6 py-3 fluid-text-sm inline-flex items-center justify-center transition-all duration-200 touch-target hover:scale-105"
                >
                  Plan Your Visit
                </button>
                
                {(regionData.contact_phone || mainCenter?.contact_phone) && (
                  <a 
                    href={`tel:${regionData.contact_phone || mainCenter?.contact_phone}`}
                    className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-5 py-3 fluid-text-sm inline-flex items-center justify-center transition-all duration-200 touch-target hover:scale-105"
                  >
                    <Phone size={16} className="mr-2" />
                    Contact Us
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile-First Sticky Navigation */}
      <div className="mobile-nav-sticky">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <nav className="flex space-x-8 overflow-x-auto py-4">
              {[
                { id: 'about', label: 'About' },
                { id: 'events', label: 'Events' },
                { id: 'dcg', label: 'DCG Homes' },
                { id: 'visit', label: 'Plan Your Visit' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`fluid-text-sm font-medium px-1 py-4 border-b-2 transition-all duration-200 whitespace-nowrap relative ${
                    activeTab === item.id 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-between h-14">
              <h2 className="font-medium text-foreground truncate fluid-text-sm max-w-[200px]">
                {regionData.name}
              </h2>
              
              <button 
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-target"
                aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            
            {/* Mobile Slide-down Menu */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isMobileNavOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="pb-4 border-t border-border">
                <nav className="flex flex-col space-y-1 pt-3">
                  {[
                    { id: 'about', label: 'About', icon: Globe },
                    { id: 'events', label: 'Events', icon: Calendar },
                    { id: 'dcg', label: 'DCG Homes', icon: Home },
                    { id: 'visit', label: 'Plan Your Visit', icon: Navigation }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`flex items-center py-3 px-4 text-left rounded-lg transition-all duration-200 touch-target touch-feedback ${
                          activeTab === item.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon size={18} className="mr-3" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-grow">
        {/* About Section - Mobile-First */}
        <section id="about" className="mobile-section md:tablet-section lg:desktop-section">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
              <div className="lg:col-span-2">
                <div className="mb-8 lg:mb-12">
                  <h2 className="font-bold mb-6 fluid-text-3xl">
                    About Our Region
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6 lg:mb-8 fluid-text-base">
                    {regionData.description || `Welcome to ${regionData.name}, where we are committed to transforming lives and building stronger communities through faith, fellowship, and service.`}
                  </p>
                  
                  <div className="grid-mobile stagger-children">
                    <div className="mobile-card text-center card-hover">
                      <div className="flex justify-center mb-3 lg:mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="text-primary h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1 fluid-text-lg">Established</h3>
                      <p className="text-muted-foreground fluid-text-base">
                        {regionData.established_date ? new Date(regionData.established_date).getFullYear() : 'Recently'}
                      </p>
                    </div>
                    
                    <div className="mobile-card text-center card-hover">
                      <div className="flex justify-center mb-3 lg:mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Home className="text-primary h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1 fluid-text-lg">DCG Homes</h3>
                      <p className="text-muted-foreground fluid-text-base">{dcgs.length}</p>
                    </div>
                    
                    <div className="mobile-card text-center card-hover">
                      <div className="flex justify-center mb-3 lg:mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="text-primary h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1 fluid-text-lg">Locations</h3>
                      <p className="text-muted-foreground fluid-text-base">{locations.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="sticky top-32 space-y-6 lg:space-y-8">
                  <GlassCard className="p-4 lg:p-6">
                    <h3 className="font-semibold mb-4 fluid-text-xl">Contact Information</h3>
                    <div className="space-y-4">
                      {regionData.contact_phone && (
                        <a 
                          href={`tel:${regionData.contact_phone}`}
                          className="flex items-center group transition-colors touch-target p-2 -m-2 rounded-lg hover:bg-muted/50"
                        >
                          <Phone className="text-primary mr-3 h-5 w-5" />
                          <span className="text-muted-foreground group-hover:text-primary transition-colors fluid-text-base">
                            {regionData.contact_phone}
                          </span>
                        </a>
                      )}
                      {regionData.contact_email && (
                        <a 
                          href={`mailto:${regionData.contact_email}`}
                          className="flex items-center group transition-colors touch-target p-2 -m-2 rounded-lg hover:bg-muted/50"
                        >
                          <Mail className="text-primary mr-3 h-5 w-5" />
                          <span className="text-muted-foreground group-hover:text-primary transition-colors break-all fluid-text-base">
                            {regionData.contact_email}
                          </span>
                        </a>
                      )}
                      {regionData.address && (
                        <div className="flex items-start p-2 -m-2">
                          <MapPin className="text-primary mr-3 mt-0.5 h-5 w-5" />
                          <p className="text-muted-foreground fluid-text-base">{regionData.address}</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                  
                  {regionData.regional_pastor && (
                    <GlassCard className="p-4 lg:p-6">
                      <h3 className="font-semibold mb-4 fluid-text-xl">Leadership</h3>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="text-primary h-8 w-8" />
                        </div>
                        <h4 className="font-medium fluid-text-lg">{regionData.regional_pastor}</h4>
                        <p className="text-muted-foreground fluid-text-sm">Regional Pastor</p>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Section - Mobile-First */}
        <section id="events" className="mobile-section md:tablet-section lg:desktop-section bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="font-bold mb-4 fluid-text-3xl">Upcoming Events</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto fluid-text-base">
                Join us for these exciting upcoming events and be part of our growing community.
              </p>
            </div>
            
            {events.length > 0 ? (
              <div className="grid-mobile stagger-children">
                {events.slice(0, 6).map((event) => (
                  <div key={event.id} className="mobile-card card-hover group">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="text-primary h-6 w-6" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold mb-1 line-clamp-2 fluid-text-lg group-hover:text-primary transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-muted-foreground mb-2 line-clamp-2 fluid-text-sm">
                          {event.description}
                        </p>
                        <div className="flex items-center text-muted-foreground fluid-text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {new Date(event.start_datetime).toLocaleDateString()} at {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {event.location_name && (
                          <div className="flex items-center text-muted-foreground fluid-text-xs mt-1">
                            <MapPin className="mr-1 h-3 w-3" />
                            {event.location_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2 fluid-text-lg">No upcoming events</h3>
                <p className="text-muted-foreground fluid-text-base">Check back soon for exciting events!</p>
              </div>
            )}
          </div>
        </section>

        {/* DCG Homes Section - Mobile-First */}
        <section id="dcg" className="mobile-section md:tablet-section lg:desktop-section">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="font-bold mb-4 fluid-text-3xl">Destiny Care Group Homes</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto fluid-text-base">
                Connect with our vibrant DCG communities where faith grows and friendships flourish.
              </p>
            </div>
            
            {dcgs.length > 0 ? (
              <div className="grid-mobile stagger-children">
                {dcgs.map((dcg) => (
                  <div key={dcg.id} className="mobile-card card-hover group">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Home className="text-primary h-6 w-6" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold mb-2 line-clamp-1 fluid-text-lg group-hover:text-primary transition-colors">
                          {dcg.name}
                        </h3>
                        {dcg.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2 fluid-text-sm">
                            {dcg.description}
                          </p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center text-muted-foreground fluid-text-xs">
                            <Users className="mr-2 h-3 w-3" />
                            {dcg.member_count || 0} members
                          </div>
                          {dcg.meeting_day && dcg.meeting_time && (
                            <div className="flex items-center text-muted-foreground fluid-text-xs">
                              <Clock className="mr-2 h-3 w-3" />
                              {dcg.meeting_day}s at {dcg.meeting_time}
                            </div>
                          )}
                          {dcg.leader && (
                            <div className="flex items-center text-muted-foreground fluid-text-xs">
                              <Star className="mr-2 h-3 w-3" />
                              Led by {dcg.leader.first_name} {dcg.leader.last_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2 fluid-text-lg">No DCG homes yet</h3>
                <p className="text-muted-foreground fluid-text-base">DCG homes will be listed here as they become available.</p>
              </div>
            )}
          </div>
        </section>

        {/* Plan Your Visit Section - Mobile-First */}
        <section id="visit" className="mobile-section md:tablet-section lg:desktop-section bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="font-bold mb-4 fluid-text-3xl">Plan Your Visit</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto fluid-text-base">
                We'd love to welcome you to our community. Here's everything you need to know for your first visit.
              </p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4 fluid-text-xl">Service Times & Location</h3>
                  {mainCenter ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2 fluid-text-lg">{mainCenter.name}</h4>
                        <p className="text-muted-foreground mb-3 fluid-text-base">
                          {mainCenter.address}, {mainCenter.city}, {mainCenter.state} {mainCenter.zip}
                        </p>
                      </div>
                      
                      {mainCenter.fellowship_times && Array.isArray(mainCenter.fellowship_times) && mainCenter.fellowship_times.length > 0 && (
                        <div>
                          <h5 className="font-medium mb-2 fluid-text-base">Service Times:</h5>
                          <ul className="space-y-1">
                            {mainCenter.fellowship_times.map((time: any, index: number) => (
                              <li key={index} className="flex items-center text-muted-foreground fluid-text-sm">
                                <Clock className="mr-2 h-4 w-4" />
                                {typeof time === 'string' ? time : `${time.day} at ${time.time}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-3 sm:flex-row">
                        {mainCenter.contact_phone && (
                          <a 
                            href={`tel:${mainCenter.contact_phone}`}
                            className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-4 py-2 fluid-text-sm inline-flex items-center justify-center transition-all duration-200 touch-target"
                          >
                            <Phone size={16} className="mr-2" />
                            Call Us
                          </a>
                        )}
                        {mainCenter.address && (
                          <a 
                            href={`https://maps.google.com/search/${encodeURIComponent(mainCenter.address + ', ' + mainCenter.city + ', ' + mainCenter.state + ' ' + mainCenter.zip)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium rounded-lg px-4 py-2 fluid-text-sm inline-flex items-center justify-center transition-all duration-200 touch-target"
                          >
                            <MapPin size={16} className="mr-2" />
                            Get Directions
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Location details will be available soon.</p>
                  )}
                </GlassCard>
              </div>
              
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4 fluid-text-xl">What to Expect</h3>
                  <ul className="space-y-3">
                    {[
                      "Warm welcome from our greeting team",
                      "Inspiring worship and practical teaching",
                      "Opportunities to connect with others",
                      "Children's programs available",
                      "Casual dress - come as you are!"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="text-primary mr-3 h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground fluid-text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
                
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4 fluid-text-xl">Stay Connected</h3>
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block fluid-text-sm font-medium mb-2">
                        Subscribe to our newsletter
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors touch-target fluid-text-base"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-4 py-3 fluid-text-base transition-all duration-200 touch-target hover:scale-[1.02]"
                    >
                      Subscribe to Updates
                    </button>
                  </form>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegionalBranchHome;