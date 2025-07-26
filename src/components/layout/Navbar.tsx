
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Phone, Mail, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  return (
    <header className="bg-background border-b sticky top-0 z-50 backdrop-blur-sm bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png" 
              alt="World Changers Association" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              About Us
            </Link>
            <Link to="/locations" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Locations
            </Link>
            <Link to="/events" className="text-muted-foreground hover:text-primary transition-colors font-medium">
              Events
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors font-medium p-0 h-auto">
                  Resources <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background border shadow-lg">
                <DropdownMenuItem asChild>
                  <Link to="/media" className="w-full">Media & Sermons</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/store" className="w-full">Store/Library</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/blog" className="w-full">News & Blog</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/counseling" className="w-full">Counselling</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/fundraising" className="w-full">Fundraising</Link>
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
                      to="/about" 
                      className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/50"
                    >
                      About Us
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
                    
                    {/* Resources Section */}
                    <div className="py-2 border-b border-border/50">
                      <h4 className="text-lg font-medium text-foreground mb-3">Resources</h4>
                      <div className="flex flex-col space-y-2 pl-4">
                        <Link 
                          to="/media" 
                          className="text-base text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          Media & Sermons
                        </Link>
                        <Link 
                          to="/store" 
                          className="text-base text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          Store/Library
                        </Link>
                        <Link 
                          to="/blog" 
                          className="text-base text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          News & Blog
                        </Link>
                        <Link 
                          to="/counseling" 
                          className="text-base text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          Counselling
                        </Link>
                        <Link 
                          to="/fundraising" 
                          className="text-base text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          Fundraising
                        </Link>
                      </div>
                    </div>
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

export default Navbar;
