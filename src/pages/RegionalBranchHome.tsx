import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Phone, Mail, ArrowRight, ChevronLeft, Home } from 'lucide-react';
import { useRegionBySlug } from '@/hooks/useRegionBySlug';
import { useRegionalLocations, useRegionalDCGs, useRegionalEvents } from '@/hooks/useRegionalData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/layout/Navbar';
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
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <span>/</span>
            <Link to="/locations" className="hover:text-foreground transition-colors">Locations</Link>
            <span>/</span>
            <span className="text-foreground">{region.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {region.name}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {region.description || `Welcome to ${region.name}, where faith meets community and purpose drives our mission.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8">
                Visit Us
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="px-8">
                View Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">About Our Community</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {region.description || `Discover the vibrant community of ${region.name}, where faith meets fellowship and purpose drives our mission. We are committed to building strong relationships and making a positive impact in our community.`}
                </p>
              </div>
            </section>

            {/* Events Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Upcoming Events</h2>
              
              {eventsLoading ? (
                <div className="space-y-4">
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
                <div className="space-y-4">
                  {events.slice(0, 3).map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg">{event.name}</h3>
                          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                            {new Date(event.start_datetime).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        {event.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(event.start_datetime).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                          {event.address && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span className="truncate">{event.address}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {events.length > 3 && (
                    <Button variant="outline" className="w-full">
                      View All Events
                    </Button>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No upcoming events at this time.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* DCG Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Destiny Care Groups</h2>
              <p className="text-muted-foreground mb-6">
                Connect with others through our intimate small group gatherings designed to foster deep relationships and spiritual growth.
              </p>
              
              {dcgsLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : dcgs && dcgs.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {dcgs.slice(0, 4).map((dcg) => (
                    <Card key={dcg.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold">{dcg.name}</h3>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {dcg.member_count} {dcg.member_count === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                        
                        {dcg.meeting_day && dcg.meeting_time && (
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
                            <Clock className="w-4 h-4" />
                            <span>{dcg.meeting_day} at {dcg.meeting_time}</span>
                          </div>
                        )}
                        
                        {dcg.leader && (
                          <div className="flex items-center space-x-2 pt-3 border-t">
                            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                              <Users className="w-3 h-3 text-primary" />
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">
                                {dcg.leader ? `${dcg.leader.first_name} ${dcg.leader.last_name}` : 'DCG Leader'}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">DCG information will be available soon.</p>
                  </CardContent>
                </Card>
              )}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {region.contact_email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{region.contact_email}</p>
                    </div>
                  </div>
                )}
                {region.contact_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{region.contact_phone}</p>
                    </div>
                  </div>
                )}
                {region.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{region.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leadership Card */}
            {region.regional_pastor && (
              <Card>
                <CardHeader>
                  <CardTitle>Leadership</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{region.regional_pastor}</p>
                      <p className="text-sm text-muted-foreground">Regional Pastor</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Newsletter Signup */}
            <Card>
              <CardHeader>
                <CardTitle>Stay Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to our newsletter for updates on events and community news.
                </p>
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="w-full">
                    Subscribe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegionalBranchHome;