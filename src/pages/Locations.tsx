import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { WCACenterCard, DCGLocationCard, LocationCardSkeleton } from '@/components/ui/LocationCards';
import { Search, ChevronDown, MapPin, Filter, X } from 'lucide-react';
import { usePublicLocations } from '@/hooks/usePublicLocations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { GlassCard } from '@/components/ui/GlassPanels';

const Locations = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
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
      
      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          <div className="relative container-custom py-20 lg:py-28">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 animate-fade-in">
                <MapPin className="w-4 h-4" />
                Our Locations
              </div>
              <h1 className="font-bold text-4xl lg:text-6xl mb-6 animate-fade-in">
                <span className="text-gradient bg-gradient-to-r from-primary via-primary-accent to-secondary bg-clip-text text-transparent">
                  Find Your Community
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
                Connect with World Changers Association centers and Discipleship Group homes in your area.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="relative -mt-10 mb-16">
          <div className="container-custom">
            <GlassCard className="max-w-4xl mx-auto p-6 lg:p-8">
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, city, or region..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                  {/* Type Filter */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All Locations', icon: MapPin },
                      { key: 'center', label: 'WCA Centers', icon: MapPin },
                      { key: 'dcg', label: 'DCG Homes', icon: MapPin }
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                          activeFilter === key
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:scale-105'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Region Filter */}
                  <div className="relative lg:ml-auto min-w-48">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-secondary/80 border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    >
                      <option value="all">All Regions</option>
                      {countries.map((country, index) => (
                        <option key={index} value={country}>{country}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  </div>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-muted-foreground">
                    {isLoading ? 'Loading...' : `${filteredLocations.length} location${filteredLocations.length !== 1 ? 's' : ''} found`}
                  </p>
                  {(searchQuery || activeFilter !== 'all' || selectedCountry !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveFilter('all');
                        setSelectedCountry('all');
                      }}
                      className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Locations Grid */}
        <section className="pb-20">
          <div className="container-custom">
            {isLoading ? (
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <LocationCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex justify-center">
                <GlassCard className="p-8 max-w-md text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Unable to load locations</h3>
                  <p className="text-muted-foreground">
                    There was an error loading the locations. Please try again later.
                  </p>
                </GlassCard>
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="flex justify-center">
                <GlassCard className="p-12 max-w-lg text-center">
                  <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-4">No locations found</h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn't find any locations matching your criteria. Try adjusting your search or filter settings.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                      setSelectedCountry('all');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </GlassCard>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Results header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">
                    {activeFilter === 'all' 
                      ? 'All Locations' 
                      : activeFilter === 'center' 
                        ? 'WCA Centers' 
                        : 'DCG Homes'
                    }
                  </h2>
                  <div className="text-muted-foreground">
                    Showing {filteredLocations.length} of {locations.length} locations
                  </div>
                </div>
                
                {/* Location cards grid */}
                <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {filteredLocations.map((location, index) => {
                    const handleDonate = () => {
                      console.log('Donate to:', location.name);
                    };

                    return (
                      <div key={location.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                        {location.type === 'WCA Center' ? (
                          <WCACenterCard 
                            location={location} 
                            onDonate={handleDonate}
                          />
                        ) : (
                          <DCGLocationCard 
                            location={location} 
                            onDonate={handleDonate}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary/20 via-background to-primary/10">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
          <div className="relative container-custom py-20">
            <GlassCard className="max-w-4xl mx-auto p-12 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                <span className="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Can't Find a Location Near You?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                We're expanding our network globally. Contact us to learn about upcoming locations or how to start a WCA community in your area.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-lg shadow-primary/25 font-semibold"
                >
                  Get In Touch
                </Link>
                <Link 
                  to="/events" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-secondary/80 text-secondary-foreground rounded-xl hover:bg-secondary transition-all duration-200 hover:scale-105 font-semibold"
                >
                  Explore Events
                </Link>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Locations;
