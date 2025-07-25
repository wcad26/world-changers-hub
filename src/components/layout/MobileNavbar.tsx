import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home, MapPin, Calendar, Users, BookOpen, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink = ({ to, children, icon, className, onClick }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 touch-target',
        isActive 
          ? 'bg-gradient-to-r from-wca-purple to-wca-violet text-white shadow-lg' 
          : 'text-foreground/80 hover:text-foreground hover:bg-muted',
        className
      )}
      onClick={onClick}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </Link>
  );
};

export default function MobileNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setResourcesOpen(false);
  };

  const toggleResources = () => {
    setResourcesOpen(!resourcesOpen);
  };

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled 
          ? 'bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-border/50 py-2' 
          : 'bg-transparent py-4'
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 touch-target" 
            onClick={closeMenu}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wca-purple to-wca-violet flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gradient font-bold text-lg leading-none">WCA</span>
                {!isMobile && (
                  <span className="text-xs text-muted-foreground leading-none">World Changers</span>
                )}
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <NavLink to="/" icon={<Home size={16} />}>Home</NavLink>
            <NavLink to="/about" icon={<Users size={16} />}>About</NavLink>
            <NavLink to="/locations" icon={<MapPin size={16} />}>Locations</NavLink>
            <NavLink to="/events" icon={<Calendar size={16} />}>Events</NavLink>
            
            <div className="relative">
              <button 
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 touch-target",
                  "text-foreground/80 hover:text-foreground hover:bg-muted"
                )}
                onClick={toggleResources}
              >
                <BookOpen size={16} />
                Resources 
                <ChevronDown 
                  size={16} 
                  className={cn("transition-transform", resourcesOpen && "rotate-180")} 
                />
              </button>
              
              <div className={cn(
                "absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-950 rounded-xl shadow-xl border border-border overflow-hidden transition-all duration-300 origin-top",
                resourcesOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
              )}>
                <div className="p-2">
                  <Link 
                    to="/media" 
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Media & Sermons
                  </Link>
                  <Link 
                    to="/store" 
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Store/Library
                  </Link>
                  <Link 
                    to="/blog" 
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    News & Blog
                  </Link>
                  <Link 
                    to="/counseling" 
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Counseling
                  </Link>
                  <Link 
                    to="/fundraising" 
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Fundraising
                  </Link>
                </div>
              </div>
            </div>
            
            <Link to="/contact" className="button-primary">
              <Phone size={16} className="mr-2" />
              Contact
            </Link>
          </div>
          
          {/* Mobile Navigation Toggle */}
          <button 
            className="flex lg:hidden text-foreground touch-target"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>
      
      {/* Mobile Navigation Menu */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-in-out",
        isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={closeMenu}
        />
        
        {/* Menu Panel */}
        <div className={cn(
          "absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background border-l border-border transform transition-transform duration-300 ease-in-out",
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wca-purple to-wca-violet flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gradient font-bold">WCA</span>
                <span className="text-xs text-muted-foreground">World Changers</span>
              </div>
            </div>
            
            <button 
              onClick={closeMenu}
              className="text-foreground touch-target"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          
          {/* Menu Content */}
          <div className="flex flex-col p-4 space-y-2 overflow-y-auto">
            <NavLink to="/" icon={<Home size={20} />} onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/about" icon={<Users size={20} />} onClick={closeMenu}>
              About
            </NavLink>
            <NavLink to="/locations" icon={<MapPin size={20} />} onClick={closeMenu}>
              Locations
            </NavLink>
            <NavLink to="/events" icon={<Calendar size={20} />} onClick={closeMenu}>
              Events
            </NavLink>
            
            {/* Resources Accordion */}
            <div className="space-y-2">
              <button 
                onClick={toggleResources}
                className="flex items-center justify-between w-full px-4 py-3 text-left font-medium rounded-xl transition-colors hover:bg-muted touch-target"
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={20} />
                  <span>Resources</span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={cn("transition-transform", resourcesOpen && "rotate-180")} 
                />
              </button>
              
              <div className={cn(
                "space-y-1 transition-all duration-300 overflow-hidden",
                resourcesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}>
                <div className="pl-4 space-y-1">
                  <Link 
                    to="/media" 
                    className="block px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Media & Sermons
                  </Link>
                  <Link 
                    to="/store" 
                    className="block px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Store/Library
                  </Link>
                  <Link 
                    to="/blog" 
                    className="block px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    News & Blog
                  </Link>
                  <Link 
                    to="/counseling" 
                    className="block px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Counseling
                  </Link>
                  <Link 
                    to="/fundraising" 
                    className="block px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    Fundraising
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border mt-4">
              <Link 
                to="/contact"
                className="button-primary w-full justify-center"
                onClick={closeMenu}
              >
                <Phone size={16} className="mr-2" />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}