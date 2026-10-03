import React, { useEffect, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from '@/lib/router-compat';
import {
  Home, User, Calendar, BarChart3, Users, Wallet, Heart, Play, MessageCircle, ShoppingBag,
  LogOut, PanelLeftClose, PanelLeftOpen, LayoutGrid, Book, MapPin, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const LOGO = '/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png';

type NavItem = { name: string; href: string; icon: LucideIcon; desc?: string };

const primaryNav: NavItem[] = [
  { name: 'Home', href: '/member/dashboard', icon: Home },
  { name: 'Events', href: '/member/events', icon: Calendar },
  { name: 'Giving', href: '/member/finances', icon: Wallet },
  { name: 'Discipleship', href: '/member/discipleship', icon: Users },
];

const secondaryNav: NavItem[] = [
  { name: 'Bible', href: '/member/bible', icon: Book, desc: 'Read the Word' },
  { name: 'Attendance', href: '/member/attendance', icon: BarChart3, desc: 'Your record' },
  { name: 'Fundraising', href: '/member/fundraising', icon: Heart, desc: 'Campaigns' },
  { name: 'Media', href: '/member/media', icon: Play, desc: 'Sermons & videos' },
  { name: 'Counseling', href: '/member/counseling', icon: MessageCircle, desc: 'Book a session' },
  { name: 'Store', href: '/member/store', icon: ShoppingBag, desc: 'Books & resources' },
  { name: 'Profile', href: '/member/profile', icon: User, desc: 'Your details' },
];

const subtitles: Record<string, string> = {
  '/member/events': 'Gatherings, retreats and DCG meetings in your branch',
  '/member/finances': 'Track your tithes, offerings and contributions',
  '/member/discipleship': 'Your mentoring relationships and growth',
  '/member/bible': 'Read and reflect on the Word',
  '/member/attendance': 'Your presence across services and DCG meetings',
  '/member/fundraising': 'Support campaigns that change our world',
  '/member/media': 'Sermons, teachings and videos',
  '/member/counseling': 'Book time with a counselor or pastor',
  '/member/store': 'Books, resources and the church library',
  '/member/profile': 'Your personal details and family',
};

const allNav = [...primaryNav, ...secondaryNav];

// Compact (bottom bar) for phones, and for touch tablets below 1024px.
// Laptops/desktops with a mouse always get the sidebar layout, even on narrow windows.
function useCompactLayout() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const touch = window.matchMedia('(pointer: coarse)').matches;
      setCompact(w < 768 || (touch && w < 1024));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return compact;
}

const titles: Record<string, string> = {
  '/member/dashboard': 'Home',
  '/member/events': 'My Events',
  '/member/finances': 'My Giving',
  '/member/discipleship': 'Discipleship',
  '/member/bible': 'Bible',
  '/member/attendance': 'My Attendance',
  '/member/fundraising': 'Fundraising',
  '/member/media': 'Media',
  '/member/counseling': 'Counseling',
  '/member/store': 'Store',
  '/member/profile': 'My Profile',
};

function initials(first?: string | null, last?: string | null) {
  return `${(last || '').charAt(0)}${(first || '').charAt(0)}`.toUpperCase() || 'M';
}

export default function MemberLayout({ children }: { children?: React.ReactNode }) {
  const isCompact = useCompactLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, userRegion } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const content = children || <Outlet />;
  const path = location.pathname;
  const isActive = (href: string) => path === href || path.startsWith(href + '/');
  const moreActive = secondaryNav.some((i) => isActive(i.href));
  const fullName = [profile?.last_name, profile?.first_name].filter(Boolean).join(' ');

  const current = allNav.find((i) => isActive(i.href));
  const isHome = path === '/member/dashboard';
  const PageHero = ({ desktop }: { desktop?: boolean }) => {
    if (isHome || !current) return null;
    const Icon = current.icon;
    return (
      <section className={cn('relative mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/12 via-card to-secondary/12', desktop ? 'p-7' : 'p-4')}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <span className={cn('grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-regal', desktop ? 'h-14 w-14' : 'h-11 w-11')}>
            <Icon className={desktop ? 'h-7 w-7' : 'h-5 w-5'} />
          </span>
          <div className="min-w-0">
            <h2 className={cn('font-heading font-bold text-foreground', desktop ? 'text-3xl' : 'text-xl')}>{titles[path]}</h2>
            <p className="text-sm text-muted-foreground">{subtitles[path]}</p>
          </div>
        </div>
      </section>
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/member', { replace: true });
  };

  const Avatar = ({ size = 'h-9 w-9' }: { size?: string }) => (
    <div className={cn(size, 'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground')}>
      {initials(profile?.first_name, profile?.last_name)}
    </div>
  );

  if (!isCompact) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <aside className={cn('sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300', collapsed ? 'w-[76px]' : 'w-64')}>
          <div className={cn('flex h-16 items-center border-b border-border px-4', collapsed ? 'justify-center' : 'justify-between')}>
            {!collapsed && <img src={LOGO} alt="WCA" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />}
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </div>

          <Link to="/member/profile" className={cn('m-3 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5 transition-colors hover:bg-muted', collapsed && 'justify-center')}>
            <Avatar />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{fullName || 'Member'}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" />{userRegion?.name || 'WCA'}</p>
              </div>
            )}
          </Link>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
            {[{ label: 'Main', items: primaryNav }, { label: 'More', items: secondaryNav }].map((g) => (
              <div key={g.label} className="space-y-1">
                {!collapsed && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>}
                {g.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} to={item.href} title={collapsed ? item.name : undefined}
                      className={cn('group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-0' : 'px-3',
                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                      {active && <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary" />}
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <Button variant="ghost" onClick={handleSignOut} className={cn('w-full text-muted-foreground hover:text-foreground', collapsed ? 'justify-center px-0' : 'justify-start')}>
              <LogOut className={cn('h-5 w-5', !collapsed && 'mr-3')} />
              {!collapsed && 'Sign Out'}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-xl">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Member Portal</p>
              <h1 className="truncate font-heading text-lg font-semibold text-foreground">{titles[path] || 'Member Portal'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="outline"><Link to="/member/events"><Calendar className="mr-2 h-4 w-4" />Events</Link></Button>
              <Button asChild size="sm"><Link to="/member/finances"><Wallet className="mr-2 h-4 w-4" />Give</Link></Button>
              <ThemeToggle />
              <Link to="/member/profile" aria-label="Profile"><Avatar size="h-9 w-9" /></Link>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-8"><PageHero desktop />{content}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={LOGO} alt="WCA" className="h-7 w-auto shrink-0 object-contain dark:brightness-0 dark:invert" />
            <span className="h-5 w-px shrink-0 bg-border" />
            <h1 className="truncate font-heading text-base font-semibold text-foreground">{titles[path] || 'Member Portal'}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link to="/member/profile" aria-label="Profile"><Avatar size="h-8 w-8" /></Link>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6">
        <div className="mx-auto w-full max-w-4xl"><PageHero />{content}</div>
      </main>

      <nav aria-label="Member navigation" className="fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_color-mix(in_oklab,var(--foreground)_25%,transparent)] backdrop-blur-xl">
        <div className="grid h-16 w-full grid-cols-5 sm:h-[68px]">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} to={item.href} aria-current={active ? 'page' : undefined}
                className={cn('relative flex min-w-0 flex-col items-center justify-center gap-1 transition-colors sm:flex-row sm:gap-2',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                {active && <span className="absolute inset-x-[22%] top-0 h-[3px] rounded-b-full bg-primary" />}
                <span className={cn('grid h-8 w-12 place-items-center rounded-full transition-colors sm:w-auto sm:px-0', active && 'bg-primary/12 sm:bg-transparent')}>
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="truncate text-[11px] font-semibold sm:text-sm">{item.name}</span>
              </Link>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} aria-label="More pages"
            className={cn('relative flex min-w-0 flex-col items-center justify-center gap-1 transition-colors sm:flex-row sm:gap-2',
              moreActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
            {moreActive && <span className="absolute inset-x-[22%] top-0 h-[3px] rounded-b-full bg-primary" />}
            <span className={cn('grid h-8 w-12 place-items-center rounded-full sm:w-auto', moreActive && 'bg-primary/12 sm:bg-transparent')}>
              <LayoutGrid className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-semibold sm:text-sm">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
          <SheetHeader className="mb-4 text-left">
            <SheetTitle className="flex items-center gap-3">
              <Avatar size="h-10 w-10" />
              <span className="min-w-0">
                <span className="block truncate text-base">{fullName || 'Member'}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{userRegion?.name || 'World Changers Assembly'}</span>
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {secondaryNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} to={item.href} onClick={() => setMoreOpen(false)}
                  className={cn('flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors',
                    active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-muted/30 text-foreground hover:bg-muted')}>
                  <span className={cn('grid h-11 w-11 place-items-center rounded-full', active ? 'bg-primary text-primary-foreground' : 'bg-background text-primary')}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold">{item.name}</span>
                  <span className="hidden text-[11px] text-muted-foreground sm:block">{item.desc}</span>
                </Link>
              );
            })}
          </div>
          <Button variant="outline" onClick={() => { setMoreOpen(false); void handleSignOut(); }} className="mt-5 w-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
