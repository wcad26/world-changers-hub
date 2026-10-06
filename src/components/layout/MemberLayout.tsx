import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from '@/lib/router-compat';
import {
  Home, User, Calendar, BarChart3, Users, Wallet, Heart, Play, MessageCircle, ShoppingBag,
  LogOut, PanelLeftClose, PanelLeftOpen, LayoutGrid, Book, GraduationCap, Languages, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MemberAvatar } from '@/components/member/MemberAvatar';
import { MemberMoreSheet } from '@/components/layout/MemberMoreSheet';

const LOGO = '/lovable-uploads/49a70c29-0080-4568-ad27-30a1d70295e5.png';

type NavItem = { name: string; href: string; icon: LucideIcon; desc?: string };

const primaryNav: NavItem[] = [
  { name: 'Home', href: '/member/dashboard', icon: Home },
  { name: 'Events', href: '/member/events', icon: Calendar },
  { name: 'Giving', href: '/member/finances', icon: Wallet },
  { name: 'Discipleship', href: '/member/discipleship', icon: Users },
];

const secondaryNav: NavItem[] = [
  { name: 'Profile', href: '/member/profile', icon: User, desc: 'Your details' },
  { name: 'Bible', href: '/member/bible', icon: Book, desc: 'Read the Word' },
  { name: 'Counseling', href: '/member/counseling', icon: MessageCircle, desc: 'Book a session' },
  { name: 'Media', href: '/member/media', icon: Play, desc: 'Sermons & videos' },
  { name: 'Give', href: '/member/finances', icon: Wallet, desc: 'Tithes & offerings' },
  { name: 'Fundraising', href: '/member/fundraising', icon: Heart, desc: 'Campaigns' },
  { name: 'Store', href: '/member/store', icon: ShoppingBag, desc: 'Books & resources' },
  { name: 'Attendance', href: '/member/attendance', icon: BarChart3, desc: 'Your record' },
  { name: 'Education', href: '/member/education', icon: GraduationCap, desc: 'Courses & school' },
  { name: 'Translation', href: '/member/translation', icon: Languages, desc: 'Live in your language' },
];

const sidebarMore = secondaryNav.filter((i) => !primaryNav.some((p) => p.href === i.href));

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
  '/member/education': 'Enroll in courses and grow in knowledge',
  '/member/translation': 'Follow every message in your own language',
};

const allNav = [...primaryNav, ...sidebarMore];

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
  '/member/education': 'Education',
  '/member/translation': 'Translation',
};

function initials(first?: string | null, last?: string | null) {
  return `${(last || '').charAt(0)}${(first || '').charAt(0)}`.toUpperCase() || 'M';
}

export default function MemberLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, userRegion } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const content = children || <Outlet />;
  const path = location.pathname;
  const isBiblePage = path === '/member/bible';

  const isActive = (href: string) => path === href || path.startsWith(href + '/');
  const moreActive = secondaryNav.some((i) => isActive(i.href));

  const current = allNav.find((i) => isActive(i.href));
  const isHome = path === '/member/dashboard';

  const HeaderTitle = ({ compact }: { compact?: boolean }) => {
    const Icon = isHome ? Home : current?.icon ?? Home;
    const subtitle = isHome ? `Welcome to your ${userRegion?.name || 'WCA'} member portal` : subtitles[path];
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={cn('grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm', compact ? 'h-8 w-8' : 'h-10 w-10')}>
          <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
        </span>
        <div className="min-w-0">
          <h1 className={cn('truncate font-heading font-semibold leading-tight text-foreground', compact ? 'text-base' : 'text-lg')}>{titles[path] || 'Member Portal'}</h1>
          {subtitle && <p className={cn('truncate leading-tight text-muted-foreground', compact ? 'text-[11px]' : 'text-xs')}>{subtitle}</p>}
        </div>
      </div>
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/member', { replace: true });
  };

  const Avatar = ({ size = 'h-9 w-9' }: { size?: string }) => (
    (profile as any)?.avatar_url
      ? <MemberAvatar path={(profile as any).avatar_url} className={size} />
      : <div className={cn(size, 'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground')}>
          {initials(profile?.first_name, profile?.last_name)}
        </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar: ALWAYS visible on desktop, including on the Bible page */}
      <aside className={cn('sticky top-0 hidden min-[1025px]:flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300', collapsed ? 'w-[76px]' : 'w-64')}>
        <div className={cn('flex h-16 items-center border-b border-border px-4', collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && <img src={LOGO} alt="WCA" className="h-8 w-auto object-contain dark:brightness-0 dark:invert" />}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {[{ label: 'Main', items: primaryNav }, { label: 'More', items: sidebarMore }].map((g) => (
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
        {/* Desktop Header: OMITTED when on Bible page (replaced by Bible Header) */}
        {!isBiblePage && (
          <header className="sticky top-0 z-30 hidden h-16 min-[1025px]:flex items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-xl">
            <HeaderTitle />
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="outline"><Link to="/member/events"><Calendar className="mr-2 h-4 w-4" />Events</Link></Button>
              <Button asChild size="sm"><Link to="/member/finances"><Wallet className="mr-2 h-4 w-4" />Give</Link></Button>
              <ThemeToggle />
              <Link to="/member/profile" aria-label="Profile"><Avatar size="h-9 w-9" /></Link>
            </div>
          </header>
        )}

        {/* Mobile / Tablet Header: OMITTED when on Bible page (replaced by Bible Header) */}
        {!isBiblePage && (
          <header className="sticky top-0 z-40 min-[1025px]:hidden border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
            <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <img src={LOGO} alt="WCA" className="h-7 w-auto shrink-0 object-contain dark:brightness-0 dark:invert" />
                <span className="h-6 w-px shrink-0 bg-border" />
                <HeaderTitle compact />
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button size="icon" onClick={() => setMoreOpen(true)} aria-label="More pages" aria-expanded={moreOpen} aria-haspopup="dialog" className={cn('h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90', moreActive && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-background')}>
                  <LayoutGrid className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            'w-full flex-1',
            isBiblePage
              ? 'p-0 pb-0' // Flush full-bleed for Bible page
              : 'px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 min-[1025px]:px-8 min-[1025px]:py-8'
          )}
        >
          {isBiblePage ? (
            content
          ) : (
            <div className="mx-auto w-full max-w-4xl min-[1025px]:max-w-7xl">{content}</div>
          )}
        </main>
      </div>

      {/* Mobile / Tablet Bottom Navigation: OMITTED when on Bible page (replaced by Bible Bottom Nav) */}
      {!isBiblePage && (
        <nav aria-label="Member navigation" className="min-[1025px]:hidden fixed inset-x-0 bottom-0 z-50 w-full border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_color-mix(in_oklab,var(--foreground)_25%,transparent)] backdrop-blur-xl">
          <div className="grid h-16 w-full grid-cols-4 sm:h-[68px]">
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
          </div>
        </nav>
      )}

      {/* More Pages Sheet Drawer */}
      <MemberMoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </div>
  );
}
