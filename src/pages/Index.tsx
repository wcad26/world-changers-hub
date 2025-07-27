
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import Mission from '@/components/home/Mission';
import Features from '@/components/home/Features';
import { ArrowRight, MapPin, Calendar, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassPanels';
import { useHomepageContent } from '@/hooks/useHomepageContent';

const upcomingEvents = [
  {
    id: 1,
    title: "Leadership Conference 2023",
    date: "December 15-17, 2023",
    location: "Main Center, City",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  },
  {
    id: 2,
    title: "Youth Empowerment Workshop",
    date: "January 5, 2024",
    location: "East Branch, Downtown",
    image: "https://images.unsplash.com/photo-1536337005238-94b997371b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80"
  },
  {
    id: 3,
    title: "Community Outreach Program",
    date: "January 20, 2024",
    location: "Various Locations",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
  }
];

const testimonials = [
  {
    id: 1,
    quote: "The leadership training I received at WCA transformed not just my career, but my entire approach to life and service.",
    author: "Michael Johnson",
    role: "Business Leader"
  },
  {
    id: 2,
    quote: "Finding WCA was a turning point in my spiritual journey. The community here has become like family to me.",
    author: "Sarah Williams",
    role: "Community Member"
  },
  {
    id: 3,
    quote: "The mentorship program equipped me with the tools I needed to make a real difference in my community.",
    author: "David Chen",
    role: "Social Entrepreneur"
  }
];

const Index = () => {
  const { data: contentData } = useHomepageContent();
  const homepageData = contentData?.content as any;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <Mission />
        <Features />
        
        {/* Upcoming Events Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
              <div>
                <h2 className="font-bold text-center md:text-left">
                  <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                    {homepageData?.events?.title || 'Upcoming Events'}
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-center md:text-left">
                  {homepageData?.events?.description || 'Join us at our upcoming events and be part of our growing community.'}
                </p>
              </div>
              <Link to="/events" className="button-outline mt-4 md:mt-0">
                View All Events
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(homepageData?.events?.events || upcomingEvents).map((event: any) => (
                <GlassCard key={event.id} className="overflow-hidden">
                  <div className="h-48 relative overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-xl mb-2">{event.title}</h3>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
                      <Calendar size={16} className="mr-2 text-wca-purple" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <MapPin size={16} className="mr-2 text-wca-purple" />
                      <span className="text-sm">{event.location}</span>
                    </div>
                    <Link 
                      to={`/events/${event.id}`} 
                      className="block w-full text-center button-primary mt-4"
                    >
                      Learn More
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container-custom">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-block px-3 py-1 rounded-full bg-wca-teal/10 text-wca-teal font-medium text-sm mb-4">
                Testimonials
              </div>
              <h2 className="font-bold">
                <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                  {homepageData?.testimonials?.title || 'Stories of Transformation'}
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                {homepageData?.testimonials?.description || 'Hear from members of our community whose lives have been changed through our programs and fellowships.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(homepageData?.testimonials?.testimonials || testimonials).map((testimonial: any) => (
                <GlassCard key={testimonial.id} className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="text-4xl text-wca-purple">"</div>
                  </div>
                  <p className="text-center text-gray-600 dark:text-gray-300 italic mb-6">
                    {testimonial.quote}
                  </p>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-wca-purple to-wca-violet rounded-full mb-3"></div>
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-br from-wca-purple to-wca-violet">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto text-center text-white">
              <Bell size={40} className="mx-auto mb-8 animate-float" />
              <h2 className="font-bold mb-4">
                {homepageData?.newsletter?.title || 'Stay Updated With WCA'}
              </h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                {homepageData?.newsletter?.description || 'Subscribe to our newsletter to receive updates about events, resources, and opportunities to get involved.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder={homepageData?.newsletter?.placeholder || 'Enter your email'}
                  className="px-4 py-3 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                />
                <input 
                  type="tel" 
                  placeholder="Phone number"
                  className="px-4 py-3 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                />
                <button className="bg-white text-wca-violet font-medium px-6 py-3 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap">
                  {homepageData?.newsletter?.buttonText || 'Subscribe'}
                </button>
              </div>
              <p className="text-xs text-white/70 mt-4">
                {homepageData?.newsletter?.disclaimer || 'We respect your privacy. Unsubscribe at any time.'}
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
