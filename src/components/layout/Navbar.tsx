
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink = ({ to, children, className, onClick }: NavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        'nav-link', 
        isActive ? 'active' : '',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4',
        scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="container-custom">
        <nav className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold flex items-center gap-2" onClick={closeMenu}>
            <span className="text-gradient bg-gradient-to-r from-wca-purple to-wca-violet bg-clip-text text-transparent">WCA</span>
            <span className="hidden lg:inline">World Changers Association</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/locations">Locations</NavLink>
            <NavLink to="/events">Events</NavLink>
            
            <div className="relative group">
              <button 
                className="nav-link flex items-center gap-1"
                onClick={toggleResources}
              >
                Resources {resourcesOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <div className={cn(
                "absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-950 rounded-md shadow-lg overflow-hidden transition-all duration-200 origin-top",
                resourcesOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
              )}>
                <div className="py-2">
                  <Link 
                    to="/media" 
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMenu}
                  >
                    Media & Sermons
                  </Link>
                  <Link 
                    to="/store" 
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMenu}
                  >
                    Store/Library
                  </Link>
                  <Link 
                    to="/blog" 
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMenu}
                  >
                    News & Blog
                  </Link>
                  <Link 
                    to="/counseling" 
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMenu}
                  >
                    Counseling
                  </Link>
                  <Link 
                    to="/fundraising" 
                    className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMenu}
                  >
                    Fundraising
                  </Link>
                </div>
              </div>
            </div>
            
            <Link to="/contact" className="button-primary">
              Contact Us
            </Link>
          </div>
          
          {/* Mobile Navigation Toggle */}
          <button 
            className="block md:hidden text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>
      
      {/* Mobile Navigation Menu */}
      <div className={cn(
        "fixed inset-0 bg-background pt-20 z-40 transition-transform duration-300 ease-in-out md:hidden",
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="container-custom flex flex-col gap-6 py-8">
          <NavLink to="/" className="text-xl" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" className="text-xl" onClick={closeMenu}>About</NavLink>
          <NavLink to="/locations" className="text-xl" onClick={closeMenu}>Locations</NavLink>
          <NavLink to="/events" className="text-xl" onClick={closeMenu}>Events</NavLink>
          
          <div>
            <button 
              onClick={toggleResources}
              className="flex items-center justify-between w-full text-xl mb-2"
            >
              Resources
              {resourcesOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            <div className={cn(
              "space-y-4 pl-4 transition-all duration-200",
              resourcesOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
            )}>
              <Link to="/media" className="block text-lg" onClick={closeMenu}>Media & Sermons</Link>
              <Link to="/store" className="block text-lg" onClick={closeMenu}>Store/Library</Link>
              <Link to="/blog" className="block text-lg" onClick={closeMenu}>News & Blog</Link>
              <Link to="/counseling" className="block text-lg" onClick={closeMenu}>Counseling</Link>
              <Link to="/fundraising" className="block text-lg" onClick={closeMenu}>Fundraising</Link>
            </div>
          </div>
          
          <Link 
            to="/contact"
            className="button-primary w-full mt-4 text-center"
            onClick={closeMenu}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </header>
  );
}
