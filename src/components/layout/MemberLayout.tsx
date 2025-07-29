import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Calendar, 
  BarChart3, 
  Users, 
  DollarSign, 
  Heart, 
  Play, 
  MessageCircle, 
  ShoppingBag,
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MemberLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/member/dashboard', icon: Home },
  { name: 'Events', href: '/member/events', icon: Calendar },
  { name: 'Finances', href: '/member/finances', icon: DollarSign },
  { name: 'Discipleship', href: '/member/discipleship', icon: Users },
];

const secondaryNavigation = [
  { name: 'Attendance', href: '/member/attendance', icon: BarChart3 },
  { name: 'Fundraising', href: '/member/fundraising', icon: Heart },
  { name: 'Media', href: '/member/media', icon: Play },
  { name: 'Counseling', href: '/member/counseling', icon: MessageCircle },
  { name: 'Store', href: '/member/store', icon: ShoppingBag },
  { name: 'Profile', href: '/member/profile', icon: User },
];

export default function MemberLayout({ children }: MemberLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { signOut, profile } = useAuth();

  if (!isMobile) {
    // Desktop layout with sidebar
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Member Portal</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome, {profile?.first_name}
            </p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="pt-4 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground px-3 pb-2">More</p>
              {secondaryNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          <div className="p-4 border-t border-border">
            <Button 
              variant="ghost" 
              onClick={signOut} 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Mobile layout with bottom navigation
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Member Portal</h1>
          <p className="text-xs text-muted-foreground">
            Welcome, {profile?.first_name}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium leading-none">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}