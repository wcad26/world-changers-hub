
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GlassCard } from '@/components/ui/GlassPanels';
import { MapPin, Clock, ExternalLink, Phone, Calendar, Users, Mail, ArrowLeft } from 'lucide-react';

// Mock data for WCA centers and DCG homes (expanded with more details for regional pages)
const locations = [
  {
    id: 1,
    type: "center",
    name: "WCA Main Center",
    region: "North East",
    description: "The WCA Main Center serves as our headquarters and main worship center. We host weekly services, training programs, and community outreach initiatives from this location.",
    address: "123 Transformation Ave, New York, NY 10001",
    city: "New York",
    country: "United States",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2075&q=80",
    phone: "+1 (234) 567-890",
    email: "northeast@wcaglobal.org",
    leadPastor: "Pastor John Smith",
    establishedYear: 2005,
    memberCount: 1200,
    dcgCount: 15,
    serviceSchedule: "Sundays 9AM & 11AM, Wednesdays 7PM",
    upcomingEvents: [
      {
        id: 1,
        title: "Prayer & Worship Night",
        date: "2023-11-25",
        time: "7:00 PM - 9:00 PM"
      },
      {
        id: 2,
        title: "Christmas Outreach",
        date: "2023-12-15",
        time: "10:00 AM - 3:00 PM"
      }
    ],
    ministries: ["Children's Ministry", "Youth Ministry", "Women's Fellowship", "Men's Fellowship", "Worship Team"],
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
    region: "Mid West",
    description: "The WCA Eastside Branch focuses on urban ministry and community development. We provide services in multiple languages and offer various educational programs.",
    address: "456 Vision St, Chicago, IL 60601",
    city: "Chicago",
    country: "United States",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (345) 678-901",
    email: "midwest@wcaglobal.org",
    leadPastor: "Pastor Michael Johnson",
    establishedYear: 2010,
    memberCount: 850,
    dcgCount: 12,
    serviceSchedule: "Sundays 10AM, Tuesdays 7PM",
    upcomingEvents: [
      {
        id: 1,
        title: "Family Conference",
        date: "2023-11-18",
        time: "9:00 AM - 5:00 PM"
      },
      {
        id: 2,
        title: "Youth Rally",
        date: "2023-12-08",
        time: "6:00 PM - 9:00 PM"
      }
    ],
    ministries: ["Community Outreach", "Family Counseling", "Prayer Ministry", "Worship Team"],
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
    id: 5,
    type: "center",
    name: "WCA Downtown Center",
    region: "South East",
    description: "The WCA Downtown Center is located in the heart of Miami, bringing transformation to the urban community through various outreach programs and worship services.",
    address: "222 Faith Blvd, Miami, FL 33101",
    city: "Miami",
    country: "United States",
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    phone: "+1 (678) 901-234",
    email: "southeast@wcaglobal.org",
    leadPastor: "Pastor David Wilson",
    establishedYear: 2012,
    memberCount: 650,
    dcgCount: 10,
    serviceSchedule: "Sundays 9:30AM, Wednesdays 7PM",
    upcomingEvents: [
      {
        id: 1,
        title: "Leadership Summit",
        date: "2023-11-30",
        time: "8:00 AM - 4:00 PM"
      },
      {
        id: 2,
        title: "Community Service Day",
        date: "2023-12-02",
        time: "9:00 AM - 1:00 PM"
      }
    ],
    ministries: ["Urban Outreach", "Worship Ministry", "Children's Church", "Young Adults"],
    fellowshipTimes: [
      "Sunday: 9:00 AM - 11:00 AM",
      "Wednesday: 7:00 PM - 8:30 PM"
    ],
    coordinates: {
      lat: 25.7617,
      lng: -80.1918
    }
  }
];

// DCG Locations associated with each region
const dcgLocations = [
  {
    id: 3,
    type: "dcg",
    name: "Bright Light DCG",
    region: "North East",
    address: "789 Community Rd, New York, NY 10025",
    city: "New York",
    country: "United States",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (456) 789-012",
    leader: "John Doe",
    memberCount: 15,
    fellowshipTimes: [
      "Thursday: 7:00 PM - 8:30 PM",
      "Saturday: 5:00 PM - 7:00 PM"
    ],
    coordinates: {
      lat: 40.7989,
      lng: -73.9680
    }
  },
  {
    id: 4,
    type: "dcg",
    name: "New Life DCG",
    region: "Mid West",
    address: "101 Hope Lane, Chicago, IL 60611",
    city: "Chicago",
    country: "United States",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (567) 890-123",
    leader: "Emma Thompson",
    memberCount: 12,
    fellowshipTimes: [
      "Monday: 6:30 PM - 8:00 PM",
      "Friday: 7:00 PM - 9:00 PM"
    ],
    coordinates: {
      lat: 41.8964,
      lng: -87.6228
    }
  },
  {
    id: 6,
    type: "dcg",
    name: "Grace Covenant DCG",
    region: "South East",
    address: "333 Blessing Ave, Miami, FL 33139",
    city: "Miami",
    country: "United States",
    image: "https://images.unsplash.com/photo-1598228723793-52759bba239c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
    phone: "+1 (789) 012-345",
    leader: "Sarah Johnson",
    memberCount: 10,
    fellowshipTimes: [
      "Tuesday: 7:00 PM - 8:30 PM",
      "Saturday: 10:00 AM - 12:00 PM"
    ],
    coordinates: {
      lat: 25.7825,
      lng: -80.1340
    }
  },
  {
    id: 7,
    type: "dcg",
    name: "Faith Builders DCG",
    region: "North East",
    address: "456 Faith St, Bronx, NY 10452",
    city: "New York",
    country: "United States",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    phone: "+1 (890) 123-456",
    leader: "Robert Williams",
    memberCount: 8,
    fellowshipTimes: [
      "Wednesday: 7:00 PM - 8:30 PM",
      "Sunday: 5:00 PM - 7:00 PM"
    ],
    coordinates: {
      lat: 40.8296,
      lng: -73.9262
    }
  }
];

const RegionalBranchHome = () => {
  const { region } = useParams<{region: string}>();
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [regionDCGs, setRegionDCGs] = useState<any[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Find the center that matches the region parameter
    const locationFound = locations.find(loc => 
      loc.region.toLowerCase().replace(/\s+/g, '-') === region
    );
    
    if (locationFound) {
      setCurrentLocation(locationFound);
      
      // Find all DCGs in this region
      const dcgsInRegion = dcgLocations.filter(dcg => 
        dcg.region === locationFound.region
      );
      setRegionDCGs(dcgsInRegion);
    }
  }, [region]);

  if (!currentLocation) {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative">
          <div className="h-[40vh] md:h-[50vh] relative overflow-hidden">
            <img 
              src={currentLocation.image} 
              alt={currentLocation.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 flex items-center">
              <div className="container-custom text-white">
                <div className="max-w-3xl">
                  <Link to="/locations" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to All Locations
                  </Link>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{currentLocation.name}</h1>
                  <p className="text-lg md:text-xl text-white/90 mb-6">
                    {currentLocation.region} Region
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={`https://maps.google.com/?q=${currentLocation.coordinates.lat},${currentLocation.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-4 py-2 text-sm inline-flex items-center transition-colors"
                    >
                      <MapPin size={16} className="mr-2" />
                      Get Directions
                    </a>
                    <a 
                      href={`tel:${currentLocation.phone}`}
                      className="bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-4 py-2 text-sm inline-flex items-center transition-colors"
                    >
                      <Phone size={16} className="mr-2" />
                      Call Center
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-white dark:bg-gray-950">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold mb-6">About Our Center</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {currentLocation.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <Calendar className="mr-2 text-wca-purple" size={20} />
                      Service Schedule
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {currentLocation.serviceSchedule}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <Users className="mr-2 text-wca-purple" size={20} />
                      Membership
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {currentLocation.memberCount} members<br />
                      {currentLocation.dcgCount} Destiny Care Groups
                    </p>
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="font-semibold text-xl mb-4">Ministries</h3>
                  <div className="flex flex-wrap gap-2">
                    {currentLocation.ministries.map((ministry: string, index: number) => (
                      <span 
                        key={index}
                        className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm"
                      >
                        {ministry}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg sticky top-24">
                  <h3 className="font-semibold text-xl mb-4">Contact Information</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex">
                      <MapPin className="mr-3 h-5 w-5 text-wca-purple flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-gray-600 dark:text-gray-300">{currentLocation.address}</p>
                        <p className="text-gray-600 dark:text-gray-300">{currentLocation.city}, {currentLocation.country}</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Phone className="mr-3 h-5 w-5 text-wca-purple flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-gray-600 dark:text-gray-300">{currentLocation.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Mail className="mr-3 h-5 w-5 text-wca-purple flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-gray-600 dark:text-gray-300">{currentLocation.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <Users className="mr-3 h-5 w-5 text-wca-purple flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-medium">Lead Pastor</p>
                        <p className="text-gray-600 dark:text-gray-300">{currentLocation.leadPastor}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <a 
                      href={`https://maps.google.com/?q=${currentLocation.coordinates.lat},${currentLocation.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-primary w-full justify-center"
                    >
                      <MapPin size={16} className="mr-2" />
                      Get Directions
                    </a>
                    
                    <a 
                      href={`https://wa.me/${currentLocation.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Upcoming Events */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-8">Upcoming Events</h2>
            
            {currentLocation.upcomingEvents && currentLocation.upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentLocation.upcomingEvents.map((event: any) => (
                  <GlassCard key={event.id} className="overflow-hidden">
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-2">{event.title}</h3>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-2">
                        <Calendar size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-4">
                        <Clock size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">{event.time}</span>
                      </div>
                      <button className="w-full mt-4 button-outline">Learn More</button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300">
                No upcoming events at this time. Check back soon!
              </p>
            )}
            
            <div className="text-center mt-10">
              <Link to="/events" className="button-primary">
                View All Events
              </Link>
            </div>
          </div>
        </section>
        
        {/* DCG Locations */}
        <section className="py-16 bg-white dark:bg-gray-950">
          <div className="container-custom">
            <h2 className="text-3xl font-bold mb-4">Destiny Care Groups in this Region</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Join one of our Destiny Care Groups in the {currentLocation.region} region for fellowship, discipleship, and community.
            </p>
            
            {regionDCGs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionDCGs.map((dcg) => (
                  <GlassCard key={dcg.id} className="overflow-hidden">
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={dcg.image} 
                        alt={dcg.name} 
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute top-4 right-4">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-wca-teal text-white">
                          DCG Home
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-xl mb-3">{dcg.name}</h3>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-3">
                        <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">{dcg.address}</span>
                      </div>
                      <div className="flex items-start text-gray-600 dark:text-gray-300 mb-3">
                        <Users size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                        <span className="text-sm">Led by {dcg.leader}</span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center text-gray-700 dark:text-gray-200 font-medium mb-2">
                          <Clock size={16} className="mr-2 text-wca-purple" />
                          <span>Meeting Times</span>
                        </div>
                        <ul className="space-y-1 pl-7">
                          {dcg.fellowshipTimes.map((time: string, index: number) => (
                            <li key={index} className="text-sm text-gray-600 dark:text-gray-300">
                              {time}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="flex flex-col gap-3 mt-6">
                        <a 
                          href={`https://maps.google.com/?q=${dcg.coordinates.lat},${dcg.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center text-wca-purple hover:text-wca-violet transition-colors border border-wca-purple hover:border-wca-violet rounded-md px-4 py-2 text-sm font-medium"
                        >
                          <MapPin size={16} className="mr-2" />
                          View on Google Maps
                        </a>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300">
                No Destiny Care Groups found in this region. Contact us to start one!
              </p>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-bold mb-4">
                Join Our Community
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                We'd love to have you visit our center or attend one of our Destiny Care Groups. Get in touch with us to learn more.
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

export default RegionalBranchHome;
