import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Phone, Mail, ArrowRight, ChevronLeft, Home } from 'lucide-react';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useRegionalLocations, useRegionalDCGs, useRegionalEvents } from '@/hooks/useRegionalData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import Navbar from '@/components/layout/Navbar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { toast } from "@/hooks/use-toast";

const RegionalBranchHome = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: region, isLoading: regionLoading, error: regionError } = useRegionBySlug(slug || '');
  const { data: locations, isLoading: locationsLoading } = useRegionalLocations(region?.id || '');
  const { data: dcgs, isLoading: dcgsLoading } = useRegionalDCGs(region?.id || '');
  const { data: events, isLoading: eventsLoading } = useRegionalEvents(region?.id || '');

  const [email, setEmail] = useState('');

  // Hero slider images - mobile-optimized vertical images
  const heroImages = [
    {
      url: `https://images.unsplash.com/photo-1507692049790-de58290a4334?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&h=1920&q=80`,
      alt: 'Community worship gathering'
    },
    {
      url: `https://images.unsplash.com/photo-1519491050282-cf00c82424b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&h=1920&q=80`,
      alt: 'Church fellowship'
    },
    {
      url: `https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&h=1920&q=80`,
      alt: 'Community service'
    },
    {
      url: `https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&h=1920&q=80`,
      alt: 'Prayer and worship'
    }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail('');
    }
  };

  if (regionLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="space-y-4 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Loading regional information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (regionError || !region) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-foreground">Region not found</h1>
            <p className="text-muted-foreground">
              The regional branch you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/locations">
              <Button variant="outline">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Locations
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Established', value: region.established_date ? new Date(region.established_date).getFullYear() : '2020' },
    { label: 'DCG Homes', value: dcgs?.length || 0 },
    { label: 'Locations', value: locations?.length || 0 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Full Width with Image Slider */}
      <section className="relative h-screen md:h-screen min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Slider */}
        <Carousel 
          className="absolute inset-0 w-full h-full" 
          opts={{ align: "start", loop: true }}
          plugins={[Autoplay({ delay: 6000 })]}
        >
          <CarouselContent className="h-full -ml-0">
            {heroImages.map((image, index) => (
              <CarouselItem key={index} className="h-full relative pl-0">
                <div className="h-full w-full relative">
                  <img 
                    src={image.url} 
                    alt={image.alt}
                    className="w-full h-full object-cover object-center"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/50"></div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 border-white/30 text-white hover:bg-white/30" />
        </Carousel>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight animate-fade-up drop-shadow-lg">
              {region.name}
            </h1>
            <p className="text-xl md:text-2xl text-white/95 leading-relaxed max-w-3xl mx-auto animate-fade-up drop-shadow-md" style={{animationDelay: '0.2s'}}>
              {region.description || `Welcome to ${region.name}, where faith meets community and purpose drives our mission.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-up" style={{animationDelay: '0.4s'}}>
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg font-semibold shadow-lg">
                Visit Us Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-white/50 text-white hover:bg-white/20 backdrop-blur-sm">
                Explore Events
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center backdrop-blur-sm bg-white/10">
            <div className="w-1 h-3 bg-white/80 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Regional Information Section - Full Width */}
      <section className="py-16 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-2">Regional Information</h2>
              <p className="text-muted-foreground">Get to know our regional branch</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {/* Established Year */}
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {region.established_date ? new Date(region.established_date).getFullYear() : '2020'}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                  Established
                </div>
              </div>

              {/* DCG Homes Count */}
              <div className="text-center p-6 bg-secondary/5 rounded-lg">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div className="text-3xl font-bold text-secondary mb-2">
                  {dcgs?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                  DCG Homes
                </div>
              </div>

              {/* Address */}
              <div className="text-center p-6 bg-accent/5 rounded-lg">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div className="text-sm font-semibold text-foreground mb-2">
                  {region.address || 'Address Available Soon'}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                  Address
                </div>
              </div>

              {/* Contact */}
              <div className="text-center p-6 bg-primary/5 rounded-lg">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1 mb-2">
                  {region.contact_phone && (
                    <div className="text-sm font-semibold text-foreground">
                      {region.contact_phone}
                    </div>
                  )}
                  {region.contact_email && (
                    <div className="text-xs text-muted-foreground">
                      {region.contact_email}
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                  Contact
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Full Width */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
              About Our Community
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {region.description || `Discover the vibrant community of ${region.name}, where faith meets fellowship and purpose drives our mission. We are committed to building strong relationships and making a positive impact in our community through worship, service, and discipleship.`}
            </p>
          </div>
        </div>
      </section>

      {/* Events Section - Full Width */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join us for inspiring gatherings, worship services, and community events
            </p>
          </div>
          
          {eventsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {events.slice(0, 6).map((event, index) => (
                  <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                              {event.name}
                            </h3>
                            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                              {new Date(event.start_datetime).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                          
                          {event.description && (
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>
                                {new Date(event.start_datetime).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                            </div>
                            {event.address && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="truncate">{event.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {events.length > 6 && (
                <div className="text-center">
                  <Button variant="outline" size="lg" className="px-8">
                    View All Events
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Events Scheduled</h3>
                <p className="text-muted-foreground">Check back soon for upcoming events and gatherings.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* DCG Section - Full Width */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Destiny Care Groups
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Connect with others through our intimate small group gatherings designed to foster deep relationships and spiritual growth in a welcoming environment.
            </p>
          </div>
          
          {dcgsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : dcgs && dcgs.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {dcgs.map((dcg) => (
                <Card key={dcg.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-secondary/10 to-accent/10 p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-lg text-foreground group-hover:text-secondary transition-colors">
                            {dcg.name}
                          </h3>
                          <div className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-sm font-semibold">
                            {dcg.member_count} {dcg.member_count === 1 ? 'member' : 'members'}
                          </div>
                        </div>
                        
                        {dcg.meeting_day && dcg.meeting_time && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span className="font-medium">{dcg.meeting_day} at {dcg.meeting_time}</span>
                          </div>
                        )}
                        
                        {dcg.leader && (
                          <div className="flex items-center space-x-3 pt-4 border-t border-border/50">
                            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {dcg.leader ? `${dcg.leader.first_name} ${dcg.leader.last_name}` : 'DCG Leader'}
                              </p>
                              <p className="text-sm text-muted-foreground">Group Leader</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">DCG Information Coming Soon</h3>
                <p className="text-muted-foreground">We're setting up our Destiny Care Groups. Check back soon for updates.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Contact & Info Section - Full Width */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Get in Touch
              </h2>
              <p className="text-lg text-muted-foreground">
                We'd love to connect with you and answer any questions you might have
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <Card className="lg:col-span-2 shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {region.contact_email && (
                      <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                          <p className="font-semibold text-foreground">{region.contact_email}</p>
                        </div>
                      </div>
                    )}
                    {region.contact_phone && (
                      <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                          <p className="font-semibold text-foreground">{region.contact_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {region.address && (
                    <div className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Address</p>
                        <p className="font-semibold text-foreground">{region.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Leadership */}
                  {region.regional_pastor && (
                    <div className="pt-6 border-t">
                      <h3 className="font-semibold text-foreground mb-4">Regional Leadership</h3>
                      <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">{region.regional_pastor}</p>
                          <p className="text-muted-foreground">Regional Pastor</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Stay Connected</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Subscribe to our newsletter for updates on events, community news, and spiritual insights.
                  </p>
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12"
                    />
                    <Button type="submit" className="w-full h-12 font-semibold">
                      Subscribe Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    We respect your privacy and will never spam you.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RegionalBranchHome;