import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useRegionalLocations, useRegionalDCGs, useRegionalEvents } from '@/hooks/useRegionalData';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
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
  Navigation
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const RegionalBranchHome = () => {
  const { region } = useParams<{region: string}>();
  const [activeTab, setActiveTab] = useState('about');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
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
      const headerOffset = isMobile ? 120 : 140;
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
        <main className="flex-grow pt-20">
          <div className="container-custom py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Loading...</h2>
            <p className="mb-6">Loading regional information...</p>
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
        <main className="flex-grow pt-20">
          <div className="container-custom py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">Region not found</h2>
            <p className="mb-6">The regional branch you are looking for does not exist.</p>
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

  // Format currency to USD
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      {/* Hero Section - Mobile Optimized */}
      <div className="pt-16">
        <div className={`relative ${isMobile ? 'h-[50vh] min-h-[400px]' : isTablet ? 'h-[60vh]' : 'h-[75vh]'}`}>
          <div className="absolute inset-0">
            <img 
              src={mainCenter?.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80"} 
              alt={regionData.name}
              className="w-full h-full object-cover" 
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/40"></div>
          </div>
          
          <div className={`relative container mx-auto px-4 h-full flex flex-col justify-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <div className="max-w-4xl space-y-4 md:space-y-6">
              <Link 
                to="/locations" 
                className={`inline-flex items-center text-white/80 hover:text-white mb-2 transition-colors ${isMobile ? 'text-xs' : 'text-sm'} touch-target`}
              >
                <ArrowLeft className={`mr-1 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                Back to All Locations
              </Link>
              
              <h1 className={`font-bold text-white leading-tight ${
                isMobile ? 'text-2xl' : isTablet ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl'
              }`}>
                Welcome to{isMobile ? ' ' : <br />}
                <span className="block text-gradient bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {regionData.name}
                </span>
              </h1>
              
              <p className={`text-white/90 max-w-2xl ${isMobile ? 'text-sm' : 'text-lg md:text-xl'}`}>
                {regionData.name} Region • Established {regionData.established_date ? new Date(regionData.established_date).getFullYear() : 'Recently'}
              </p>
              
              <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-row flex-wrap gap-3'} mt-4`}>
                <button 
                  onClick={() => scrollToSection('visit')}
                  className={`${
                    isMobile ? 'w-full justify-center' : ''
                  } bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full px-6 py-3 text-sm inline-flex items-center transition-all duration-200 touch-target hover:scale-105`}
                >
                  Plan Your Visit
                </button>
                
                {(regionData.contact_phone || mainCenter?.contact_phone) && (
                  <a 
                    href={`tel:${regionData.contact_phone || mainCenter?.contact_phone}`}
                    className={`${
                      isMobile ? 'w-full justify-center' : ''
                    } bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-5 py-3 text-sm inline-flex items-center transition-all duration-200 touch-target hover:scale-105`}
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
      
      {/* Enhanced Mobile-First Navigation */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
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
                  className={`text-sm font-medium px-1 py-4 border-b-2 transition-all duration-200 whitespace-nowrap relative ${
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
              <h2 className={`font-medium text-foreground truncate ${isMobile ? 'text-sm max-w-[200px]' : 'text-base'}`}>
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
                        className={`flex items-center py-3 px-4 text-left rounded-lg transition-all duration-200 touch-target ${
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
        {/* About Section - Mobile Optimized */}
        <section id="about" className={`${isMobile ? 'py-12' : isTablet ? 'py-16' : 'py-16 lg:py-24'}`}>
          <div className="container mx-auto px-4">
            <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3 lg:gap-12'}`}>
              <div className={isMobile ? 'order-1' : 'lg:col-span-2'}>
                <div className="mb-8 lg:mb-12">
                  <h2 className={`font-bold mb-6 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                    About Our Region
                  </h2>
                  <p className={`text-muted-foreground leading-relaxed mb-6 lg:mb-8 ${
                    isMobile ? 'text-base' : 'text-lg'
                  }`}>
                    {regionData.description || `Welcome to ${regionData.name}, where we are committed to transforming lives and building stronger communities through faith, fellowship, and service.`}
                  </p>
                  
                  <div className={`grid gap-4 mb-8 lg:mb-12 ${
                    isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
                  }`}>
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4 lg:p-6 text-center transition-all duration-200 hover:shadow-md">
                      <div className="flex justify-center mb-3 lg:mb-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className={`text-primary ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                        </div>
                      </div>
                      <h3 className={`font-semibold mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>Established</h3>
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {regionData.established_date ? new Date(regionData.established_date).getFullYear() : 'Recently'}
                      </p>
                    </div>
                    
                    <div className="bg-card rounded-xl shadow-sm border border-border p-4 lg:p-6 text-center transition-all duration-200 hover:shadow-md">
                      <div className="flex justify-center mb-3 lg:mb-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Home className={`text-primary ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                        </div>
                      </div>
                      <h3 className={`font-semibold mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>DCG Homes</h3>
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>{dcgs.length}</p>
                    </div>
                    
                    <div className={`bg-card rounded-xl shadow-sm border border-border p-4 lg:p-6 text-center transition-all duration-200 hover:shadow-md ${
                      isMobile ? '' : isTablet ? 'col-span-2' : ''
                    }`}>
                      <div className="flex justify-center mb-3 lg:mb-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className={`text-primary ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                        </div>
                      </div>
                      <h3 className={`font-semibold mb-1 ${isMobile ? 'text-base' : 'text-lg'}`}>Locations</h3>
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>{locations.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`${isMobile ? 'order-2' : 'lg:col-span-1'}`}>
                <div className={isMobile ? 'space-y-6' : 'sticky top-32 space-y-6 lg:space-y-8'}>
                  <GlassCard className={isMobile ? 'p-4' : ''}>
                    <h3 className={`font-semibold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Contact Information</h3>
                    <div className="space-y-3 lg:space-y-4">
                      {regionData.contact_phone && (
                        <a 
                          href={`tel:${regionData.contact_phone}`}
                          className="flex items-center group transition-colors touch-target"
                        >
                          <Phone className={`text-primary mr-3 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <span className="text-muted-foreground group-hover:text-primary transition-colors">
                            {regionData.contact_phone}
                          </span>
                        </a>
                      )}
                      {regionData.contact_email && (
                        <a 
                          href={`mailto:${regionData.contact_email}`}
                          className="flex items-center group transition-colors touch-target"
                        >
                          <Mail className={`text-primary mr-3 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <span className="text-muted-foreground group-hover:text-primary transition-colors break-all">
                            {regionData.contact_email}
                          </span>
                        </a>
                      )}
                      {regionData.address && (
                        <div className="flex items-start">
                          <MapPin className={`text-primary mr-3 mt-0.5 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                          <p className="text-muted-foreground">{regionData.address}</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                  
                  {regionData.regional_pastor && (
                    <GlassCard className={isMobile ? 'p-4' : ''}>
                      <h3 className={`font-semibold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>Leadership</h3>
                      <div className="text-center">
                        <div className={`bg-muted rounded-full mx-auto mb-4 overflow-hidden ${
                          isMobile ? 'w-20 h-20' : 'w-24 h-24'
                        }`}>
                          <img 
                            src="https://images.unsplash.com/photo-1556157382-97eda2f9e69d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                            alt="Regional Pastor"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <h4 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>
                          {regionData.regional_pastor}
                        </h4>
                        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          Regional Pastor
                        </p>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Section - Mobile Optimized */}
        <section id="events" className={`bg-muted/30 ${isMobile ? 'py-12' : isTablet ? 'py-16' : 'py-16 lg:py-24'}`}>
          <div className="container mx-auto px-4">
            <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <h2 className={`font-bold mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                Upcoming Events
              </h2>
              <p className={`text-muted-foreground max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-lg'}`}>
                Join us for upcoming events and activities in our region.
              </p>
            </div>
            
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            } lg:gap-8`}>
              {events.length > 0 ? events.map((event) => (
                <GlassCard 
                  key={event.id} 
                  className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${isMobile ? 'p-4' : ''}`}
                >
                  {event.image_url && (
                    <div className={`w-full bg-muted rounded-lg mb-4 overflow-hidden ${
                      isMobile ? 'h-40' : 'h-48'
                    }`}>
                      <img 
                        src={event.image_url} 
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105" 
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="space-y-3 lg:space-y-4">
                    <div className={`flex items-center text-primary ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <Calendar className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </div>
                    
                    <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'} line-clamp-2`}>
                      {event.name}
                    </h3>
                    
                    {event.description && (
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'} line-clamp-3`}>
                        {event.description}
                      </p>
                    )}
                    
                    <div className={`flex items-center text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <Clock className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                      {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {event.end_datetime && ` - ${new Date(event.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                    
                    {event.location_name && (
                      <div className={`flex items-center text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <MapPin className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        <span className="line-clamp-1">{event.location_name}</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Calendar className={`text-muted-foreground mx-auto mb-4 ${isMobile ? 'h-10 w-10' : 'h-12 w-12'}`} />
                  <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    No Upcoming Events
                  </h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                    Check back soon for new events and activities!
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DCG Homes Section - Mobile Optimized */}
        <section id="dcg" className={`${isMobile ? 'py-12' : isTablet ? 'py-16' : 'py-16 lg:py-24'}`}>
          <div className="container mx-auto px-4">
            <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <h2 className={`font-bold mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                DCG Homes
              </h2>
              <p className={`text-muted-foreground max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-lg'}`}>
                Find a Destiny Care Group (DCG) home in your area for fellowship, discipleship, and community.
              </p>
            </div>
            
            <div className={`grid gap-6 ${
              isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            } lg:gap-8`}>
              {dcgs.length > 0 ? dcgs.map((dcg) => (
                <GlassCard 
                  key={dcg.id} 
                  className={`hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${isMobile ? 'p-4' : ''}`}
                >
                  <div className="space-y-3 lg:space-y-4">
                    <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
                      {dcg.name}
                    </h3>
                    
                    {dcg.description && (
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'} line-clamp-3`}>
                        {dcg.description}
                      </p>
                    )}
                    
                    <div className={`flex items-center text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <Users className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                      {dcg.member_count || 0} members
                    </div>
                    
                    {dcg.location && (
                      <div className={`flex items-center text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <MapPin className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        <span className="line-clamp-1">{dcg.location}</span>
                      </div>
                    )}
                    
                    {dcg.meeting_day && dcg.meeting_time && (
                      <div className={`flex items-center text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        <Clock className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                        {dcg.meeting_day}s at {dcg.meeting_time}
                      </div>
                    )}
                    
                    {dcg.leader && (
                      <div className="pt-3 border-t border-border">
                        <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          <span className="font-medium">Leader:</span> {dcg.leader.first_name} {dcg.leader.last_name}
                        </p>
                      </div>
                    )}
                    
                    {dcg.contact_phone && (
                      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
                        <a
                          href={`tel:${dcg.contact_phone}`}
                          className={`${
                            isMobile ? 'w-full' : 'flex-1'
                          } bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg px-4 py-2 text-sm inline-flex items-center justify-center transition-all duration-200 touch-target hover:scale-105`}
                        >
                          <Phone size={16} className="mr-2" />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${dcg.contact_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${
                            isMobile ? 'w-full' : 'flex-1'
                          } bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm inline-flex items-center justify-center transition-all duration-200 touch-target hover:scale-105`}
                        >
                          <MessageCircle size={16} className="mr-2" />
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Home className={`text-muted-foreground mx-auto mb-4 ${isMobile ? 'h-10 w-10' : 'h-12 w-12'}`} />
                  <h3 className={`font-semibold mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    No DCG Homes Yet
                  </h3>
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                    DCG homes will be listed here as they become available in this region.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Plan Your Visit Section - Mobile Optimized */}
        <section id="visit" className={`bg-muted/30 ${isMobile ? 'py-12' : isTablet ? 'py-16' : 'py-16 lg:py-24'}`}>
          <div className="container mx-auto px-4">
            <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
              <h2 className={`font-bold mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                Plan Your Visit
              </h2>
              <p className={`text-muted-foreground max-w-2xl mx-auto ${isMobile ? 'text-base' : 'text-lg'}`}>
                We would love to have you visit us! Here's everything you need to know.
              </p>
            </div>
            
            <div className={`grid gap-6 lg:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {mainCenter && (
                <GlassCard className={isMobile ? 'p-4' : ''}>
                  <h3 className={`font-semibold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    Main Center Location
                  </h3>
                  <div className="space-y-3 lg:space-y-4">
                    <h4 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {mainCenter.name}
                    </h4>
                    <div className="flex items-start">
                      <MapPin className={`text-primary mr-3 mt-0.5 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                      <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                        {mainCenter.address}, {mainCenter.city}, {mainCenter.state} {mainCenter.zip}
                      </p>
                    </div>
                    {mainCenter.contact_phone && (
                      <a 
                        href={`tel:${mainCenter.contact_phone}`}
                        className="flex items-center group transition-colors touch-target"
                      >
                        <Phone className={`text-primary mr-3 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                        <span className="text-muted-foreground group-hover:text-primary transition-colors">
                          {mainCenter.contact_phone}
                        </span>
                      </a>
                    )}
                    {mainCenter.fellowship_times && (
                      <div>
                        <h5 className={`font-medium mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                          Service Times:
                        </h5>
                        <ul className="text-muted-foreground space-y-1">
                          {(mainCenter.fellowship_times as string[]).map((time, index) => (
                            <li key={index} className="flex items-center">
                              <Clock className={`text-primary mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                              <span className={isMobile ? 'text-sm' : 'text-base'}>{time}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}
              
              <GlassCard className={isMobile ? 'p-4' : ''}>
                <h3 className={`font-semibold mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  What to Expect
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex items-start">
                    <Heart className={`text-primary mr-3 mt-0.5 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <div>
                      <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                        Warm Welcome
                      </h4>
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Our greeting team will be there to welcome you and help you feel at home.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className={`text-primary mr-3 mt-0.5 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <div>
                      <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                        Community
                      </h4>
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Connect with others in our welcoming and diverse community.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <HandHeart className={`text-primary mr-3 mt-0.5 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                    <div>
                      <h4 className={`font-medium ${isMobile ? 'text-sm' : 'text-base'}`}>
                        Meaningful Worship
                      </h4>
                      <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Experience transformative worship and practical biblical teaching.
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Newsletter Section - Mobile Optimized */}
        <section className={`bg-gradient-to-r from-primary to-primary/80 ${isMobile ? 'py-12' : 'py-16 lg:py-24'}`}>
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className={`font-bold text-primary-foreground mb-4 ${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'}`}>
                Stay Connected
              </h2>
              <p className={`text-primary-foreground/90 mb-8 ${isMobile ? 'text-base' : 'text-lg'}`}>
                Subscribe to our newsletter to receive updates about events, programs, and community news.
              </p>
              
              <form 
                onSubmit={handleSubscribe} 
                className={`flex gap-4 max-w-md mx-auto ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  className={`flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-primary-foreground placeholder-primary-foreground/70 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 ${
                    isMobile ? 'text-base' : ''
                  }`}
                />
                <Button 
                  type="submit" 
                  variant="secondary" 
                  className={`px-6 py-3 bg-background text-foreground hover:bg-muted transition-all duration-200 touch-target hover:scale-105 ${
                    isMobile ? 'w-full' : ''
                  }`}
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegionalBranchHome;