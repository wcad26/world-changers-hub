import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { Link, useLocation, Outlet, useNavigate } from '@/lib/router-compat';
import { Home, User, Calendar, BarChart3, Users, DollarSign, Heart, Play, MessageCircle, ShoppingBag, LogOut, PanelLeftClose, PanelLeftOpen, Menu, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface MemberLayoutProps {
  children?: React.ReactNode;
}

// Page info with custom titles and icons for header
import { Book } from 'lucide-react';

const pageInfo: Record<string, { title: string; icon: LucideIcon }> = {
  '/member/dashboard': { title: 'Member Portal', icon: Home },
  '/member/events': { title: 'My Events', icon: Calendar },
  '/member/finances': { title: 'My Giving', icon: DollarSign },
  '/member/discipleship': { title: 'My Discipleship Journey', icon: BookOpen },
  '/member/bible': { title: 'Bible', icon: Book },
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
  name: 'Bible',
  href: '/member/bible',
  icon: Book
}, {
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
  const navigate = useNavigate();
  const {
    signOut,
    profile
  } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use mobile layout for both mobile and tablet views
  const useMobileLayout = isMobile || isTablet;

  const content = children || <Outlet />;
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/member', { replace: true });
  };
  
  if (!useMobileLayout) {
    // Desktop layout with sidebar
    return <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <div className={cn("bg-card border-r border-border flex flex-col transition-all duration-300", isCollapsed ? "w-16" : "w-64")}>
          <div className="flex items-center justify-between border-b border-border bg-primary p-6 text-primary-foreground">
            <div className={cn("transition-opacity duration-300", isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
              <h2 className="font-heading text-xl font-semibold">Member Portal</h2>
              <p className="mt-1 text-sm text-primary-foreground/70">
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
            </div>
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <Button variant="ghost" onClick={handleSignOut} className={cn("w-full text-muted-foreground hover:text-foreground", isCollapsed ? "justify-center p-3" : "justify-start")}>
              <LogOut className={cn(isCollapsed ? "h-10 w-10" : "h-5 w-5 mr-3")} />
              {!isCollapsed && "Sign Out"}
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b bg-card/90 px-5 shadow-xs backdrop-blur-xl"><ThemeToggle /></header>
          {content}
        </div>
      </div>;
  }

  // Get page info based on current route
  const currentPageInfo = pageInfo[location.pathname] || { title: 'Member Portal', icon: Home };
  const isDashboard = location.pathname === '/member/dashboard';
  const PageIcon = currentPageInfo.icon;

  // Mobile layout with slide-out menu
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Top header - fixed */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
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
        <div className="flex items-center gap-1"><ThemeToggle /><Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="bg-primary text-primary-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-card">
               <div className="border-b border-border bg-primary p-6 text-primary-foreground">
                 <h2 className="font-heading text-xl font-semibold">Member Portal</h2>
                 <p className="mt-1 text-sm text-primary-foreground/70">
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
                </div>

                <div className="pt-4 border-t border-border space-y-1">
                  <Button variant="ghost" onClick={() => {
                setMobileMenuOpen(false);
                void handleSignOut();
              }} className="w-full justify-start px-3 py-2 text-muted-foreground hover:text-foreground mt-2">
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet></div>
      </header>

      {/* Main content - pt-14 for fixed header, pb-24 for fixed bottom nav */}
      <main className="flex-1 overflow-auto pt-14 pb-24">
        {content}
      </main>

      {/* Bottom navigation bar - Modern floating pill design */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
         <div className="rounded-md border border-border bg-card/95 shadow-regal backdrop-blur-xl">
           <div className="flex items-center justify-around rounded-md bg-primary px-2 py-2">
            {navigation.map(item => {
            const isActive = location.pathname === item.href;
             return <Link key={item.name} to={item.href} className={cn('relative flex flex-col items-center rounded-md px-4 py-2 transition-colors', isActive ? 'bg-primary-foreground' : 'hover:bg-primary-foreground/10')}>
                  <div className={cn("relative transition-transform duration-300", isActive && "scale-110")}>
                     <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-primary-foreground")} />
                    {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
                  </div>
                   <span className={cn("mt-1 text-[10px] font-medium transition-colors", isActive ? "text-primary" : "text-primary-foreground")}>
                    {item.name}
                  </span>
                </Link>;
          })}
          </div>
        </div>
      </nav>
    </div>;
}
