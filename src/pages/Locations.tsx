
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { MapPin, Clock, ExternalLink, Phone, Search, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock data for WCA centers and DCG homes
const locations = [
  {
    id: 1,
    type: "center",
    name: "WCA Main Center",
    address: "123 Transformation Ave, New York, NY 10001",
    city: "New York",
    country: "United States",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80",
    phone: "+1 (234) 567-890",
    fellowshipTimes: [
      "Sunday: 10:00 AM - 12:00 PM",
      "Wednesday: 6:30 PM - 8:00 PM",
      "Friday: 7:00 PM - 9:00 PM"
    ],
    coordinates: {
      lat: 40.7128,
      lng: -74.0060
    }
  },
  {
    id: 2,
    type: "center",
    name: "WCA Eastside Branch",
    address: "456 Vision St, Chicago, IL 60601",
    city: "Chicago",
    country: "United States",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (345) 678-901",
    fellowshipTimes: [
      "Sunday: 11:00 AM - 1:00 PM",
      "Tuesday: 7:00 PM - 8:30 PM"
    ],
    coordinates: {
      lat: 41.8781,
      lng: -87.6298
    }
  },
  {
    id: 3,
    type: "dcg",
    name: "Bright Light DCG",
    address: "789 Community Rd, Los Angeles, CA 90001",
    city: "Los Angeles",
    country: "United States",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (456) 789-012",
    fellowshipTimes: [
      "Thursday: 7:00 PM - 8:30 PM",
      "Saturday: 5:00 PM - 7:00 PM"
    ],
    coordinates: {
      lat: 34.0522,
      lng: -118.2437
    }
  },
  {
    id: 4,
    type: "dcg",
    name: "New Life DCG",
    address: "101 Hope Lane, Houston, TX 77001",
    city: "Houston",
    country: "United States",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (567) 890-123",
    fellowshipTimes: [
      "Monday: 6:30 PM - 8:00 PM",
      "Friday: 7:00 PM - 9:00 PM"
    ],
    coordinates: {
      lat: 29.7604,
      lng: -95.3698
    }
  },
  {
    id: 5,
    type: "center",
    name: "WCA Downtown Center",
    address: "222 Faith Blvd, Miami, FL 33101",
    city: "Miami",
    country: "United States",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    phone: "+1 (678) 901-234",
    fellowshipTimes: [
      "Sunday: 9:00 AM - 11:00 AM",
      "Wednesday: 7:00 PM - 8:30 PM"
    ],
    coordinates: {
      lat: 25.7617,
      lng: -80.1918
    }
  },
  {
    id: 6,
    type: "dcg",
    name: "Grace Covenant DCG",
    address: "333 Blessing Ave, Phoenix, AZ 85001",
    city: "Phoenix",
    country: "United States",
    image: "https://images.unsplash.com/photo-1598228723793-52759bba239c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    phone: "+1 (789) 012-345",
    fellowshipTimes: [
      "Tuesday: 7:00 PM - 8:30 PM",
      "Saturday: 10:00 AM - 12:00 PM"
    ],
    coordinates: {
      lat: 33.4484,
      lng: -112.0740
    }
  },
];

const Locations = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(locations);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Extract unique countries
    const uniqueCountries = [...new Set(locations.map(location => location.country))];
    setCountries(uniqueCountries);
  }, []);

  useEffect(() => {
    let result = locations;
    
    // Filter by type
    if (activeFilter !== 'all') {
      result = result.filter(location => location.type === activeFilter);
    }
    
    // Filter by country
    if (selectedCountry !== 'all') {
      result = result.filter(location => location.country === selectedCountry);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(location => 
        location.name.toLowerCase().includes(query) || 
        location.address.toLowerCase().includes(query) ||
        location.city.toLowerCase().includes(query)
      );
    }
    
    setFilteredLocations(result);
  }, [activeFilter, searchQuery, selectedCountry]);

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
            {filteredLocations.length === 0 ? (
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
                        src={location.image} 
                        alt={location.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                          location.type === 'center' 
                            ? 'bg-wca-purple text-white' 
                            : 'bg-wca-teal text-white'
                        }`}>
                          {location.type === 'center' ? 'WCA Center' : 'DCG Home'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-3">{location.name}</h3>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-3">
                        <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">{location.address}</span>
                      </div>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                        <Phone size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">{location.phone}</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium mb-2">
                          <Clock size={16} className="mr-2 text-wca-purple" />
                          <span>Fellowship Times</span>
                        </div>
                        <ul className="space-y-1 pl-7">
                          {location.fellowshipTimes.map((time, index) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                              {time}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex flex-col gap-3 mt-6">
                        <a 
                          href={`https://maps.google.com/?q=${location.coordinates.lat},${location.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center text-wca-purple hover:text-wca-violet transition-colors border border-wca-purple hover:border-wca-violet rounded-md px-4 py-2 text-sm font-medium"
                        >
                          <MapPin size={16} className="mr-2" />
                          View on Google Maps
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                        
                        <a 
                          href={`https://wa.me/${location.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Chat on WhatsApp
                        </a>
                        
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
