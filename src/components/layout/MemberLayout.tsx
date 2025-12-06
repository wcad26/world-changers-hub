import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Calendar, BarChart3, Users, DollarSign, Heart, Play, MessageCircle, ShoppingBag, LogOut, PanelLeftClose, PanelLeftOpen, Menu, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MemberLayoutProps {
  children: React.ReactNode;
}

// Page info with custom titles and icons for header
const pageInfo: Record<string, { title: string; icon: LucideIcon }> = {
  '/member/dashboard': { title: 'Member Portal', icon: Home },
  '/member/events': { title: 'My Events', icon: Calendar },
  '/member/finances': { title: 'My Giving', icon: DollarSign },
  '/member/discipleship': { title: 'My Discipleship Journey', icon: BookOpen },
  '/member/attendance': { title: 'My Attendance', icon: BarChart3 },
  '/member/fundraising': { title: 'Fundraising', icon: Heart },
  '/member/media': { title: 'Media', icon: Play },
  '/member/counseling': { title: 'Counseling', icon: MessageCircle },
  '/member/store': { title: 'Store', icon: ShoppingBag },
  '/member/profile': { title: 'My Profile', icon: User },
};

const navigation = [{
  name: 'Dashboard',
  href: '/member/dashboard',
  icon: Home
}, {
  name: 'Events',
  href: '/member/events',
  icon: Calendar
}, {
  name: 'Finances',
  href: '/member/finances',
  icon: DollarSign
}, {
  name: 'Discipleship',
  href: '/member/discipleship',
  icon: Users
}];
const secondaryNavigation = [{
  name: 'Attendance',
  href: '/member/attendance',
  icon: BarChart3
}, {
  name: 'Fundraising',
  href: '/member/fundraising',
  icon: Heart
}, {
  name: 'Media',
  href: '/member/media',
  icon: Play
}, {
  name: 'Counseling',
  href: '/member/counseling',
  icon: MessageCircle
}, {
  name: 'Store',
  href: '/member/store',
  icon: ShoppingBag
}, {
  name: 'Profile',
  href: '/member/profile',
  icon: User
}];
export default function MemberLayout({
  children
}: MemberLayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const location = useLocation();
  const {
    signOut,
    profile
  } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use mobile layout for both mobile and tablet views
  const useMobileLayout = isMobile || isTablet;
  
  if (!useMobileLayout) {
    // Desktop layout with sidebar
    return <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <div className={cn("bg-card border-r border-border flex flex-col transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className={cn("transition-opacity duration-300", isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
              <h2 className="text-xl font-semibold text-foreground">Member Portal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome, {profile?.first_name}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="shrink-0">
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              {navigation.map(item => {
              const isActive = location.pathname === item.href;
              return <Link key={item.name} to={item.href} className={cn('flex items-center rounded-lg text-sm font-medium transition-colors', isCollapsed ? 'justify-center p-3' : 'px-3 py-2', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                    <item.icon className={cn(isCollapsed ? "h-10 w-10" : "h-5 w-5 mr-3")} />
                    {!isCollapsed && item.name}
                  </Link>;
            })}
            </div>
            
            <div className="pt-4 border-t border-border">
              {!isCollapsed && <p className="text-xs font-medium text-muted-foreground px-3 pb-2">More</p>}
              {secondaryNavigation.map(item => {
              const isActive = location.pathname === item.href;
              return <Link key={item.name} to={item.href} className={cn('flex items-center rounded-lg text-sm font-medium transition-colors', isCollapsed ? 'justify-center p-3' : 'px-3 py-2', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                    <item.icon className={cn(isCollapsed ? "h-10 w-10" : "h-5 w-5 mr-3")} />
                    {!isCollapsed && item.name}
                  </Link>;
            })}
              
              <Button variant="ghost" onClick={signOut} className={cn("w-full text-muted-foreground hover:text-foreground mt-2", isCollapsed ? "justify-center p-3" : "justify-start px-3 py-2")}>
                <LogOut className={cn(isCollapsed ? "h-10 w-10" : "h-5 w-5 mr-3")} />
                {!isCollapsed && "Sign Out"}
              </Button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-border">
            <Button variant="ghost" onClick={signOut} className={cn("w-full text-muted-foreground hover:text-foreground", isCollapsed ? "justify-center p-3" : "justify-start")}>
              <LogOut className={cn(isCollapsed ? "h-10 w-10" : "h-5 w-5 mr-3")} />
              {!isCollapsed && "Sign Out"}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>;
  }

  // Get page info based on current route
  const currentPageInfo = pageInfo[location.pathname] || { title: 'Member Portal', icon: Home };
  const isDashboard = location.pathname === '/member/dashboard';
  const PageIcon = currentPageInfo.icon;

  // Mobile layout with slide-out menu
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          {isDashboard ? (
            <div className="flex items-center gap-2">
              <PageIcon className="h-5 w-5 text-primary" />
              <h1 className="text-base font-semibold text-foreground">Welcome back, {profile?.first_name}!</h1>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <PageIcon className="h-5 w-5 text-primary" />
              <h1 className="text-base font-semibold text-foreground">{currentPageInfo.title}</h1>
            </div>
          )}
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="text-white bg-primary">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-card">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Member Portal</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Welcome, {profile?.first_name}
                </p>
              </div>
              
              <nav className="flex-1 p-4 space-y-2">
                <div className="space-y-1">
                  {navigation.map(item => {
                const isActive = location.pathname === item.href;
                return <Link key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)} className={cn('flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>;
              })}
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground px-3 pb-2">More</p>
                  {secondaryNavigation.map(item => {
                const isActive = location.pathname === item.href;
                return <Link key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)} className={cn('flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground')}>
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </Link>;
              })}
                  
                  <Button variant="ghost" onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }} className="w-full justify-start px-3 py-2 text-muted-foreground hover:text-foreground mt-2">
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
      </header>

      {/* Main content - pb-24 ensures content is above the fixed bottom nav */}
      <main className="flex-1 overflow-auto pb-24">
        {children}
      </main>

      {/* Bottom navigation bar - Modern floating pill design */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/10">
          <div className="flex justify-around items-center py-2 px-2 bg-primary rounded-2xl">
            {navigation.map(item => {
            const isActive = location.pathname === item.href;
            return <Link key={item.name} to={item.href} className={cn('relative flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-300', isActive ? 'bg-white' : 'hover:bg-white/10')}>
                  <div className={cn("relative transition-transform duration-300", isActive && "scale-110")}>
                    <item.icon className={cn("h-5 w-5 transition-colors duration-300", isActive ? "text-primary" : "text-white")} />
                    {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                  </div>
                  <span className={cn("text-[10px] font-medium mt-1 transition-colors duration-300", isActive ? "text-primary" : "text-white")}>
                    {item.name}
                  </span>
                </Link>;
          })}
          </div>
        </div>
      </nav>
    </div>;
}