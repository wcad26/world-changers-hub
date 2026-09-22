
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { Calendar, Clock, MapPin, Search, Filter, ChevronDown, ArrowRight, AlertCircle, Eye } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { usePublicEvents, usePublicPastEvents, Event } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { formatEventDuration } from '@/utils/dateUtils';
import { useLanguage } from '@/hooks/useLanguage';

// Event categories
const categories = [
  "All", "Conference", "Worship", "Revival", "Outreach", "Training", "Workshop", 
  "Community Service", "Bible Study", "Retreat", "Seminar", "DCG Meeting", "Other"
];

const specialEventDefaults = {
  linked_fundraising_campaign_id: null,
  collect_lodging: false,
  collect_meal_preferences: false,
  collect_pledges: false,
} as const;

const mockFeaturedEvents: Event[] = ([
  {
    id: "mock-1",
    slug: null,
    name: "Annual WCA Conference 2024",
    name_fr: null,
    description: "Join us for our biggest annual gathering featuring inspiring speakers, worship sessions, and networking opportunities. This three-day conference will transform your spiritual journey.",
    description_fr: null,
    start_datetime: "2024-09-15T09:00:00Z",
    end_datetime: "2024-09-17T18:00:00Z",
    location_name: "WCA Main Auditorium",
    location_name_fr: null,
    address: "123 Conference Center Blvd, City Center",
    address_fr: null,
    category: "Conference",
    is_public: true,
    is_featured: true,
    is_special: false,
    requires_pre_registration: false,
    attendance_target: 500,
    status: "Upcoming",
    capacity: 500,
    cost: 50,
    cost_currency_code: "USD",
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    image_url_fr: null,
    registration_url: null,
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    whatsapp_contact: null,
    requirements: null,
    requirements_fr: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    region_id: null,
    dcg_id: null,
    created_by: null
  },
  {
    id: "mock-2",
    slug: null,
    name: "Youth Revival Night",
    name_fr: null,
    description: "A powerful evening of worship and testimony designed for young people. Experience breakthrough, healing, and spiritual renewal in an atmosphere of faith and community.",
    description_fr: null,
    start_datetime: "2024-08-20T19:00:00Z",
    end_datetime: "2024-08-20T22:00:00Z",
    location_name: "Downtown Community Center",
    location_name_fr: null,
    address: "456 Youth Street, Downtown District",
    address_fr: null,
    category: "Revival",
    is_public: true,
    is_featured: true,
    is_special: false,
    requires_pre_registration: false,
    attendance_target: 200,
    status: "Upcoming",
    capacity: 200,
    cost: 0,
    cost_currency_code: null,
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    image_url_fr: null,
    registration_url: null,
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    whatsapp_contact: null,
    requirements: null,
    requirements_fr: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    region_id: null,
    dcg_id: null,
    created_by: null
  },
  {
    id: "mock-3",
    slug: null,
    name: "Leadership Training Workshop", 
    name_fr: null,
    description: "Develop your leadership skills through practical workshops, mentorship sessions, and collaborative learning. Perfect for current and aspiring ministry leaders.",
    description_fr: null,
    start_datetime: "2024-08-25T10:00:00Z",
    end_datetime: "2024-08-25T16:00:00Z",
    location_name: "WCA Training Center",
    location_name_fr: null,
    address: "789 Leadership Ave, Training District",
    address_fr: null,
    category: "Training",
    is_public: true,
    is_featured: true,
    is_special: false,
    requires_pre_registration: false,
    attendance_target: 75,
    status: "Upcoming",
    capacity: 75,
    cost: 25,
    cost_currency_code: "USD",
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    image_url_fr: null,
    registration_url: null,
    organizer_name: null,
    organizer_email: null,
    organizer_phone: null,
    whatsapp_contact: null,
    requirements: null,
    requirements_fr: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    region_id: null,
    dcg_id: null,
    created_by: null
  }
].map(e => ({ ...e, ...specialEventDefaults }))) as Event[];

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filteredPastEvents, setFilteredPastEvents] = useState<Event[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { data: allEvents, isLoading, isError } = usePublicEvents();
  const { data: allPastEvents, isLoading: isPastLoading, isError: isPastError } = usePublicPastEvents();
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Filter upcoming events
    const eventsToProcess = allEvents || [];
    let result = eventsToProcess;
    
    if (selectedCategory !== 'All') {
      result = result.filter(event => event.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.name.toLowerCase().includes(query) || 
        (event.location_name && event.location_name.toLowerCase().includes(query)) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredEvents(result);
  }, [selectedCategory, searchQuery, allEvents]);

  useEffect(() => {
    // Filter past events
    const pastEventsToProcess = allPastEvents || [];
    let result = pastEventsToProcess;
    
    if (selectedCategory !== 'All') {
      result = result.filter(event => event.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.name.toLowerCase().includes(query) || 
        (event.location_name && event.location_name.toLowerCase().includes(query)) ||
        (event.description && event.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredPastEvents(result);
  }, [selectedCategory, searchQuery, allPastEvents]);

  const renderEventList = (eventsToRender: Event[], loading: boolean, error: boolean, emptyMessage: string = "No events found") => {
    if (loading) {
       return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
             <Skeleton key={i} className="w-full aspect-[4/3] rounded-lg" />
          ))}
        </div>
       );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load events. Please try again later.</AlertDescription>
        </Alert>
      );
    }
    
    if (eventsToRender.length === 0) {
      return (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {eventsToRender.map((event) => {
          const imageUrl = (language === 'fr' && event.image_url_fr) ? event.image_url_fr : event.image_url;
          
          return (
            <Link 
              to={`/events/${event.slug || event.id}`} 
              key={event.id}
              className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <img 
                  src={imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}
                  alt={event.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              {/* Category Badge */}
              <div className="absolute top-3 right-3 z-10">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm">
                  {event.category}
                </span>
              </div>
              {/* Permanent Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20 group-hover:from-black/75 group-hover:via-black/40 group-hover:to-black/30 transition-all duration-300">
                {/* Center Eye Icon and Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Eye className="text-white mb-2 group-hover:scale-110 transition-transform duration-300" size={32} strokeWidth={2} />
                  <span className="text-white font-medium text-sm drop-shadow-lg">Click to View</span>
                </div>
                {/* Event Name at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg drop-shadow-lg">{event.name}</h3>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-0">
        {/* Hero Section */}
        <section className="relative py-[30px] bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                Events Calendar
              </div>
              <h1 className="font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  Upcoming WCA Events
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">
                Connect with our community at these upcoming events, conferences, and gatherings.
              </p>
              
              {/* Search and Filter Controls */}
              <div className="max-w-xl mx-auto mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search events..."
                    className="w-full px-4 py-3 pl-12 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-wca-purple/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-10">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors md:hidden"
                >
                  <Filter size={16} />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                <div className={`flex flex-wrap gap-2 justify-center ${showFilters ? 'block' : 'hidden md:flex'}`}>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        selectedCategory === category 
                          ? 'bg-wca-purple text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Upcoming Events Section */}
        <section className="py-12">
          <div className="container-custom">
            <h2 className="text-2xl font-bold mb-8">Upcoming Events</h2>
            {renderEventList(filteredEvents, isLoading, isError, "No upcoming events found")}
          </div>
        </section>

        {/* Past Events Section */}
        <section className="py-12 bg-muted/30">
          <div className="container-custom">
            <h2 className="text-2xl font-bold mb-8">Past Events</h2>
            {renderEventList(filteredPastEvents, isPastLoading, isPastError, "No past events found")}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container-custom">
            <div className="bg-gradient-to-br from-wca-purple to-wca-violet rounded-xl overflow-hidden">
              <div className="px-6 py-12 md:p-12 text-white text-center">
                <h2 className="font-bold text-2xl md:text-3xl mb-4">Organize an Event with WCA</h2>
                <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                  Are you interested in hosting a WCA event in your area? We provide resources and support 
                  to help you organize impactful gatherings for your community.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link to="/contact" className="bg-white text-wca-violet font-medium px-6 py-3 rounded-md hover:bg-gray-100 transition-colors">
                    Contact Us
                  </Link>
                  <Link to="/locations" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-medium px-6 py-3 rounded-md hover:bg-white/20 transition-colors">
                    Find a Location
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Events;
