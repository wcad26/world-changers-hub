import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar, Clock, MapPin, ChevronRight, Heart, Wallet, Users, Play, Book, BarChart3, Flame, MessageCircle,
} from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { useMemberRegionEvents } from '@/hooks/useEvents';
import { useMemberDetailedAttendance } from '@/hooks/useAttendance';
import { format, parseISO, isFuture, differenceInCalendarDays } from 'date-fns';
import { cn } from '@/lib/utils';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

const actions = [
  { label: 'Give', sub: 'Tithes & offerings', href: '/member/finances', icon: Wallet, tone: 'var(--chart-5)' },
  { label: 'Attendance', sub: 'Your record', href: '/member/attendance', icon: BarChart3, tone: 'var(--chart-6)' },
  { label: 'Bible', sub: 'Read today', href: '/member/bible', icon: Book, tone: 'var(--chart-1)' },
  { label: 'Campaigns', sub: 'Support a cause', href: '/member/fundraising', icon: Heart, tone: 'var(--chart-4)' },
  { label: 'Media', sub: 'Sermons & more', href: '/member/media', icon: Play, tone: 'var(--chart-7)' },
  { label: 'Counseling', sub: 'Talk to someone', href: '/member/counseling', icon: MessageCircle, tone: 'var(--chart-2)' },
];

export default function MemberDashboard() {
  const { profile, userRegion, memberRecord } = useAuth();
  const { data: events, isLoading } = useMemberRegionEvents();
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(); from.setMonth(from.getMonth() - 3);
    return { from, to };
  }, []);
  const { data: att, isLoading: attLoading } = useMemberDetailedAttendance(memberRecord?.id, userRegion?.id, range);

  const upcoming = (events || []).filter((e) => isFuture(parseISO(e.start_datetime))).slice(0, 4);
  const next = upcoming[0];
  const daysToNext = next ? differenceInCalendarDays(parseISO(next.start_datetime), new Date()) : null;
  const rate = Math.round(att?.overall?.rate ?? 0);
  const m = memberRecord as any;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary p-5 text-primary-foreground shadow-regal sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-secondary/40 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-primary-foreground/75">{greeting()},</p>
          <h2 className="mt-0.5 font-heading text-2xl font-bold sm:text-3xl">{profile?.first_name || 'Friend'}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            {m?.member_code && <span className="rounded-full bg-primary-foreground/15 px-3 py-1 font-mono font-semibold">{m.member_code}</span>}
            {userRegion?.name && <span className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-3 py-1"><MapPin className="h-3 w-3" />{userRegion.name}</span>}
            {m?.member_type && <span className="rounded-full bg-primary-foreground px-3 py-1 font-semibold capitalize text-primary">{m.member_type}</span>}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/member/attendance" className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--muted)" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--chart-6)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(rate / 100) * 97.4} 97.4`} />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-foreground">{attLoading ? '…' : `${rate}%`}</span>
            </div>
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Attendance</p><p className="truncate text-sm font-semibold text-foreground">Last 3 months</p></div>
          </div>
        </Link>
        <Link to="/member/events" className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
          <p className="text-xs text-muted-foreground">Next gathering</p>
          {isLoading ? <Skeleton className="mt-2 h-6 w-20" /> : (
            <p className="mt-1 font-heading text-2xl font-bold text-foreground">
              {daysToNext === null ? '—' : daysToNext === 0 ? 'Today' : `${daysToNext}d`}
            </p>
          )}
          <p className="truncate text-xs text-muted-foreground">{next ? format(parseISO(next.start_datetime), 'EEE dd/MM') : 'None scheduled'}</p>
        </Link>
        <Link to="/member/attendance" className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3.5 w-3.5" style={{ color: 'var(--chart-3)' }} />Streak</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">{attLoading ? '…' : att?.streak ?? 0}</p>
          <p className="text-xs text-muted-foreground">in a row</p>
        </Link>
        <Link to="/member/discipleship" className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50">
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" style={{ color: 'var(--chart-2)' }} />DCG meetings</p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground">{attLoading ? '…' : att?.dcg?.attended ?? 0}</p>
          <p className="text-xs text-muted-foreground">attended</p>
        </Link>
      </section>

      {/* Upcoming events */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-foreground">Upcoming events</h3>
          <Button asChild variant="ghost" size="sm"><Link to="/member/events">View all <ChevronRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
        ) : upcoming.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((e) => {
              const d = parseISO(e.start_datetime);
              return (
                <Link key={e.id} to={`/events/${(e as any).slug || e.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-semibold uppercase">{format(d, 'MMM')}</span>
                    <span className="font-heading text-xl font-bold leading-none">{format(d, 'dd')}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3 shrink-0" />{format(d, 'EEE, h:mm a')}</p>
                    {e.location_name && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{e.location_name}</span></p>}
                  </div>
                  {e.category && <Badge variant="secondary" className="hidden shrink-0 text-[10px] sm:inline-flex">{e.category}</Badge>}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
            <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" /><p className="text-sm">No upcoming events</p>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h3 className="mb-3 font-heading text-lg font-semibold text-foreground">Quick actions</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {actions.map((a) => (
            <Link key={a.href} to={a.href} className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
              <span className="grid h-11 w-11 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${a.tone} 15%, transparent)`, color: a.tone }}>
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold text-foreground">{a.label}</span>
              <span className={cn('hidden text-[11px] text-muted-foreground md:block')}>{a.sub}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
