import React from 'react';
import { Link, useNavigate } from '@/lib/router-compat';
import {
  Home, User, Calendar, BarChart3, Users, Wallet, Heart, Play, MessageCircle, ShoppingBag,
  LogOut, LayoutGrid, Book, GraduationCap, Languages, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MemberAvatar } from '@/components/member/MemberAvatar';
import { cn } from '@/lib/utils';

export type NavItem = { name: string; href: string; icon: LucideIcon; desc?: string };

export const secondaryNav: NavItem[] = [
  { name: 'Home', href: '/member/dashboard', icon: Home, desc: 'Dashboard overview' },
  { name: 'Events', href: '/member/events', icon: Calendar, desc: 'Gatherings & meetings' },
  { name: 'Giving', href: '/member/finances', icon: Wallet, desc: 'Tithes & offerings' },
  { name: 'Discipleship', href: '/member/discipleship', icon: Users, desc: 'Mentorship & growth' },
  { name: 'Bible', href: '/member/bible', icon: Book, desc: 'Read the Word' },
  { name: 'Profile', href: '/member/profile', icon: User, desc: 'Your details' },
  { name: 'Counseling', href: '/member/counseling', icon: MessageCircle, desc: 'Book a session' },
  { name: 'Media', href: '/member/media', icon: Play, desc: 'Sermons & videos' },
  { name: 'Fundraising', href: '/member/fundraising', icon: Heart, desc: 'Campaigns' },
  { name: 'Store', href: '/member/store', icon: ShoppingBag, desc: 'Books & resources' },
  { name: 'Attendance', href: '/member/attendance', icon: BarChart3, desc: 'Your record' },
  { name: 'Education', href: '/member/education', icon: GraduationCap, desc: 'Courses & school' },
  { name: 'Translation', href: '/member/translation', icon: Languages, desc: 'Live in your language' },
];

function initials(first?: string | null, last?: string | null) {
  return `${(last || '').charAt(0)}${(first || '').charAt(0)}`.toUpperCase() || 'M';
}

interface MemberMoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MemberMoreSheet: React.FC<MemberMoreSheetProps> = ({
  open,
  onOpenChange,
}) => {
  const { signOut, profile, userRegion } = useAuth();
  const navigate = useNavigate();
  const fullName = [profile?.last_name, profile?.first_name].filter(Boolean).join(' ');

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/auth/member', { replace: true });
  };

  const Avatar = ({ size = 'h-10 w-10' }: { size?: string }) => (
    (profile as any)?.avatar_url ? (
      <MemberAvatar path={(profile as any).avatar_url} className={size} />
    ) : (
      <div
        className={cn(
          size,
          'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-primary-foreground'
        )}
      >
        {initials(profile?.first_name, profile?.last_name)}
      </div>
    )
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-border bg-card px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 data-[state=open]:duration-300 data-[state=closed]:duration-200 ease-out"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-3">
            <Avatar size="h-10 w-10" />
            <span className="min-w-0">
              <span className="block truncate text-base">{fullName || 'Member'}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {userRegion?.name || 'World Changers Assembly'}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {secondaryNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => onOpenChange(false)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/30 p-3 text-center transition-colors hover:bg-muted text-foreground"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-background text-primary shadow-xs">
                <item.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold">{item.name}</span>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                {item.desc}
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="group relative mt-5 flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-3 text-left text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary-foreground/10 blur-2xl" />
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15">
            <LogOut className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Sign out</span>
            <span className="block truncate text-xs text-primary-foreground/75">
              See you soon, {profile?.first_name || 'friend'}
            </span>
          </span>
          <ChevronRight className="h-5 w-5 opacity-80 transition-transform group-hover:translate-x-0.5" />
        </button>
      </SheetContent>
    </Sheet>
  );
};
