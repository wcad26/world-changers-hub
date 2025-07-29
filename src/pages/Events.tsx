
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { Calendar, Clock, MapPin, Search, Filter, ChevronDown, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicEvents, useFeaturedEvents, Event } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import { formatEventDuration } from '@/utils/dateUtils';

// Event categories
const categories = [
  "All", "Conference", "Worship", "Revival", "Outreach", "Training", "Workshop", 
  "Community Service", "Bible Study", "Retreat", "Seminar", "DCG Meeting", "Other"
];

// Mock featured events data for demonstration
const mockFeaturedEvents: Event[] = [
  {
    id: "mock-1",
    name: "Annual WCA Conference 2024",
    description: "Join us for our biggest annual gathering featuring inspiring speakers, worship sessions, and networking opportunities. This three-day conference will transform your spiritual journey.",
    start_datetime: "2024-09-15T09:00:00Z",
    end_datetime: "2024-09-17T18:00:00Z",
    location_name: "WCA Main Auditorium",
    address: "123 Conference Center Blvd, City Center",
    category: "Conference",
    is_public: true,
    is_featured: true,
    status: "Upcoming",
    capacity: 500,
    image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    region_id: null,
    dcg_id: null,
    created_by: null
  },
  {
    id: "mock-2", 
    name: "Youth Revival Night",
    description: "A powerful evening of worship and testimony designed for young people. Experience breakthrough, healing, and spiritual renewal in an atmosphere of faith and community.",
    start_datetime: "2024-08-20T19:00:00Z",
    end_datetime: "2024-08-20T22:00:00Z",
    location_name: "Downtown Community Center",
    address: "456 Youth Street, Downtown District",
    category: "Revival",
    is_public: true,
    is_featured: true,
    status: "Upcoming",
    capacity: 200,
    image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    region_id: null,
    dcg_id: null,
    created_by: null
  },
  {
    id: "mock-3",
    name: "Leadership Training Workshop", 
    description: "Develop your leadership skills through practical workshops, mentorship sessions, and collaborative learning. Perfect for current and aspiring ministry leaders.",
    start_datetime: "2024-08-25T10:00:00Z",
    end_datetime: "2024-08-25T16:00:00Z",
    location_name: "WCA Training Center",
    address: "789 Leadership Ave, Training District",
    category: "Training",
    is_public: true,
    is_featured: true,
    status: "Upcoming",
    capacity: 75,
    image_url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    region_id: null,
    dcg_id: null,
    created_by: null
  }
];

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { data: allEvents, isLoading, isError } = usePublicEvents();
  const { data: featuredEvents, isLoading: isLoadingFeatured } = useFeaturedEvents();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Use only real events
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

  const renderEventList = (eventsToRender: Event[]) => {
    if (isLoading) {
       return (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
       );
    }

    if (isError) {
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
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg shadow">
          <h3 className="text-xl font-medium mb-2">No events found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {eventsToRender.map((event) => (
          <GlassCard key={event.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/4 h-48 md:h-auto relative overflow-hidden">
                <img 
                  src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}
                  alt={event.name} 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute top-4 right-4 md:hidden">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-wca-purple text-white">
                    {event.category}
                  </span>
                </div>
              </div>
              <div className="md:w-3/4 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                  <h3 className="font-semibold text-xl">{event.name}</h3>
                  <span className="hidden md:inline-block text-xs font-medium px-3 py-1 rounded-full bg-wca-purple text-white mt-2 md:mt-0">
                    {event.category}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start text-gray-600 dark:text-gray-300">
                    <Calendar size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                    <div className="text-sm">
                      <div>{formatEventDuration(event.start_datetime, event.end_datetime).dateRange}</div>
                      {formatEventDuration(event.start_datetime, event.end_datetime).isMultiDay && (
                        <div className="text-xs text-gray-500">Multi-day event</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start text-gray-600 dark:text-gray-300">
                    <Clock size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                    <span className="text-sm">{formatEventDuration(event.start_datetime, event.end_datetime).timeRange}</span>
                  </div>
                  <div className="flex items-start text-gray-600 dark:text-gray-300">
                    <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                    <span className="text-sm">{event.location_name}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                  {event.description}
                </p>
                
                <div className="flex justify-end">
                  <Link 
                    to={`/events/${event.id}`} 
                    className="flex items-center text-wca-purple hover:text-wca-violet transition-colors"
                  >
                    Learn More
                    <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-0">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
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

        {/* Featured Events Section */}
        <section className="py-12">
          <div className="container-custom">
            <h2 className="text-2xl font-bold mb-8">Featured Events</h2>
            {isLoadingFeatured ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              renderEventList(featuredEvents || [])
            )}
          </div>
        </section>

        {/* All Events Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-950">
          <div className="container-custom">
            <h2 className="text-2xl font-bold mb-8">All Upcoming Events</h2>
            {renderEventList(filteredEvents)}
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
