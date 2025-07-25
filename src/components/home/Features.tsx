
import { MapPin, Calendar, Film, BookOpen, Heart, BarChart3, ArrowRight, Smartphone, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../ui/GlassPanels';
import { useIsMobile } from '@/hooks/use-mobile';

const features = [
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "WCA Centers & DCG Homes",
    subtitle: "Find Your Community",
    description: "Find fellowship centers and discipleship group homes near you with detailed information and contact details.",
    link: "/locations",
    color: "wca-purple",
    badge: "50+ Locations"
  },
  {
    icon: <Calendar className="w-6 h-6" />,
    title: "Events Calendar",
    subtitle: "Stay Connected",
    description: "Stay updated with upcoming events, conferences, and gatherings across all locations with easy RSVP.",
    link: "/events",
    color: "wca-violet",
    badge: "Live Events"
  },
  {
    icon: <Film className="w-6 h-6" />,
    title: "Media & Sermons",
    subtitle: "Spiritual Growth",
    description: "Access our library of videos, sermons, and teachings to grow your spiritual life anywhere, anytime.",
    link: "/media",
    color: "wca-teal",
    badge: "HD Quality"
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Store & Library",
    subtitle: "Resources Hub",
    description: "Purchase books, resources, and materials or borrow from our extensive digital and physical library.",
    link: "/store",
    color: "wca-purple",
    badge: "1000+ Items"
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Counseling Services",
    subtitle: "Personal Support",
    description: "Schedule appointments with our trained counselors for spiritual guidance and personal development.",
    link: "/counseling",
    color: "wca-violet",
    badge: "24/7 Support"
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Fundraising Projects",
    subtitle: "Make Impact",
    description: "Support and track our ongoing fundraising projects and initiatives that make a difference worldwide.",
    link: "/fundraising",
    color: "wca-teal",
    badge: "Global Reach"
  }
];

export default function Features() {
  const isMobile = useIsMobile();

  return (
    <section className="relative bg-gradient-to-b from-muted/30 to-background">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 right-10 w-24 h-24 bg-wca-violet/10 rounded-full filter blur-2xl"></div>
        <div className="absolute bottom-1/3 left-10 w-32 h-32 bg-wca-teal/10 rounded-full filter blur-2xl"></div>
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wca-teal/10 border border-wca-teal/20">
            <Smartphone className="w-4 h-4 text-wca-teal" />
            <span className="text-sm font-medium text-wca-teal">Platform Features</span>
          </div>
          
          <h2 className="font-bold">
            Everything You Need <span className="text-gradient">In One Place</span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Explore our comprehensive platform designed to support your spiritual journey, 
            connect with community, and empower your leadership development.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid-auto-fit mb-16">
          {features.map((feature, index) => (
            <GlassCard 
              key={index} 
              className="group relative overflow-hidden p-6 h-full hover:shadow-2xl transition-all duration-300 card-hover"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${feature.color}/20 to-${feature.color}/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`text-${feature.color}`}>
                      {feature.icon}
                    </div>
                  </div>
                  
                  <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${feature.color}/10 text-${feature.color} border border-${feature.color}/20`}>
                    {feature.badge}
                  </span>
                </div>
                
                {/* Content */}
                <div className="space-y-3 flex-grow">
                  <div>
                    <h3 className="text-lg font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{feature.subtitle}</p>
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* CTA */}
                <div className="pt-4 mt-auto">
                  <Link 
                    to={feature.link} 
                    className={`inline-flex items-center gap-2 text-${feature.color} hover:text-${feature.color}/80 font-medium text-sm transition-all duration-300 group/link`}
                  >
                    Explore Feature
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 glass-panel">
            <div className="text-3xl font-bold text-gradient mb-2">50+</div>
            <div className="text-sm text-muted-foreground">Global Regions</div>
          </div>
          <div className="text-center p-6 glass-panel">
            <div className="text-3xl font-bold text-gradient mb-2">24/7</div>
            <div className="text-sm text-muted-foreground">Support Access</div>
          </div>
          <div className="text-center p-6 glass-panel">
            <div className="text-3xl font-bold text-gradient mb-2">1000+</div>
            <div className="text-sm text-muted-foreground">Resources</div>
          </div>
          <div className="text-center p-6 glass-panel">
            <div className="text-3xl font-bold text-gradient mb-2">100%</div>
            <div className="text-sm text-muted-foreground">Mobile Ready</div>
          </div>
        </div>

        {/* Mobile App Showcase */}
        <div className="glass-panel p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Smartphone className="w-6 h-6 text-wca-purple" />
              <span className="font-semibold text-wca-purple">Mobile Optimized</span>
            </div>
            
            <h3 className="text-2xl font-bold">Access Everything on Any Device</h3>
            
            <p className="text-muted-foreground">
              Our platform is fully responsive and optimized for mobile devices, tablets, and desktops. 
              Take your spiritual journey with you wherever you go.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/events" className="button-primary">
                <Calendar className="w-4 h-4 mr-2" />
                View Upcoming Events
              </Link>
              <Link to="/locations" className="button-outline">
                <MapPin className="w-4 h-4 mr-2" />
                Find Locations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
