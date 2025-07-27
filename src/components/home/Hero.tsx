
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassPanel } from '../ui/GlassPanels';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-wca-purple/10 via-transparent to-wca-teal/10 opacity-50"></div>
        <div className="absolute top-1/4 right-0 w-72 h-72 bg-wca-purple/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 left-20 w-80 h-80 bg-wca-teal/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-wca-violet/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6 text-center lg:text-left animate-fade-up">
            <div className="inline-block px-3 py-1 rounded-full bg-wca-purple/10 text-wca-purple font-medium text-sm">
              Transforming Lives, Empowering Leaders
            </div>
            <h1 className="font-bold leading-tight">
              <span className="block">Building a Global Network</span>
              <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">
                of Transformative Leaders
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
              Join our mission to rescue the lost, transform lives, and empower effective leaders who will bring positive change to economies, legislatures, and nations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link to="/about" className="button-primary">
                Learn More
                <ArrowRight size={16} className="ml-2" />
              </Link>
              <Link to="/locations" className="button-outline">
                Find a Location
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center animate-fade-in">
            <GlassPanel className="relative overflow-hidden p-4 rounded-2xl w-full max-w-md mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-200 animate-pulse">
                <img 
                  src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                  alt="World Changers Association Community" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 p-2">
                <h3 className="font-semibold text-lg">Join Our Community</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Connect with like-minded individuals dedicated to making a difference in the world.
                </p>
                <Link to="/events" className="inline-flex items-center text-wca-purple font-medium mt-3 text-sm hover:text-wca-violet transition-colors">
                  Upcoming Events <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </GlassPanel>

            {/* Floating elements */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-wca-teal/20 rounded-full filter blur-xl animate-float"></div>
            <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-wca-purple/20 rounded-full filter blur-xl animate-float animation-delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
