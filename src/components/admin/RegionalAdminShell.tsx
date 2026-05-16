import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useRegionalSession } from '@/contexts/RegionalSessionContext';

interface RegionalAdminShellProps {
  children?: React.ReactNode;
  title?: string;
  menuItems: {
    title: string;
    path: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
  }[];
}

const ROUTE_TITLE_MAP: Record<string, string> = {
  '/admin/regional/dashboard': 'Dashboard',
  '/admin/regional/finances': 'Finance Management',
  '/admin/regional/members': 'Member Management',
  '/admin/regional/events': 'Event Management',
  '/admin/regional/communication': 'Communication Mgmt',
  '/admin/regional/dcg': 'DCG Management',
  
  '/admin/regional/certificates': 'Certificate Management',
  '/admin/regional/branch-settings': 'Regional Website Information',
  '/admin/regional/user-roles': 'Access Management',
  '/admin/regional/discipleship': 'Discipleship Management',
  '/admin/regional/settings': 'Settings',
};

const getPageTitleFromPath = (path: string, fallback?: string) => {
  if (fallback) return fallback;
  const direct = ROUTE_TITLE_MAP[path];
  if (direct) return direct;
  const parts = path.split('/');
  if (parts.length > 3) {
    const stripped = parts.slice(0, -1).join('/');
    if (ROUTE_TITLE_MAP[stripped]) return ROUTE_TITLE_MAP[stripped];
  }
  return 'Regional Admin';
};

const safeLogout = async (signOut: () => Promise<void> | void) => {
  try {
    await signOut();
  } catch (err) {
    console.error('[RegionalShell] logout failed, forcing redirect:', err);
  } finally {
    if (typeof window !== 'undefined' && window.location.pathname !== '/auth/regional') {
      window.location.replace('/auth/regional');
    }
  }
};

const ShellInner: React.FC<RegionalAdminShellProps> = ({ children, title, menuItems }) => {
  const location = useLocation();
  const { user, region, signOut } = useRegionalSession();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const pageTitle = getPageTitleFromPath(location.pathname, title);
  const isDashboard = location.pathname === '/admin/regional/dashboard';

  return (
    <div className="h-svh flex w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsible="icon" className="border-r border-gray-200 dark:border-gray-800">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between w-full">
            {!isCollapsed && (
              <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  {region?.name?.toUpperCase() || 'PORTAL'}
                </span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={`shrink-0 h-8 w-8 ${isCollapsed ? 'mx-auto' : ''}`}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <div className="py-2">
            <nav className="mt-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const linkContent = (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
                      isCollapsed ? 'justify-center px-2' : ''
                    } ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </div>
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto space-y-2">
          <Button
            variant="outline"
            className={`w-full flex items-center gap-2 ${isCollapsed ? 'justify-center px-2' : ''}`}
            onClick={() => safeLogout(signOut)}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="shrink-0 bg-white dark:bg-gray-900 shadow z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user?.email && (
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
              )}
            </div>
          </div>
        </header>
        <main
          className={cn(
            'flex-1 min-h-0',
            isDashboard ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6',
          )}
        >
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

const ShellMobile: React.FC<RegionalAdminShellProps> = ({ children, title, menuItems }) => {
  const location = useLocation();
  const { user, region, signOut } = useRegionalSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = getPageTitleFromPath(location.pathname, title);
  const isDashboard = location.pathname === '/admin/regional/dashboard';

  const preferredOrder = [
    '/admin/regional/dashboard',
    '/admin/regional/members',
    '/admin/regional/events',
    '/admin/regional/dcg',
  ];
  const itemByPath = new Map(menuItems.map((i) => [i.path, i]));
  const preferred = preferredOrder.map((p) => itemByPath.get(p)).filter(Boolean) as typeof menuItems;
  const remaining = menuItems.filter((i) => !preferred.includes(i));
  const bottomNav = [...preferred, ...remaining].slice(0, 4);

  return (
    <div className="min-h-svh bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border px-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground truncate">{pageTitle}</h1>
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-card flex flex-col">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                {region?.name?.toUpperCase() || 'PORTAL'}
              </h2>
              {user?.email && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMenuOpen(false);
                  void safeLogout(signOut);
                }}
                className="w-full justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className={cn('flex-1 pt-14', isDashboard ? 'pb-24' : 'pb-24 px-4 py-4')}>
        {children || <Outlet />}
      </main>

      {bottomNav.length > 0 && (
        <nav className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/10">
            <div className="flex justify-around items-center py-2 px-2 bg-primary rounded-2xl">
              {bottomNav.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const shortLabel = item.title
                  .replace(' Management', '')
                  .replace(' Mgmt', '')
                  .replace('Regional Website Information', 'Website')
                  .replace('Reports & Analytics', 'Reports');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex flex-col items-center px-2 py-2 rounded-xl transition-all duration-300 min-w-0 flex-1',
                      isActive ? 'bg-white' : 'hover:bg-white/10',
                    )}
                  >
                    <div className={cn('relative transition-transform duration-300', isActive && 'scale-110')}>
                      <Icon className={cn('h-5 w-5 transition-colors duration-300', isActive ? 'text-primary' : 'text-white')} />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-medium mt-1 transition-colors duration-300 truncate max-w-full',
                        isActive ? 'text-primary' : 'text-white',
                      )}
                    >
                      {shortLabel}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

const RegionalAdminShell: React.FC<RegionalAdminShellProps> = (props) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useMobileShell = isMobile || isTablet;

  if (useMobileShell) {
    return <ShellMobile {...props} />;
  }

  return (
    <SidebarProvider defaultOpen>
      <ShellInner {...props} />
    </SidebarProvider>
  );
};

export default RegionalAdminShell;
