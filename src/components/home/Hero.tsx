
import { ArrowRight, Play, Users, Globe, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '../ui/GlassPanels';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Hero() {
  const isMobile = useIsMobile();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-wca-purple/5 via-transparent to-wca-teal/5"></div>
        
        {/* Animated Blobs */}
        <div className="absolute top-20 right-10 w-32 h-32 md:w-48 md:h-48 lg:w-72 lg:h-72 bg-gradient-to-br from-wca-purple/20 to-wca-violet/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 md:w-60 md:h-60 lg:w-80 lg:h-80 bg-gradient-to-br from-wca-teal/20 to-wca-purple/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 lg:w-64 lg:h-64 bg-gradient-to-br from-wca-violet/15 to-wca-teal/15 rounded-full filter blur-3xl animate-pulse-slow"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      <div className="container-custom relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-wca-purple/10 to-wca-violet/10 border border-wca-purple/20 backdrop-blur-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-wca-purple to-wca-violet rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gradient">Transforming Lives, Empowering Leaders</span>
            </div>
            
            {/* Heading */}
            <div className="space-y-4">
              <h1 className="font-bold leading-tight tracking-tight">
                <span className="block">Building a Global Network</span>
                <span className="text-gradient">
                  of Transformative Leaders
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Join our mission to rescue the lost, transform lives, and empower effective leaders who will bring positive change to economies, legislatures, and nations.
              </p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 py-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-5 h-5 text-wca-purple" />
                <span className="font-semibold">50+ Regions</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-5 h-5 text-wca-violet" />
                <span className="font-semibold">Global Network</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-5 h-5 text-wca-teal" />
                <span className="font-semibold">Lives Transformed</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link to="/about" className="button-primary group">
                Learn More
                <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/locations" className="button-outline">
                Find a Location
              </Link>
            </div>
          </div>

          {/* Hero Media */}
          <div className="lg:col-span-5 relative">
            <div className="relative max-w-lg mx-auto">
              {/* Main Card */}
              <GlassPanel className="relative overflow-hidden p-6 space-y-4">
                {/* Video/Image Container */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <img 
                    src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                    alt="World Changers Association Community" 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-300 hover:scale-110">
                      <Play className="w-6 h-6 text-wca-purple ml-1" fill="currentColor" />
                    </button>
                  </div>
                </div>
                
                {/* Card Content */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Join Our Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with like-minded individuals dedicated to making a difference in the world.
                  </p>
                  <Link 
                    to="/events" 
                    className="inline-flex items-center text-wca-purple font-medium text-sm hover:text-wca-violet transition-colors group"
                  >
                    Upcoming Events 
                    <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </GlassPanel>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-wca-teal/30 to-wca-purple/30 rounded-full filter blur-xl animate-float"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-wca-purple/30 to-wca-violet/30 rounded-full filter blur-xl animate-float"></div>
              
              {/* Stats Badges */}
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <div className="glass-panel p-3 text-center">
                  <div className="text-2xl font-bold text-gradient">50+</div>
                  <div className="text-xs text-muted-foreground">Regions</div>
                </div>
              </div>
              
              <div className="absolute -right-4 bottom-1/4 hidden lg:block">
                <div className="glass-panel p-3 text-center">
                  <div className="text-2xl font-bold text-gradient">24/7</div>
                  <div className="text-xs text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
