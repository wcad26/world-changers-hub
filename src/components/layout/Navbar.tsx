import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Phone, Mail, X, ChevronDown, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useLanguage } from '@/hooks/useLanguage';
const Navbar = () => {
  const location = useLocation();
  const isHomepage = location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage } = useLanguage();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return <header className={`sticky top-0 z-50 backdrop-blur-sm transition-all duration-300 ${isHomepage ? isScrolled ? 'bg-white border-b' : 'bg-transparent border-transparent' : 'bg-background border-b bg-background/95'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center">
            <img src="/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png" alt="World Changers Association" className="h-10 w-auto" />
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {language === 'fr' ? 'Accueil' : 'Home'}
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {language === 'fr' ? 'À propos' : 'About Us'}
            </Link>
            <Link to="/locations" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {language === 'fr' ? 'Emplacements' : 'Locations'}
            </Link>
            <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              {language === 'fr' ? 'Événements' : 'Events'}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors font-medium p-0 h-auto">
                  {language === 'fr' ? 'Ressources' : 'Resources'} <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border shadow-lg">
                <DropdownMenuItem asChild>
                  <Link to="/media" className="w-full">{language === 'fr' ? 'Médias et sermons' : 'Media & Sermons'}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/store" className="w-full">{language === 'fr' ? 'Boutique/Bibliothèque' : 'Store/Library'}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/blog" className="w-full">{language === 'fr' ? 'Actualités et blog' : 'News & Blog'}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/counseling" className="w-full">{language === 'fr' ? 'Conseil' : 'Counselling'}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/fundraising" className="w-full">{language === 'fr' ? 'Collecte de fonds' : 'Fundraising'}</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Contact Info & Actions */}
          <div className="flex items-center space-x-4">
            {/* Contact Icons - Hidden on small screens */}
            <div className="hidden lg:flex items-center space-x-3">
              <a href="tel:+1234567890" className="text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
              </a>
              <a href="mailto:info@wca.org" className="text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>

            {/* CTA Button */}
            <Button size="sm" className="hidden sm:inline-flex">
              {language === 'fr' ? 'Visitez-nous' : 'Visit Us'}
            </Button>

            {/* Mobile Menu Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-6">
                  {/* Navigation Links */}
                  <nav className="flex flex-col space-y-4">
                    <Link to="/" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50">
                      {language === 'fr' ? 'Accueil' : 'Home'}
                    </Link>
                    <Link to="/about" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50">
                      {language === 'fr' ? 'À propos' : 'About Us'}
                    </Link>
                    <Link to="/locations" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50">
                      {language === 'fr' ? 'Emplacements' : 'Locations'}
                    </Link>
                    <Link to="/events" className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50">
                      {language === 'fr' ? 'Événements' : 'Events'}
                    </Link>
                    
                    {/* Resources Section - Collapsible */}
                    <Collapsible className="border-b border-border/50">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center justify-between w-full py-2 text-left">
                          <h4 className="text-lg font-medium text-foreground">{language === 'fr' ? 'Ressources' : 'Resources'}</h4>
                          <ChevronDown className="h-5 w-5 transition-transform duration-200 data-[state=open]:rotate-180" />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pb-2">
                        <div className="flex flex-col space-y-2 pl-4 pt-2">
                          <Link to="/media" className="text-base text-muted-foreground hover:text-primary transition-colors py-1">
                            {language === 'fr' ? 'Médias et sermons' : 'Media & Sermons'}
                          </Link>
                          <Link to="/store" className="text-base text-muted-foreground hover:text-primary transition-colors py-1">
                            {language === 'fr' ? 'Boutique/Bibliothèque' : 'Store/Library'}
                          </Link>
                          <Link to="/blog" className="text-base text-muted-foreground hover:text-primary transition-colors py-1">
                            {language === 'fr' ? 'Actualités et blog' : 'News & Blog'}
                          </Link>
                          <Link to="/counseling" className="text-base text-muted-foreground hover:text-primary transition-colors py-1">
                            {language === 'fr' ? 'Conseil' : 'Counselling'}
                          </Link>
                          <Link to="/fundraising" className="text-base text-muted-foreground hover:text-primary transition-colors py-1">
                            {language === 'fr' ? 'Collecte de fonds' : 'Fundraising'}
                          </Link>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Language Selector */}
                    <div className="py-4 border-b border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Languages className="h-5 w-5 text-foreground" />
                        <h4 className="text-lg font-medium text-foreground">{language === 'fr' ? 'Langue' : 'Language'}</h4>
                      </div>
                      <div className="flex gap-2 pl-4">
                        <Button
                          variant={language === 'en' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLanguage('en')}
                          className="flex-1"
                        >
                          English
                        </Button>
                        <Button
                          variant={language === 'fr' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setLanguage('fr')}
                          className="flex-1"
                        >
                          Français
                        </Button>
                      </div>
                    </div>
                  </nav>

                  {/* Contact Information */}
                  <div className="space-y-4 pt-4">
                    <h3 className="font-semibold text-foreground">{language === 'fr' ? 'Nous contacter' : 'Contact Us'}</h3>
                    <div className="space-y-3">
                      <a href="tel:+23767568130" className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors">
                        <Phone className="w-5 h-5" />
                        <span>+237 690 63 48 60</span>
                      </a>
                      <a href="mailto:info@wcaglobal.org" className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="w-5 h-5" />
                        <span>info@wcaglobal.org</span>
                      </a>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    <Button className="w-full">
                      {language === 'fr' ? 'Visitez-nous' : 'Visit Us'}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>;
};
export default Navbar;