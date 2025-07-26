import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { WCACenterCard, DCGLocationCard, LocationCardSkeleton } from '@/components/ui/LocationCards';
import { Search, ChevronDown, MapPin, Filter, Globe, Users, Calendar, Heart } from 'lucide-react';
import { usePublicLocations } from '@/hooks/usePublicLocations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
const Locations = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const {
    data: locations = [],
    isLoading,
    error
  } = usePublicLocations();
  const isMobile = useIsMobile();

  // Extract unique countries from real data
  const countries = [...new Set((locations || []).map(location => location.region?.name || 'Unknown').filter(Boolean))];

  // Filter locations based on user selections
  const filteredLocations = (locations || []).filter(location => {
    // Filter by type
    if (activeFilter !== 'all') {
      const filterType = activeFilter === 'center' ? 'WCA Center' : 'DCG Location';
      if (location.type !== filterType) return false;
    }

    // Filter by region/country
    if (selectedCountry !== 'all') {
      if (location.region?.name !== selectedCountry) return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchFields = [location.name, location.address, location.city, location.region?.name || ''].join(' ').toLowerCase();
      if (!searchFields.includes(query)) return false;
    }
    return true;
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Stats for hero section
  const totalLocations = locations.length;
  const wcaCenters = locations.filter(l => l.type === 'WCA Center').length;
  const dcgHomes = locations.filter(l => l.type === 'DCG Location').length;
  return <div className="flex flex-col min-h-screen font-inter">
      <Navbar />
      
      <main className="flex-grow pt-0 py-0">
        {/* Hero Section - Magazine Style */}
        <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-float"></div>
          
          <div className="relative container-custom text-center z-10">
            <div className="max-w-5xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white font-medium text-sm mb-8 animate-fade-up">
                <Globe className="w-4 h-4" />
                Global Network
              </div>
              
              {/* Main Title */}
              <h1 className="font-crimson text-5xl md:text-7xl lg:text-8xl font-semibold text-white mb-8 leading-tight animate-fade-up">
                Discover Your
                <span className="block text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text">
                  Spiritual Home
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-up">
                Connect with vibrant communities across the globe. Find WCA Centers and DCG Homes where faith, fellowship, and transformation happen daily.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 animate-fade-up">
                <div className="text-center">
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{totalLocations}</div>
                  <div className="text-white/70 font-medium text-sm md:text-base">Total Locations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{wcaCenters}</div>
                  <div className="text-white/70 font-medium text-sm md:text-base">WCA Centers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{dcgHomes}</div>
                  <div className="text-white/70 font-medium text-sm md:text-base">DCG Homes</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Search Section - Floating Card */}
        <section className="relative -mt-20 mb-20 z-20 my-0">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800">
              <div className="space-y-6">
                {/* Search Title */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Find Your Community</h2>
                  <p className="text-gray-600 dark:text-gray-400">Search and filter to discover locations near you</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" placeholder="Search by name, city, or region..." className="w-full pl-14 pr-6 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-gray-900 text-lg transition-all duration-300" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>

                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Type Filters */}
                  <div className="flex flex-wrap gap-3 lg:flex-1">
                    {[{
                    key: 'all',
                    label: 'All Locations',
                    icon: MapPin
                  }, {
                    key: 'center',
                    label: 'WCA Centers',
                    icon: Users
                  }, {
                    key: 'dcg',
                    label: 'DCG Homes',
                    icon: Heart
                  }].map(({
                    key,
                    label,
                    icon: Icon
                  }) => {
                    const getActiveClasses = () => {
                      if (key === 'all') return 'bg-purple-500 text-white shadow-lg scale-105';
                      if (key === 'center') return 'bg-blue-500 text-white shadow-lg scale-105';
                      if (key === 'dcg') return 'bg-pink-500 text-white shadow-lg scale-105';
                      return '';
                    };
                    return <button key={key} onClick={() => setActiveFilter(key)} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${activeFilter === key ? getActiveClasses() : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'}`}>
                        <Icon className="w-4 h-4" />
                        {isMobile ? label.split(' ')[0] : label}
                      </button>;
                  })}
                  </div>

                  {/* Region Filter */}
                  <div className="relative lg:w-64">
                    <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} className="w-full appearance-none pl-6 pr-12 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 border-2 border-transparent focus:outline-none focus:border-purple-500 text-gray-700 dark:text-gray-300 font-medium cursor-pointer transition-all">
                      <option value="all">All Regions</option>
                      {countries.map((country, index) => <option key={index} value={country}>{country}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  </div>
                </div>

                {/* Results Summary */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {isLoading ? 'Searching...' : `${filteredLocations.length} ${filteredLocations.length === 1 ? 'location' : 'locations'} found`}
                  </p>
                  {(searchQuery || activeFilter !== 'all' || selectedCountry !== 'all') && <button onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setSelectedCountry('all');
                }} className="text-purple-600 hover:text-purple-700 font-semibold transition-colors flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Clear filters
                    </button>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Grid */}
        <section className="pb-20 py-0">
          <div className="container-custom">
            {isLoading ? <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => <LocationCardSkeleton key={i} />)}
              </div> : error ? <div className="flex justify-center">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Unable to load locations</h3>
                  <p className="text-red-700 dark:text-red-400">
                    There was an error loading the locations. Please try again later.
                  </p>
                </div>
              </div> : filteredLocations.length === 0 ? <div className="flex justify-center">
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 max-w-lg text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No locations found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                    We couldn't find any locations matching your criteria. Try adjusting your search or filter settings.
                  </p>
                  <button onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
                setSelectedCountry('all');
              }} className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 hover:scale-105 font-semibold">
                    <Filter className="w-5 h-5" />
                    Show all locations
                  </button>
                </div>
              </div> : <div className="space-y-8">
                {/* Section Header */}
                <div className="text-center">
                  <h2 className="font-crimson text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-4">
                    {activeFilter === 'all' ? 'Our Global Locations' : activeFilter === 'center' ? 'WCA Centers' : 'DCG Homes'}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    Showing {filteredLocations.length} of {locations.length} locations
                  </p>
                </div>
                
                {/* Cards Grid */}
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filteredLocations.map((location, index) => {
                const handleDonate = () => {
                  console.log('Donate to:', location.name);
                };
                return <div key={location.id} className="animate-fade-up" style={{
                  animationDelay: `${index * 0.1}s`
                }}>
                        {location.type === 'WCA Center' ? <WCACenterCard location={location} onDonate={handleDonate} /> : <DCGLocationCard location={location} onDonate={handleDonate} />}
                      </div>;
              })}
                </div>
              </div>}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="relative container-custom py-20 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-crimson text-4xl md:text-6xl font-semibold text-white mb-6">
                Don't See Your Area?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
                We're expanding our global network every day. Contact us to learn about upcoming locations or discover how to bring WCA to your community.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/contact" className="inline-flex items-center justify-center px-10 py-5 bg-white text-purple-600 rounded-2xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-xl font-bold text-lg">
                  Start the Conversation
                </Link>
                <Link to="/events" className="inline-flex items-center justify-center px-10 py-5 bg-transparent border-2 border-white text-white rounded-2xl hover:bg-white hover:text-purple-600 transition-all duration-300 hover:scale-105 font-bold text-lg">
                  Explore Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>;
};
export default Locations;