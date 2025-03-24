
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  HandHeart
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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
        time: "7:00 PM - 9:00 PM",
        description: "Join us for a powerful evening of prayer and worship as we seek God's presence together.",
        location: "Main Sanctuary"
      },
      {
        id: 2,
        title: "Christmas Outreach",
        date: "2023-12-15",
        time: "10:00 AM - 3:00 PM",
        description: "Help us bring Christmas joy to our community through gift-giving, food, and fellowship.",
        location: "Community Hall & Surrounding Areas"
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
    },
    testimonials: [
      {
        id: 1,
        quote: "Finding this community changed my life. I've grown spiritually and made lifelong friends.",
        name: "Sarah Johnson",
        role: "Member since 2018"
      },
      {
        id: 2,
        quote: "The leadership training here equipped me to serve effectively both in church and at work.",
        name: "Michael Chen",
        role: "Ministry Leader"
      }
    ],
    pastorBio: "Pastor John Smith has been leading our church for over 15 years. With a passion for discipleship and community transformation, he has helped thousands grow in their faith journey.",
    pastorImage: "https://images.unsplash.com/photo-1556157382-97eda2f9e69d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    socialMedia: {
      facebook: "https://facebook.com/wcanortheast",
      instagram: "https://instagram.com/wcanortheast",
      youtube: "https://youtube.com/wcanortheast"
    },
    gallery: [
      "https://images.unsplash.com/photo-1447758902204-9a8371671fdc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
    ]
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
        time: "9:00 AM - 5:00 PM",
        description: "A full-day conference focused on strengthening families through biblical principles and practical workshops.",
        location: "Main Sanctuary & Classrooms"
      },
      {
        id: 2,
        title: "Youth Rally",
        date: "2023-12-08",
        time: "6:00 PM - 9:00 PM",
        description: "An energetic night for teenagers with worship, games, and an inspiring message.",
        location: "Youth Center"
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
    },
    testimonials: [
      {
        id: 1,
        quote: "The diverse community here makes everyone feel welcome. I've learned so much from people with different backgrounds.",
        name: "Emily Rodriguez",
        role: "Volunteer"
      },
      {
        id: 2,
        quote: "The children's program is incredible! My kids love coming to church every week.",
        name: "David Wilson",
        role: "Parent & Member"
      }
    ],
    pastorBio: "Pastor Michael Johnson has been serving our community since 2010. With a background in urban ministry and a heart for diversity, he leads our congregation with wisdom and compassion.",
    pastorImage: "https://images.unsplash.com/photo-1542596594-649edbc13630?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80",
    socialMedia: {
      facebook: "https://facebook.com/wcamidwest",
      instagram: "https://instagram.com/wcamidwest",
      youtube: "https://youtube.com/wcamidwest"
    },
    gallery: [
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1559132240-7ae060e45bb1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2062&q=80",
      "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
    ]
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
        time: "8:00 AM - 4:00 PM",
        description: "A day of intensive leadership training for current and aspiring ministry leaders.",
        location: "Conference Center"
      },
      {
        id: 2,
        title: "Community Service Day",
        date: "2023-12-02",
        time: "9:00 AM - 1:00 PM",
        description: "Join us as we serve our local community through various practical projects.",
        location: "Various Locations"
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
    },
    testimonials: [
      {
        id: 1,
        quote: "The worship here is so powerful. I feel God's presence every time I attend.",
        name: "Lisa Thompson",
        role: "Worship Team Member"
      },
      {
        id: 2,
        quote: "As a young adult, I've found mentors who guide me spiritually and professionally.",
        name: "Jason Martinez",
        role: "Young Adults Ministry"
      }
    ],
    pastorBio: "Pastor David Wilson has a heart for the city. His passion for community transformation has led to numerous initiatives that have positively impacted our urban neighborhood.",
    pastorImage: "https://images.unsplash.com/photo-1528892952291-009c663ce843?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
    socialMedia: {
      facebook: "https://facebook.com/wcasoutheast",
      instagram: "https://instagram.com/wcasoutheast",
      youtube: "https://youtube.com/wcasoutheast"
    },
    gallery: [
      "https://images.unsplash.com/photo-1554734867-bf3c00a49371?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1576089073624-b5443eb93f8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      "https://images.unsplash.com/photo-1540898370-584f74c15a36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
    ]
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
  const [activeTab, setActiveTab] = useState('about');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { toast } = useToast();
  
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileNavOpen(false);
  };

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
              src={currentLocation.image} 
              alt={currentLocation.name}
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
                  {currentLocation.name}
                </span>
              </h1>
              
              <p className="text-white/90 text-lg md:text-xl max-w-2xl">
                {currentLocation.region} Region • Established {currentLocation.establishedYear}
              </p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <button 
                  onClick={() => scrollToSection('visit')}
                  className="bg-wca-purple hover:bg-wca-violet text-white font-medium rounded-full px-6 py-3 text-sm inline-flex items-center transition-colors"
                >
                  Plan Your Visit
                </button>
                
                <a 
                  href={`tel:${currentLocation.phone}`}
                  className="bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-5 py-3 text-sm inline-flex items-center transition-colors"
                >
                  <Phone size={16} className="mr-2" />
                  Contact Us
                </a>
                
                <button 
                  onClick={() => scrollToSection('events')}
                  className="bg-white/20 hover:bg-white/30 text-white font-medium rounded-full px-5 py-3 text-sm inline-flex items-center transition-colors"
                >
                  <Calendar size={16} className="mr-2" />
                  View Events
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Navigation with Indicator */}
      <div className="sticky top-16 z-20 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center justify-between h-14">
            <nav className="flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('about')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors ${activeTab === 'about' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('events')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors ${activeTab === 'events' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Events
              </button>
              <button 
                onClick={() => scrollToSection('ministries')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors ${activeTab === 'ministries' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Ministries
              </button>
              <button 
                onClick={() => scrollToSection('dcg')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors ${activeTab === 'dcg' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                DCG Homes
              </button>
              <button 
                onClick={() => scrollToSection('visit')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors ${activeTab === 'visit' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Visit
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className={`text-sm font-medium px-1 py-4 border-b-2 transition-colors ${activeTab === 'gallery' ? 'border-wca-purple text-wca-purple dark:text-wca-violet' : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Gallery
              </button>
            </nav>
            
            <div className="flex items-center space-x-4">
              <a 
                href={currentLocation.socialMedia.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-wca-purple dark:hover:text-wca-violet transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href={currentLocation.socialMedia.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-wca-purple dark:hover:text-wca-violet transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href={currentLocation.socialMedia.youtube} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-wca-purple dark:hover:text-wca-violet transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center justify-between h-14">
            <h2 className="font-medium text-gray-800 dark:text-white">{currentLocation.name}</h2>
            
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
                    onClick={() => scrollToSection('ministries')}
                    className="text-sm font-medium py-2 px-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Ministries
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
                    Visit
                  </button>
                  <button 
                    onClick={() => scrollToSection('gallery')}
                    className="text-sm font-medium py-2 px-3 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Gallery
                  </button>
                </nav>
                
                <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <a 
                    href={currentLocation.socialMedia.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-wca-purple dark:hover:text-wca-violet transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook size={18} />
                  </a>
                  <a 
                    href={currentLocation.socialMedia.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-wca-purple dark:hover:text-wca-violet transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram size={18} />
                  </a>
                  <a 
                    href={currentLocation.socialMedia.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-300 hover:text-wca-purple dark:hover:text-wca-violet transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube size={18} />
                  </a>
                </div>
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
                  <h2 className="text-3xl font-bold mb-6">About Our Center</h2>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                    {currentLocation.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-wca-purple/10 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-wca-purple" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Established</h3>
                      <p className="text-gray-600 dark:text-gray-300">{currentLocation.establishedYear}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-wca-purple/10 flex items-center justify-center">
                          <Users className="h-6 w-6 text-wca-purple" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Members</h3>
                      <p className="text-gray-600 dark:text-gray-300">{currentLocation.memberCount.toLocaleString()}</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-wca-purple/10 flex items-center justify-center">
                          <Home className="h-6 w-6 text-wca-purple" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-lg mb-1">DCG Homes</h3>
                      <p className="text-gray-600 dark:text-gray-300">{currentLocation.dcgCount}</p>
                    </div>
                  </div>
                </div>
                
                {/* Service Schedule */}
                <div className="mb-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center mb-6">
                    <Clock className="h-5 w-5 text-wca-purple mr-2" />
                    <h3 className="text-xl font-semibold">Service Schedule</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {currentLocation.fellowshipTimes.map((time: string, index: number) => (
                      <div key={index} className="flex items-start border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                        <div className="w-20 font-medium text-gray-800 dark:text-gray-200">
                          {time.split(':')[0]}:
                        </div>
                        <div className="flex-1 text-gray-600 dark:text-gray-300">
                          {time.split(':').slice(1).join(':').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Leadership Section */}
                <div className="mb-12">
                  <h3 className="text-2xl font-bold mb-6">Our Leadership</h3>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="grid md:grid-cols-2">
                      <div className="h-64 md:h-auto">
                        <img 
                          src={currentLocation.pastorImage} 
                          alt={currentLocation.leadPastor} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 md:p-8 flex flex-col justify-center">
                        <h4 className="text-xl font-semibold mb-2">{currentLocation.leadPastor}</h4>
                        <p className="text-wca-purple dark:text-wca-violet text-sm font-medium mb-4">Lead Pastor</p>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                          {currentLocation.pastorBio}
                        </p>
                        <div className="flex space-x-3">
                          <a 
                            href="#contact" 
                            className="inline-flex items-center text-sm font-medium text-wca-purple dark:text-wca-violet hover:text-wca-violet dark:hover:text-wca-purple transition-colors"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Contact
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Testimonials Section */}
                <div>
                  <h3 className="text-2xl font-bold mb-6">Member Testimonials</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentLocation.testimonials.map((testimonial: any) => (
                      <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex justify-start mb-4 text-4xl text-wca-purple">"</div>
                        <p className="text-gray-600 dark:text-gray-300 italic mb-6">
                          {testimonial.quote}
                        </p>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Sidebar with Contact & Location Info */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-32">
                  <h3 className="font-semibold text-xl mb-6">Contact & Location</h3>
                  
                  <div className="space-y-6 mb-8">
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
                  
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-6 h-40 md:h-48">
                    <iframe 
                      title="Location Map"
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      scrolling="no" 
                      marginHeight={0} 
                      marginWidth={0} 
                      src={`https://maps.google.com/maps?q=${currentLocation.coordinates.lat},${currentLocation.coordinates.lng}&z=15&output=embed`}
                    ></iframe>
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
                    
                    <a
                      href={`mailto:${currentLocation.email}`}
                      className="flex items-center justify-center bg-wca-purple hover:bg-wca-violet text-white rounded-md px-4 py-2 text-sm font-medium transition-colors"
                    >
                      <Mail size={16} className="mr-2" />
                      Email Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Events Section */}
        <section id="events" className="py-16 lg:py-24 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                Join Us
              </div>
              <h2 className="text-3xl font-bold mb-4">Upcoming Events</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Be part of our vibrant community by attending one of our upcoming events. Everyone is welcome!
              </p>
            </div>
            
            {currentLocation.upcomingEvents && currentLocation.upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentLocation.upcomingEvents.map((event: any) => (
                  <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6">
                      <div className="mb-4">
                        <span className="bg-wca-purple/10 text-wca-purple text-xs font-semibold px-2.5 py-1 rounded-full">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-semibold text-xl mb-2">{event.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-start text-gray-600 dark:text-gray-300">
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
                        <div className="flex items-start text-gray-600 dark:text-gray-300">
                          <Clock size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                          <span className="text-sm">{event.time}</span>
                        </div>
                        <div className="flex items-start text-gray-600 dark:text-gray-300">
                          <MapPin size={16} className="mr-2 mt-1 flex-shrink-0 text-wca-purple" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm">
                          Learn More
                        </Button>
                        <Button className="bg-wca-purple hover:bg-wca-violet" size="sm">
                          Register
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300">
                No upcoming events at this time. Check back soon!
              </p>
            )}
            
            <div className="text-center mt-10">
              <Link to="/events" className="button-primary inline-flex items-center">
                View All Events
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </section>
        
        {/* Ministries Section */}
        <section id="ministries" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                Get Involved
              </div>
              <h2 className="text-3xl font-bold mb-4">Our Ministries</h2>
              <p className="text-gray-600 dark:text-gray-300">
                We offer various ministries to help you grow spiritually and connect with others who share your interests.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {currentLocation.ministries.map((ministry: string, index: number) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 bg-wca-purple/10 rounded-full flex items-center justify-center mb-4">
                    {index % 4 === 0 && <Heart className="h-6 w-6 text-wca-purple" />}
                    {index % 4 === 1 && <Globe className="h-6 w-6 text-wca-purple" />}
                    {index % 4 === 2 && <MessageCircle className="h-6 w-6 text-wca-purple" />}
                    {index % 4 === 3 && <HandHeart className="h-6 w-6 text-wca-purple" />}
                  </div>
                  <h3 className="font-semibold text-lg mb-3">{ministry}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Join our {ministry.toLowerCase()} to grow spiritually and connect with others who share your passion.
                  </p>
                  <button className="text-wca-purple dark:text-wca-violet font-medium text-sm inline-flex items-center hover:underline">
                    Learn More
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                Interested in joining one of our ministries or starting a new one? We'd love to hear from you!
              </p>
              <Button className="bg-wca-purple hover:bg-wca-violet">
                Contact Ministry Team
              </Button>
            </div>
          </div>
        </section>
        
        {/* DCG Locations */}
        <section id="dcg" className="py-16 lg:py-24 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                Community
              </div>
              <h2 className="text-3xl font-bold mb-4">Destiny Care Groups</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Join one of our Destiny Care Groups in the {currentLocation.region} region for fellowship, discipleship, and community.
              </p>
            </div>
            
            {regionDCGs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regionDCGs.map((dcg) => (
                  <div key={dcg.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                          className="button-outline w-full justify-center"
                        >
                          <MapPin size={16} className="mr-2" />
                          View on Google Maps
                        </a>
                        
                        <Button className="w-full bg-wca-purple hover:bg-wca-violet">
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact Group Leader
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-600 dark:text-gray-300">
                No Destiny Care Groups found in this region. Contact us to start one!
              </p>
            )}
            
            <div className="mt-12 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Start Your Own DCG</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Interested in hosting a Destiny Care Group in your home? We provide training and resources to help you get started.
                  </p>
                  <Button className="bg-wca-purple hover:bg-wca-violet">
                    Learn More
                  </Button>
                </div>
                <div className="flex justify-center">
                  <img 
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80" 
                    alt="Group meeting" 
                    className="rounded-lg shadow-md max-h-64 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Plan Your Visit */}
        <section id="visit" className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                  Join Us
                </div>
                <h2 className="text-3xl font-bold mb-4">Plan Your Visit</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We'd love to have you visit us! Here's what you can expect when you come to {currentLocation.name}.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-6">What to Expect</h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-2">Worship Service</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          Our services include contemporary worship, prayer, and practical Bible teaching.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Kids & Youth</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          We offer age-appropriate programs for children and teenagers during service times.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Community</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          Stay after service to connect with our friendly community over coffee and refreshments.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <Button className="bg-wca-purple hover:bg-wca-violet">
                        Schedule Your Visit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="h-64 md:h-auto">
                    <img 
                      src="https://images.unsplash.com/photo-1579800246545-37bda0b3cc22?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2942&q=80" 
                      alt="Church service" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-wca-purple text-white rounded-xl shadow-md">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">First-Time Visitor?</h3>
                  <p className="text-white/80">
                    Fill out this form, and we'll have a welcome gift ready for you when you arrive.
                  </p>
                </div>
                
                <form className="max-w-md mx-auto grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-1">
                        First Name
                      </label>
                      <input 
                        type="text" 
                        id="firstName" 
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Your first name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-1">
                        Last Name
                      </label>
                      <input 
                        type="text" 
                        id="lastName" 
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
                      Email
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Your email address"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-1">
                      Phone (Optional)
                    </label>
                    <input 
                      type="tel" 
                      id="phone" 
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                      placeholder="Your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="visitDate" className="block text-sm font-medium text-white/90 mb-1">
                      Planned Visit Date
                    </label>
                    <input 
                      type="date" 
                      id="visitDate" 
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                  </div>
                  
                  <div className="flex items-start mt-2">
                    <input 
                      type="checkbox" 
                      id="newsletter" 
                      className="mt-1 mr-2" 
                    />
                    <label htmlFor="newsletter" className="text-sm text-white/80">
                      I'd like to receive email updates about events and news
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full mt-2 bg-white text-wca-purple font-medium py-2 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
        
        {/* Gallery Section */}
        <section id="gallery" className="py-16 lg:py-24 bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm mb-4">
                Gallery
              </div>
              <h2 className="text-3xl font-bold mb-4">Life at {currentLocation.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Take a glimpse into our community life through these images.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentLocation.gallery.map((image: string, index: number) => (
                <div 
                  key={index} 
                  className="rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 h-64 md:h-72 lg:h-80"
                >
                  <img 
                    src={image} 
                    alt={`Gallery image ${index + 1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <Button className="bg-wca-purple hover:bg-wca-violet">
                View More Photos
              </Button>
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-wca-purple to-wca-violet text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Stay Connected</h2>
              <p className="text-white/90 mb-8">
                Subscribe to our newsletter to receive updates about events, resources, and opportunities to get involved with {currentLocation.name}.
              </p>
              
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="px-4 py-3 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                  required
                />
                <button 
                  type="submit"
                  className="bg-white text-wca-violet font-medium px-6 py-3 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
              
              <p className="text-xs text-white/70 mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegionalBranchHome;
