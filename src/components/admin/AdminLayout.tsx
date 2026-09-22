
import React, { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "@/lib/router-compat";
import { cn } from "@/lib/utils";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsTablet } from "@/hooks/use-tablet";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface AdminLayoutProps {
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
  '/admin/regional/reports': 'Reports & Analytics',
  '/admin/regional/certificates': 'Certificate Management',
  '/admin/regional/branch-settings': 'Regional Website Information',
  '/admin/regional/user-roles': 'Access Management',
  '/admin/regional/discipleship': 'Discipleship Management',
  '/admin/regional/settings': 'Settings',
  '/admin/super/dashboard': 'Super Admin Dashboard',
  '/admin/super/regions': 'Regional Branches Management',
  '/admin/super/members': 'Global Member Management',
  '/admin/super/user-management': 'User Management',
  '/admin/super/events': 'Global Event Management',
  '/admin/super/finances': 'Global Financial Management',
  '/admin/super/communication': 'Global Communication Center',
  '/admin/super/fundraising': 'Global Fundraising Management',
  '/admin/super/locations': 'Global Location Management',
  '/admin/super/reports': 'Global Reports & Analytics',
  '/admin/super/settings': 'Super Admin Settings',
  '/admin/super/homepage-settings': 'Homepage Settings',
  '/admin/super/about-settings': 'About Us Settings',
  '/admin/super/certificates': 'Certificate Management',
};

const getPageTitleFromPath = (path: string, fallback?: string) => {
  if (fallback) return fallback;
  // Handle dynamic routes like /admin/regional/members/:id
  const direct = ROUTE_TITLE_MAP[path];
  if (direct) return direct;
  const parts = path.split('/');
  // Strip trailing dynamic segment
  if (parts.length > 3) {
    const stripped = parts.slice(0, -1).join('/');
    if (ROUTE_TITLE_MAP[stripped]) return ROUTE_TITLE_MAP[stripped];
  }
  return 'Admin Dashboard';
};

const AdminLayoutInner: React.FC<AdminLayoutProps> = ({ children, title, menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRegion, signOut } = useAuth();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const pageTitle = getPageTitleFromPath(location.pathname, title);
  const isDashboard = location.pathname === '/admin/regional/dashboard';
  const handleSignOut = async () => {
    await signOut();
    navigate(location.pathname.startsWith('/admin/super') ? '/auth/super' : '/auth/regional', { replace: true });
  };

  return (
    <div className="flex h-svh w-full overflow-hidden bg-muted/40">
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between w-full">
            {!isCollapsed && (
              <Link to="/" className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-heading truncate text-lg font-bold text-primary">
                  {location.pathname.startsWith('/admin/super')
                    ? 'SUPER ADMIN'
                    : (userRegion?.name?.toUpperCase() || 'PORTAL')}
                </span>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className={`shrink-0 h-8 w-8 ${isCollapsed ? "mx-auto" : ""}`}>
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
                    className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                      isCollapsed ? "justify-center px-2" : ""
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
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
            className={`w-full flex items-center gap-2 ${isCollapsed ? "justify-center px-2" : ""}`}
            onClick={handleSignOut}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="z-20 shrink-0 border-b bg-card/90 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-semibold text-foreground">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {user && (
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user.email}
                </span>
              )}
            </div>
          </div>
        </header>
        <main className={cn(
          "flex-1 min-h-0",
          isDashboard
            ? "overflow-hidden p-0"
            : "overflow-y-auto p-4 md:p-6"
        )}>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

/**
 * Mobile/tablet shell — fixed top bar with hamburger sheet + bottom nav pill.
 * Used for any viewport < 1024px in the regional / super admin portals.
 */
const AdminLayoutMobile: React.FC<AdminLayoutProps> = ({ children, title, menuItems }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRegion, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = getPageTitleFromPath(location.pathname, title);
  const isDashboard = location.pathname === '/admin/regional/dashboard';
  const handleSignOut = async () => {
    await signOut();
    navigate(location.pathname.startsWith('/admin/super') ? '/auth/super' : '/auth/regional', { replace: true });
  };

  // Bottom nav: prefer Dashboard / Members / Events / DCG, else first 4 visible items
  const preferredOrder = [
    '/admin/regional/dashboard',
    '/admin/regional/members',
    '/admin/regional/events',
    '/admin/regional/dcg',
    '/admin/super/dashboard',
    '/admin/super/regions',
    '/admin/super/members',
    '/admin/super/events',
  ];
  const itemByPath = new Map(menuItems.map(i => [i.path, i]));
  const preferred = preferredOrder.map(p => itemByPath.get(p)).filter(Boolean) as typeof menuItems;
  const remaining = menuItems.filter(i => !preferred.includes(i));
  const bottomNav = [...preferred, ...remaining].slice(0, 4);

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Fixed top header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 shadow-xs backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-foreground truncate">
            {pageTitle}
          </h1>
        </div>
        <div className="flex items-center gap-1"><ThemeToggle /><Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-card flex flex-col">
            <div className="border-b border-border bg-primary p-6 text-primary-foreground">
              <h2 className="font-heading truncate text-lg font-bold">
                {userRegion?.name?.toUpperCase() || 'PORTAL'}
              </h2>
              {user?.email && (
                <p className="mt-1 truncate text-xs text-primary-foreground/70">{user.email}</p>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map(item => {
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
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
                onClick={() => { setMenuOpen(false); void handleSignOut(); }}
                className="w-full justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet></div>
      </header>

      {/* Main content — clears top bar (h-14) and bottom pill */}
      <main className={cn(
        "flex-1 pt-14",
        isDashboard ? "pb-24" : "pb-24 px-4 py-4"
      )}>
        {children || <Outlet />}
      </main>

      {/* Bottom navigation pill */}
      {bottomNav.length > 0 && (
        <nav className="fixed bottom-4 left-4 right-4 z-50">
          <div className="rounded-md border border-border bg-card/95 shadow-regal backdrop-blur-xl">
            <div className="flex items-center justify-around rounded-md bg-primary px-2 py-2">
              {bottomNav.map(item => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                // Compact label
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
                      'relative flex min-w-0 flex-1 flex-col items-center rounded-md px-2 py-2 transition-colors',
                      isActive ? 'bg-primary-foreground' : 'hover:bg-primary-foreground/10'
                    )}
                  >
                    <div className={cn("relative transition-transform duration-300", isActive && "scale-110")}>
                       <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-primary-foreground")} />
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium mt-1 transition-colors duration-300 truncate max-w-full",
                       isActive ? "text-primary" : "text-primary-foreground"
                    )}>
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

const AdminLayout: React.FC<AdminLayoutProps> = (props) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useMobileShell = isMobile || isTablet;

  if (useMobileShell) {
    return <AdminLayoutMobile {...props} />;
  }

  return (
    <SidebarProvider defaultOpen>
      <AdminLayoutInner {...props} />
    </SidebarProvider>
  );
};

export default AdminLayout;
