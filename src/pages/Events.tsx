
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { Calendar, Clock, MapPin, Search, Filter, ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for events
const allEvents = [
  {
    id: 1,
    title: "Leadership Conference 2023",
    date: "December 15-17, 2023",
    startDate: new Date("2023-12-15"),
    endDate: new Date("2023-12-17"),
    time: "9:00 AM - 5:00 PM",
    location: "Main Center, New York",
    address: "123 Transformation Ave, New York, NY 10001",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Conference",
    description: "Join us for three days of inspiring talks, workshops, and networking opportunities designed to help you grow as a leader.",
    featured: true
  },
  {
    id: 2,
    title: "Youth Empowerment Workshop",
    date: "January 5, 2024",
    startDate: new Date("2024-01-05"),
    endDate: new Date("2024-01-05"),
    time: "2:00 PM - 6:00 PM",
    location: "East Branch, Chicago",
    address: "456 Vision St, Chicago, IL 60601",
    image: "https://images.unsplash.com/photo-1536337005238-94b997371b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
    category: "Workshop",
    description: "A special workshop designed for young people ages 15-25 to develop leadership skills and find their purpose.",
    featured: true
  },
  {
    id: 3,
    title: "Community Outreach Program",
    date: "January 20, 2024",
    startDate: new Date("2024-01-20"),
    endDate: new Date("2024-01-20"),
    time: "10:00 AM - 2:00 PM",
    location: "Various Locations",
    address: "Multiple cities",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Community Service",
    description: "Join us as we serve our communities through various outreach activities. All volunteers welcome!",
    featured: true
  },
  {
    id: 4,
    title: "Bible Study Series: Leadership Principles",
    date: "Every Tuesday, Starting February 6, 2024",
    startDate: new Date("2024-02-06"),
    endDate: new Date("2024-03-26"),
    time: "7:00 PM - 8:30 PM",
    location: "Downtown Center, Miami",
    address: "222 Faith Blvd, Miami, FL 33101",
    image: "https://images.unsplash.com/photo-1572521165329-b197f9ea3da6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Bible Study",
    description: "An 8-week study exploring leadership principles from the Bible and how to apply them in modern contexts.",
    featured: false
  },
  {
    id: 5,
    title: "Women's Retreat: Finding Your Purpose",
    date: "March 15-17, 2024",
    startDate: new Date("2024-03-15"),
    endDate: new Date("2024-03-17"),
    time: "Starts Friday 6:00 PM, Ends Sunday 2:00 PM",
    location: "Mountain Retreat Center",
    address: "789 Serenity Road, Asheville, NC 28801",
    image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80",
    category: "Retreat",
    description: "A weekend retreat for women focused on discovering and embracing God's purpose for their lives.",
    featured: false
  },
  {
    id: 6,
    title: "Financial Stewardship Seminar",
    date: "April 8, 2024",
    startDate: new Date("2024-04-08"),
    endDate: new Date("2024-04-08"),
    time: "6:30 PM - 9:00 PM",
    location: "Bright Light DCG, Los Angeles",
    address: "789 Community Rd, Los Angeles, CA 90001",
    image: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    category: "Seminar",
    description: "Learn biblical principles for managing finances, investing wisely, and giving generously.",
    featured: false
  },
];

// Event categories
const categories = [
  "All",
  "Conference",
  "Workshop",
  "Community Service",
  "Bible Study",
  "Retreat",
  "Seminar"
];

const Events = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredEvents, setFilteredEvents] = useState(allEvents);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let result = allEvents;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(event => event.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(query) || 
        event.location.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    }
    
    // Sort by date
    result = [...result].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    setFilteredEvents(result);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-20">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {filteredEvents.filter(event => event.featured).map((event) => (
                <GlassCard key={event.id} className="overflow-hidden">
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-wca-purple text-white">
                        {event.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-xl mb-3">{event.title}</h3>
                    <div className="flex items-start text-gray-600 dark:text-gray-300 mb-2">
                      <Calendar size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-start text-gray-600 dark:text-gray-300 mb-2">
                      <Clock size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                    <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                      <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                      {event.description}
                    </p>
                    
                    <Link 
                      to={`/events/${event.id}`} 
                      className="block w-full text-center button-primary"
                    >
                      Learn More
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* All Events Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-950">
          <div className="container-custom">
            <h2 className="text-2xl font-bold mb-8">All Upcoming Events</h2>
            
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg shadow">
                <h3 className="text-xl font-medium mb-2">No events found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredEvents.map((event) => (
                  <GlassCard key={event.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 h-48 md:h-auto relative overflow-hidden">
                        <img 
                          src={event.image} 
                          alt={event.title} 
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
                          <h3 className="font-semibold text-xl">{event.title}</h3>
                          <span className="hidden md:inline-block text-xs font-medium px-3 py-1 rounded-full bg-wca-purple text-white mt-2 md:mt-0">
                            {event.category}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-start text-gray-600 dark:text-gray-300">
                            <Calendar size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                            <span className="text-sm">{event.date}</span>
                          </div>
                          <div className="flex items-start text-gray-600 dark:text-gray-300">
                            <Clock size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                            <span className="text-sm">{event.time}</span>
                          </div>
                          <div className="flex items-start text-gray-600 dark:text-gray-300">
                            <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                            <span className="text-sm">{event.location}</span>
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
            )}
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
