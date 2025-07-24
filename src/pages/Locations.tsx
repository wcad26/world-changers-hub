import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { MapPin, Clock, ExternalLink, Phone, Search, ChevronDown } from 'lucide-react';
import { usePublicLocations } from '@/hooks/usePublicLocations';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Locations = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  
  const { data: locations = [], isLoading, error } = usePublicLocations();
  
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
                    placeholder="Search by name or location..."
                    className="w-full px-4 py-3 pl-12 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-wca-purple/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-10">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeFilter === 'all' 
                        ? 'bg-wca-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter('center')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeFilter === 'center' 
                        ? 'bg-wca-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    WCA Centers
                  </button>
                  <button
                    onClick={() => setActiveFilter('dcg')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      activeFilter === 'dcg' 
                        ? 'bg-wca-purple text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    DCG Homes
                  </button>
                </div>
                
                <div className="relative ml-0 md:ml-4 mt-4 md:mt-0">
                  <div className="relative">
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-wca-purple/50 text-gray-600 dark:text-gray-300"
                    >
                      <option value="all">All Countries</option>
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
        <section className="py-16">
          <div className="container-custom">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredLocations.map((location) => (
                  <GlassCard key={location.id} className="overflow-hidden">
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={location.image_url || '/placeholder.svg'} 
                        alt={location.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          location.type === 'WCA Center' 
                            ? 'bg-wca-purple text-white' 
                            : 'bg-wca-teal text-white'
                        }`}>
                          {location.type}
                        </span>
                      </div>
                      {location.type === 'WCA Center' && location.region && (
                        <div className="absolute top-4 left-4">
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/80 text-gray-800">
                            {location.region.name} Region
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-3">{location.name}</h3>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-3">
                        <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">{location.address}</span>
                      </div>
                      {location.contact_phone && (
                        <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                          <Phone size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                          <span className="text-sm">{location.contact_phone}</span>
                        </div>
                      )}
                      
                      {location.fellowship_times && Array.isArray(location.fellowship_times) && location.fellowship_times.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium mb-2">
                            <Clock size={16} className="mr-2 text-wca-purple" />
                            <span>Fellowship Times</span>
                          </div>
                           <ul className="space-y-1 pl-7">
                             {(location.fellowship_times || []).map((time: any, index: number) => (
                               <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                                 {typeof time === 'string' ? time : `${time.day}: ${time.time} - ${time.type}`}
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-3 mt-6">
                        {location.type === 'WCA Center' && location.region && (
                          <Link 
                            to={`/locations/${formatRegionForUrl(location.region.name)}`}
                            className="flex items-center justify-center bg-wca-purple hover:bg-wca-violet text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                          >
                            Visit Regional Page
                          </Link>
                        )}
                        {(location.latitude && location.longitude) && (
                          <a 
                            href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center text-wca-purple hover:text-wca-violet transition-colors border border-wca-purple hover:border-wca-violet rounded-md px-4 py-2 text-sm font-medium"
                          >
                            <MapPin size={16} className="mr-2" />
                            View on Google Maps
                            <ExternalLink size={14} className="ml-1" />
                          </a>
                        )}
                        
                        {(() => {
                          // Determine contact phone for WhatsApp
                          let contactPhone = location.contact_phone;
                          let whatsappLink = location.whatsapp_link;
                          
                          // For DCG locations, use DCG leader's contact
                          if (location.type === 'DCG Location' && location.dcg) {
                            contactPhone = location.dcg.contact_phone || location.dcg.leader?.phone || contactPhone;
                          }
                          
                          // Show WhatsApp button for all DCG locations (they always have leader contact) or locations with contact info
                          const shouldShowWhatsApp = location.type === 'DCG Location' || whatsappLink || contactPhone;
                          
                          return shouldShowWhatsApp && (
                            <a 
                              href={whatsappLink || `https://wa.me/${contactPhone?.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              Chat on WhatsApp
                            </a>
                          );
                        })()}
                        
                        <button className="flex items-center justify-center bg-wca-purple hover:bg-wca-violet text-white rounded-md px-4 py-2 text-sm font-medium transition-colors">
                          Donate to this Location
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
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
