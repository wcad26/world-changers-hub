import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from '@/lib/router-compat';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsTablet } from '@/hooks/use-tablet';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentDcg } from '@/hooks/useDcgFinancials';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Wallet,
  MessageSquare,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Initials } from '@/components/admin/dcg/DcgUI';

interface DcgAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavItem {
  title: string;
  shortLabel: string;
  path: string;
  icon: LucideIcon;
  subtitle: string;
}

const MENU_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    shortLabel: 'Dashboard',
    path: '/dcg/dashboard',
    icon: LayoutDashboard,
    subtitle: 'Overview, attendance & group health',
  },
  {
    title: 'Members',
    shortLabel: 'Members',
    path: '/dcg/members',
    icon: Users,
    subtitle: 'Directory, roles & member care',
  },
  {
    title: 'Events',
    shortLabel: 'Events',
    path: '/dcg/events',
    icon: Calendar,
    subtitle: 'Meetings, gatherings & attendance',
  },
  {
    title: 'Finances',
    shortLabel: 'Finances',
    path: '/dcg/finances',
    icon: Wallet,
    subtitle: 'Income, expenses & offerings ledger',
  },
  {
    title: 'Communication',
    shortLabel: 'Comms',
    path: '/dcg/communication',
    icon: MessageSquare,
    subtitle: 'Announcements & group messaging',
  },
];

const isItemActive = (pathname: string, itemPath: string) => {
  if (pathname === itemPath) return true;
  if (itemPath === '/dcg/members' && pathname.startsWith('/dcg/member')) return true;
  return pathname.startsWith(`${itemPath}/`);
};

const resolveCurrentNav = (pathname: string): { title: string; subtitle: string; icon: LucideIcon } => {
  if (pathname.startsWith('/dcg/member/')) {
    return {
      title: 'Member Profile',
      subtitle: 'Personal details, attendance & family',
      icon: Users,
    };
  }
  const found = MENU_ITEMS.find((item) => isItemActive(pathname, item.path));
  if (found) {
    return { title: found.title, subtitle: found.subtitle, icon: found.icon };
  }
  return { title: 'DCG Portal', subtitle: 'Deeper Christian Group management', icon: LayoutDashboard };
};

const safeSignOut = async (
  signOut: () => Promise<void> | void,
  navigate: ReturnType<typeof useNavigate>,
) => {
  try {
    await signOut();
  } catch (err) {
    console.error('[DcgAdminLayout] signOut error', err);
  } finally {
    navigate('/dcg-auth', { replace: true });
  }
};

const DesktopShell: React.FC<DcgAdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userDcg, signOut } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const dcg = userDcg || resolvedDcg;
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === 'collapsed';

  const navMeta = resolveCurrentNav(location.pathname);
  const PageIcon = navMeta.icon;
  const pageTitle = title || navMeta.title;

  return (
    <div className="flex h-svh w-full overflow-hidden bg-muted/40">
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground"
      >
        <SidebarHeader className="border-b border-sidebar-border/60 p-4">
          <div className="flex w-full items-center justify-between gap-2">
            {!isCollapsed && (
              <Link to="/dcg/dashboard" className="min-w-0 flex-1">
                <p className="truncate font-heading text-base font-bold uppercase tracking-tight text-primary">
                  {dcg?.name || 'DCG PORTAL'}
                </p>
                {profile?.first_name && (
                  <p className="truncate text-xs text-muted-foreground">
                    Welcome, {profile.first_name}
                  </p>
                )}
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={cn('h-8 w-8 shrink-0 rounded-full', isCollapsed && 'mx-auto')}
            >
              {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const active = isItemActive(location.pathname, item.path);
              const Icon = item.icon;
              const link = (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                    isCollapsed && 'justify-center px-2',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
          </nav>
        </SidebarContent>

        <SidebarFooter className="mt-auto border-t border-sidebar-border/60 p-3">
          <Button
            variant="outline"
            className={cn(
              'w-full items-center gap-2 rounded-full',
              isCollapsed ? 'justify-center px-0' : 'justify-center',
            )}
            onClick={() => void safeSignOut(signOut, navigate)}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-20 shrink-0 border-b border-border bg-card/90 shadow-xs backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-6 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
                <PageIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-lg font-semibold leading-tight text-foreground">
                  {pageTitle}
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  {dcg?.name ? `${dcg.name} · ${navMeta.subtitle}` : navMeta.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              {user?.email && (
                <span className="hidden max-w-[200px] truncate text-xs text-muted-foreground xl:inline">
                  {user.email}
                </span>
              )}
              <Initials
                size="sm"
                first={profile?.first_name}
                last={profile?.last_name}
                photo={(profile as any)?.avatar_url}
              />
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

const MobileShell: React.FC<DcgAdminLayoutProps> = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userDcg, signOut } = useAuth();
  const { data: resolvedDcg } = useCurrentDcg();
  const dcg = userDcg || resolvedDcg;
  const [menuOpen, setMenuOpen] = useState(false);

  const navMeta = resolveCurrentNav(location.pathname);
  const PageIcon = navMeta.icon;
  const pageTitle = title || navMeta.title;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Fixed Mobile/Tablet Top Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm">
              <PageIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-base font-semibold leading-tight text-foreground">
                {pageTitle}
              </h1>
              {dcg?.name && (
                <p className="truncate text-[11px] leading-tight text-muted-foreground">{dcg.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  aria-label="Open menu"
                  className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col bg-card p-0">
                <SheetTitle className="sr-only">DCG Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate across DCG portal pages
                </SheetDescription>
                <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary to-secondary p-6 text-primary-foreground">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-foreground/15 blur-2xl" />
                  <div className="relative">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/75">
                      Deeper Christian Group
                    </p>
                    <h2 className="mt-0.5 truncate font-heading text-lg font-bold">
                      {dcg?.name || 'DCG Portal'}
                    </h2>
                    {(profile?.first_name || user?.email) && (
                      <p className="mt-1 truncate text-xs text-primary-foreground/80">
                        {profile?.first_name
                          ? `${profile.first_name} ${profile.last_name || ''}`.trim()
                          : user?.email}
                      </p>
                    )}
                  </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                  {MENU_ITEMS.map((item) => {
                    const active = isItemActive(location.pathname, item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="border-t border-border p-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMenuOpen(false);
                      void safeSignOut(signOut, navigate);
                    }}
                    className="w-full justify-center gap-2 rounded-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>

      {/* Fixed Full-Width Bottom Navigation Bar */}
      <nav aria-label="DCG bottom navigation" className="fixed inset-x-0 bottom-0 z-50 w-full">
        <div className="w-full border-t border-border bg-primary pb-[env(safe-area-inset-bottom)] shadow-regal">
          <div className="flex w-full items-center justify-around gap-0.5 bg-primary px-1 py-1.5">
            {MENU_ITEMS.map((item) => {
              const active = isItemActive(location.pathname, item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 py-2 transition-all duration-300',
                    active ? 'bg-primary-foreground' : 'hover:bg-primary-foreground/10',
                  )}
                >
                  <div className={cn('relative transition-transform duration-300', active && 'scale-110')}>
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-colors',
                        active ? 'text-primary' : 'text-primary-foreground',
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      'mt-1 max-w-full truncate text-[10px] font-medium transition-colors duration-300',
                      active ? 'text-primary' : 'text-primary-foreground',
                    )}
                  >
                    {item.shortLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

const DcgAdminLayout: React.FC<DcgAdminLayoutProps> = (props) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const useMobileShell = isMobile || isTablet;

  if (useMobileShell) {
    return <MobileShell {...props} />;
  }

  return (
    <SidebarProvider defaultOpen>
      <DesktopShell {...props} />
    </SidebarProvider>
  );
};

export default DcgAdminLayout;
