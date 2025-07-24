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
  Heart, 
  Globe,
  MessageCircle,
  HandHeart,
  Home
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
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
      
      {/* Hero Section - Full Width Banner */}
      <div className="pt-16">
        <div className="relative h-[65vh] md:h-[70vh] lg:h-[80vh]">
          <div className="absolute inset-0">
            <img 
              src={mainCenter?.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80"} 
              alt={regionData.name}
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/30"></div>
          </div>
          
          <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
            <div className="max-w-3xl space-y-6">
              <Link to="/locations" className="inline-flex items-center text-white/80 hover:text-white mb-2 transition-colors text-sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to All Locations
              </Link>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Welcome to<br />
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  {regionData.name}
                </span>
              </h1>
              
              <p className="text-white/90 text-lg md:text-xl max-w-2xl">
                {regionData.name} Region • Established {regionData.established_date ? new Date(regionData.established_date).getFullYear() : 'Recently'}
              </p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <button 
                  onClick={() => scrollToSection('visit')}
                  className="bg-wca-purple hover:bg-wca-violet text-white font-medium rounded-full px-6 py-3 text-sm inline-flex items-center transition-colors"
                >
                  Plan Your Visit
                </button>
                
                <a 
                  href={`tel:${regionData.contact_phone || mainCenter?.contact_phone}`}
                  className="bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-5 py-3 text-sm inline-flex items-center transition-colors"
                >
                  <Phone size={16} className="mr-2" />
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Navigation */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <nav className="flex space-x-8 overflow-x-auto py-4">
              <button 
                onClick={() => scrollToSection('about')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'about' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('events')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'events' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Events
              </button>
              <button 
                onClick={() => scrollToSection('dcg')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dcg' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                DCG Homes
              </button>
              <button 
                onClick={() => scrollToSection('visit')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'visit' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Plan Your Visit
              </button>
            </nav>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between h-14">
            <h2 className="font-medium text-gray-800 dark:text-white">{regionData.name}</h2>
            
            <button 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 text-gray-600 dark:text-gray-300"
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} />
            </button>
            
            {isMobileNavOpen && (
              <div className="absolute top-14 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-800 py-3 px-4">
                <nav className="flex flex-col space-y-3">
                  <button 
                    onClick={() => scrollToSection('about')}
                    className="text-sm font-medium py-2 px-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    About
                  </button>
                  <button 
                    onClick={() => scrollToSection('events')}
                    className="text-sm font-medium py-2 px-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Events
                  </button>
                  <button 
                    onClick={() => scrollToSection('dcg')}
                    className="text-sm font-medium py-2 px-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    DCG Homes
                  </button>
                  <button 
                    onClick={() => scrollToSection('visit')}
                    className="text-sm font-medium py-2 px-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Plan Your Visit
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <main className="flex-grow">
        {/* About Section */}
        <section id="about" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <div className="lg:col-span-2">
                <div className="mb-12">
                  <h2 className="text-3xl font-bold mb-6">About Our Region</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                    {regionData.description || `Welcome to ${regionData.name}, where we are committed to transforming lives and building stronger communities through faith, fellowship, and service.`}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-wca-purple/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-wca-purple" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Established</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {regionData.established_date ? new Date(regionData.established_date).getFullYear() : 'Recently'}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-wca-purple/10 flex items-center justify-center">
                          <Home className="h-6 w-6 text-wca-purple" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">DCG Homes</h3>
                      <p className="text-gray-600 dark:text-gray-300">{dcgs.length}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-wca-purple/10 flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-wca-purple" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Locations</h3>
                      <p className="text-gray-600 dark:text-gray-300">{locations.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="sticky top-32">
                  <GlassCard className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      {regionData.contact_phone && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-wca-purple mr-3" />
                          <a href={`tel:${regionData.contact_phone}`} className="text-gray-600 dark:text-gray-300 hover:text-wca-purple transition-colors">
                            {regionData.contact_phone}
                          </a>
                        </div>
                      )}
                      {regionData.contact_email && (
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-wca-purple mr-3" />
                          <a href={`mailto:${regionData.contact_email}`} className="text-gray-600 dark:text-gray-300 hover:text-wca-purple transition-colors">
                            {regionData.contact_email}
                          </a>
                        </div>
                      )}
                      {regionData.address && (
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-wca-purple mr-3 mt-0.5" />
                          <p className="text-gray-600 dark:text-gray-300">{regionData.address}</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                  
                  {regionData.regional_pastor && (
                    <GlassCard>
                      <h3 className="text-xl font-semibold mb-4">Leadership</h3>
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 overflow-hidden">
                          <img 
                            src="https://images.unsplash.com/photo-1556157382-97eda2f9e69d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                            alt="Regional Pastor"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <h4 className="font-semibold text-lg">{regionData.regional_pastor}</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Regional Pastor</p>
                      </div>
                    </GlassCard>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section id="events" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Events</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                Join us for upcoming events and activities in our region.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.length > 0 ? events.map((event) => (
                <GlassCard key={event.id} className="hover:shadow-lg transition-shadow">
                  {event.image_url && (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                      <img 
                        src={event.image_url} 
                        alt={event.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-wca-purple">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </div>
                    
                    <h3 className="text-xl font-semibold">{event.name}</h3>
                    
                    {event.description && (
                      <p className="text-gray-600 dark:text-gray-300">{event.description}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {event.end_datetime && ` - ${new Date(event.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                    
                    {event.location_name && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location_name}
                      </div>
                    )}
                  </div>
                </GlassCard>
              )) : (
                <div className="col-span-full text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-gray-600 dark:text-gray-300">Check back soon for new events and activities!</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* DCG Homes Section */}
        <section id="dcg" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">DCG Homes</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                Find a Destiny Care Group (DCG) home in your area for fellowship, discipleship, and community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dcgs.length > 0 ? dcgs.map((dcg) => (
                <GlassCard key={dcg.id} className="hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{dcg.name}</h3>
                    
                    {dcg.description && (
                      <p className="text-gray-600 dark:text-gray-300">{dcg.description}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Users className="h-4 w-4 mr-2" />
                      {dcg.member_count || 0} members
                    </div>
                    
                    {dcg.location && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="h-4 w-4 mr-2" />
                        {dcg.location}
                      </div>
                    )}
                    
                    {dcg.meeting_day && dcg.meeting_time && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4 mr-2" />
                        {dcg.meeting_day}s at {dcg.meeting_time}
                      </div>
                    )}
                    
                    {dcg.leader && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <span className="font-medium">Leader:</span> {dcg.leader.first_name} {dcg.leader.last_name}
                        </p>
                      </div>
                    )}
                    
                    {dcg.contact_phone && (
                      <div className="flex gap-2">
                        <a
                          href={`tel:${dcg.contact_phone}`}
                          className="flex-1 bg-wca-purple hover:bg-wca-violet text-white font-medium rounded-lg px-4 py-2 text-sm inline-flex items-center justify-center transition-colors"
                        >
                          <Phone size={16} className="mr-2" />
                          Call
                        </a>
                        <a
                          href={`https://wa.me/${dcg.contact_phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm inline-flex items-center justify-center transition-colors"
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
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No DCG Homes Yet</h3>
                  <p className="text-gray-600 dark:text-gray-300">DCG homes will be listed here as they become available in this region.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Plan Your Visit Section */}
        <section id="visit" className="py-16 lg:py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Plan Your Visit</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
                We would love to have you visit us! Here's everything you need to know.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {mainCenter && (
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-4">Main Center Location</h3>
                  <div className="space-y-4">
                    <h4 className="font-medium">{mainCenter.name}</h4>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-wca-purple mr-3 mt-0.5" />
                      <p className="text-gray-600 dark:text-gray-300">
                        {mainCenter.address}, {mainCenter.city}, {mainCenter.state} {mainCenter.zip}
                      </p>
                    </div>
                    {mainCenter.contact_phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-wca-purple mr-3" />
                        <a href={`tel:${mainCenter.contact_phone}`} className="text-gray-600 dark:text-gray-300 hover:text-wca-purple transition-colors">
                          {mainCenter.contact_phone}
                        </a>
                      </div>
                    )}
                    {mainCenter.fellowship_times && (
                      <div>
                        <h5 className="font-medium mb-2">Service Times:</h5>
                        <ul className="text-gray-600 dark:text-gray-300 space-y-1">
                          {(mainCenter.fellowship_times as string[]).map((time, index) => (
                            <li key={index} className="flex items-center">
                              <Clock className="h-4 w-4 text-wca-purple mr-2" />
                              {time}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}
              
              <GlassCard>
                <h3 className="text-xl font-semibold mb-4">What to Expect</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Heart className="h-5 w-5 text-wca-purple mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Warm Welcome</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Our greeting team will be there to welcome you and help you feel at home.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-wca-purple mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Community</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Connect with others in our welcoming and diverse community.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <HandHeart className="h-5 w-5 text-wca-purple mr-3 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Meaningful Worship</h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Experience transformative worship and practical biblical teaching.</p>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-wca-purple to-wca-violet">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stay Connected</h2>
              <p className="text-white/90 text-lg mb-8">
                Subscribe to our newsletter to receive updates about events, programs, and community news.
              </p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Button type="submit" variant="secondary" className="px-6 py-3 bg-white text-wca-purple hover:bg-gray-100">
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