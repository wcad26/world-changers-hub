import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { WCACenterCard, DCGLocationCard, LocationCardSkeleton } from '@/components/ui/LocationCards';
import { Search, ChevronDown } from 'lucide-react';
import { usePublicLocations } from '@/hooks/usePublicLocations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Locations = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  
  const { data: locations = [], isLoading, error } = usePublicLocations();
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
      const searchFields = [
        location.name,
        location.address,
        location.city,
        location.region?.name || ''
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(query)) return false;
    }
    
    return true;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to format region name for URL
  const formatRegionForUrl = (region: string) => {
    // Convert region name to URL-friendly format
    return region.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''); // Remove special characters
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                Our Locations
              </div>
              <h1 className="font-bold mb-4">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  Find a WCA Center or DCG Home
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-10">
                Discover World Changers Association centers and Discipleship Group homes near you.
              </p>
              
              {/* Search and Filter Controls */}
              <div className="max-w-xl mx-auto mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={isMobile ? "Search locations..." : "Search by name or location..."}
                    className="w-full px-4 py-3 pl-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-wca-purple/50 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="flex flex-col gap-4 mb-10">
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-center space-x-4'}`}>
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`touch-target px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeFilter === 'all' 
                        ? 'bg-wca-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All Locations
                  </button>
                  <button
                    onClick={() => setActiveFilter('center')}
                    className={`touch-target px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeFilter === 'center' 
                        ? 'bg-wca-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    WCA Centers
                  </button>
                  <button
                    onClick={() => setActiveFilter('dcg')}
                    className={`touch-target px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeFilter === 'dcg' 
                        ? 'bg-wca-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    DCG Homes
                  </button>
                </div>
                
                <div className="relative">
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-wca-purple/50 text-gray-600 dark:text-gray-300 text-base"
                    >
                      <option value="all">All Regions</option>
                      {countries.map((country, index) => (
                        <option key={index} value={country}>{country}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Grid */}
        <section className="py-8 md:py-16">
          <div className="container-custom">
            {isLoading ? (
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {[...Array(6)].map((_, i) => (
                  <LocationCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load locations. Please try again later.
                </AlertDescription>
              </Alert>
            ) : filteredLocations.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No locations found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {filteredLocations.map((location) => {
                  const handleDonate = () => {
                    // TODO: Implement donation functionality
                    console.log('Donate to:', location.name);
                  };

                  return location.type === 'WCA Center' ? (
                    <WCACenterCard 
                      key={location.id} 
                      location={location} 
                      onDonate={handleDonate}
                    />
                  ) : (
                    <DCGLocationCard 
                      key={location.id} 
                      location={location} 
                      onDonate={handleDonate}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-bold mb-4">
                Can't Find a Location Near You?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                We're expanding our network every day. Contact us to learn about upcoming locations or how to start a WCA group in your area.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/contact" className="button-primary">
                  Contact Us
                </Link>
                <Link to="/events" className="button-outline">
                  View Our Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Locations;
