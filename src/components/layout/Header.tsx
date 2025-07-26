import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Phone, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  return (
    <header className="bg-background border-b sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-xl text-foreground">WCA</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/locations" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Locations
            </Link>
            <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Events
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              About
            </Link>
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
              Visit Us
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
                    <Link 
                      to="/" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                      Home
                    </Link>
                    <Link 
                      to="/locations" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                      Locations
                    </Link>
                    <Link 
                      to="/events" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                      Events
                    </Link>
                    <Link 
                      to="/about" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                      About
                    </Link>
                  </nav>

                  {/* Contact Information */}
                  <div className="space-y-4 pt-4">
                    <h3 className="font-semibold text-foreground">Contact Us</h3>
                    <div className="space-y-3">
                      <a 
                        href="tel:+1234567890" 
                        className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                        <span>+1 (234) 567-890</span>
                      </a>
                      <a 
                        href="mailto:info@wca.org" 
                        className="flex items-center space-x-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        <span>info@wca.org</span>
                      </a>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4">
                    <Button className="w-full">
                      Visit Us
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;