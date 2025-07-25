import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Phone, Mail, Star, ArrowRight, Heart } from 'lucide-react';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useRegionalLocations, useRegionalDCGs, useRegionalEvents } from '@/hooks/useRegionalData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/hooks/use-toast";

const RegionalBranchHome = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: region, isLoading: regionLoading, error: regionError } = useRegionBySlug(slug || '');
  const { data: locations, isLoading: locationsLoading } = useRegionalLocations(region?.id || '');
  const { data: dcgs, isLoading: dcgsLoading } = useRegionalDCGs(region?.id || '');
  const { data: events, isLoading: eventsLoading } = useRegionalEvents(region?.id || '');

  const [activeSection, setActiveSection] = useState('about');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleSubscribe = (email: string) => {
    toast({
      title: "Successfully subscribed!",
      description: "Thank you for subscribing to our newsletter.",
    });
  };

  if (regionLoading) {
    return (
      <div className="min-h-screen bg-soft-gradient">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse space-y-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto animate-glow"></div>
            <div className="text-fluid-lg text-muted-foreground">Loading regional information...</div>
          </div>
        </div>
      </div>
    );
  }

  if (regionError || !region) {
    return (
      <div className="min-h-screen bg-soft-gradient flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-fluid-2xl font-semibold text-foreground">Region not found</div>
          <div className="text-fluid-base text-muted-foreground">
            The regional branch you're looking for doesn't exist or has been moved.
          </div>
        </div>
      </div>
    );
  }

  const mainLocation = locations?.find(loc => loc.is_featured) || locations?.[0];

  return (
    <div className="min-h-screen bg-soft-gradient">
      <Navbar />
      
      {/* Floating Navigation */}
      <nav className={`nav-floating transition-all duration-500 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center space-x-2">
          {['about', 'events', 'dcg-homes', 'visit'].map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className={`nav-pill ${activeSection === section ? 'active' : ''}`}
            >
              {section === 'about' && 'About'}
              {section === 'events' && 'Events'}
              {section === 'dcg-homes' && 'DCG Homes'}
              {section === 'visit' && 'Plan Your Visit'}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-hero-pattern overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/20 rounded-full animate-float blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full animate-float blur-xl" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary/20 rounded-full animate-float blur-xl" style={{ animationDelay: '4s' }}></div>

        <div className="container-custom relative z-10 text-center">
          <div className="glass-panel-soft p-12 md:p-16 animate-fade-in-up">
            <h1 className="text-fluid-4xl font-bold text-white mb-6 leading-tight">
              Welcome to {region.name}
            </h1>
            <p className="text-fluid-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience faith, community, and purpose in our vibrant regional community. 
              Join us as we build lasting relationships and make a difference together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => scrollToSection('visit')} 
                className="btn-soft group"
              >
                Plan Your Visit
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('events')} 
                className="btn-soft-outline"
              >
                Upcoming Events
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative">
        <div className="container-custom">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-fluid-3xl font-bold text-foreground mb-6">About Our Community</h2>
            <p className="text-fluid-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {region.description || `Discover the vibrant community of ${region.name}, where faith meets fellowship and purpose drives our mission.`}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="card-soft text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-fluid-xl font-semibold mb-4">Established</h3>
              <p className="text-fluid-lg text-primary font-bold">
                {region.established_date ? new Date(region.established_date).getFullYear() : '2020'}
              </p>
            </div>

            <div className="card-soft text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-fluid-xl font-semibold mb-4">DCG Homes</h3>
              <p className="text-fluid-lg text-secondary font-bold">{dcgs?.length || 0}</p>
            </div>

            <div className="card-soft text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-fluid-xl font-semibold mb-4">Locations</h3>
              <p className="text-fluid-lg text-accent font-bold">{locations?.length || 0}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card-soft">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-fluid-2xl font-semibold mb-6 text-foreground">Get In Touch</h3>
                <div className="space-y-6">
                  {region.contact_email && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-fluid-sm text-muted-foreground">Email</p>
                        <p className="text-fluid-base font-medium">{region.contact_email}</p>
                      </div>
                    </div>
                  )}
                  {region.contact_phone && (
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                        <Phone className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-fluid-sm text-muted-foreground">Phone</p>
                        <p className="text-fluid-base font-medium">{region.contact_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {region.regional_pastor && (
                <div>
                  <h3 className="text-fluid-2xl font-semibold mb-6 text-foreground">Leadership</h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <p className="text-fluid-base font-semibold">{region.regional_pastor}</p>
                      <p className="text-fluid-sm text-muted-foreground">Regional Pastor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-fluid-3xl font-bold text-foreground mb-6">Upcoming Events</h2>
            <p className="text-fluid-lg text-muted-foreground max-w-3xl mx-auto">
              Join us for meaningful gatherings that strengthen our community and deepen our faith.
            </p>
          </div>

          {eventsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-soft animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <div key={event.id} className="card-soft group">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="px-3 py-1 rounded-full text-fluid-xs">
                      {new Date(event.start_date || event.date || new Date()).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Badge>
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-fluid-lg font-semibold mb-3 group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  
                  {event.description && (
                    <p className="text-fluid-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-fluid-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(event.start_date || event.date || new Date()).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </span>
                    </div>
                    {event.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{event.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-fluid-base text-muted-foreground">No upcoming events at this time.</p>
            </div>
          )}
        </div>
      </section>

      {/* DCG Homes Section */}
      <section id="dcg-homes" className="py-20">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-fluid-3xl font-bold text-foreground mb-6">Destiny Care Groups</h2>
            <p className="text-fluid-lg text-muted-foreground max-w-3xl mx-auto">
              Connect with others through our intimate small group gatherings designed to foster deep relationships and spiritual growth.
            </p>
          </div>

          {dcgsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-soft animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : dcgs && dcgs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {dcgs.map((dcg) => (
                <div key={dcg.id} className="card-soft group">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="outline" className="px-3 py-1 rounded-full text-fluid-xs">
                      {dcg.member_count} {dcg.member_count === 1 ? 'member' : 'members'}
                    </Badge>
                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 text-secondary" />
                    </div>
                  </div>
                  
                  <h3 className="text-fluid-lg font-semibold mb-3 group-hover:text-secondary transition-colors">
                    {dcg.name}
                  </h3>
                  
                  {dcg.meeting_time && (
                    <div className="flex items-center space-x-2 text-fluid-sm text-muted-foreground mb-3">
                      <Clock className="w-4 h-4" />
                      <span>{dcg.meeting_time}</span>
                    </div>
                  )}
                  
                  {dcg.leader && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-border/50">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-fluid-sm font-medium">{dcg.leader ? `${dcg.leader.first_name} ${dcg.leader.last_name}` : 'DCG Leader'}</p>
                        <p className="text-fluid-xs text-muted-foreground">Group Leader</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-fluid-base text-muted-foreground">DCG information will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Plan Your Visit Section */}
      <section id="visit" className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-fluid-3xl font-bold text-foreground mb-6">Plan Your Visit</h2>
            <p className="text-fluid-lg text-muted-foreground max-w-3xl mx-auto">
              We'd love to welcome you to our community. Here's everything you need to know for your first visit.
            </p>
          </div>

          {mainLocation ? (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="card-soft">
                <h3 className="text-fluid-2xl font-semibold mb-6 text-foreground">Main Center</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mt-1">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-fluid-base font-medium mb-1">{mainLocation.name}</p>
                      <p className="text-fluid-sm text-muted-foreground">{mainLocation.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mt-1">
                      <Clock className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-fluid-base font-medium mb-1">Service Hours</p>
                      <p className="text-fluid-sm text-muted-foreground">Sunday Services & Weekly Activities</p>
                    </div>
                  </div>

                  {mainLocation.contact_phone && (
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mt-1">
                        <Phone className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <p className="text-fluid-base font-medium mb-1">Contact</p>
                        <p className="text-fluid-sm text-muted-foreground">{mainLocation.contact_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-soft">
                <h3 className="text-fluid-2xl font-semibold mb-6 text-foreground">What to Expect</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3"></div>
                    <p className="text-fluid-base text-muted-foreground">
                      Friendly welcomers will greet you at the door
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-3"></div>
                    <p className="text-fluid-base text-muted-foreground">
                      Casual dress code - come as you are
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-accent rounded-full mt-3"></div>
                    <p className="text-fluid-base text-muted-foreground">
                      Inspiring worship and practical teaching
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3"></div>
                    <p className="text-fluid-base text-muted-foreground">
                      Opportunities to connect with others
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <button className="btn-soft w-full">
                    Get Directions
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-fluid-base text-muted-foreground">Location information will be available soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="card-soft text-center max-w-2xl mx-auto">
            <h3 className="text-fluid-2xl font-semibold mb-4 text-foreground">Stay Connected</h3>
            <p className="text-fluid-base text-muted-foreground mb-8">
              Get the latest updates on events, sermons, and community news delivered to your inbox.
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const email = formData.get('email') as string;
                if (email) handleSubscribe(email);
              }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
              <Button type="submit" className="btn-soft px-8 py-4 text-base">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegionalBranchHome;