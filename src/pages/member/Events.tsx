import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Search, Users, ArrowUpRight } from 'lucide-react';
import { useMemberRegionEvents } from '@/hooks/useEvents';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/lib/router-compat';
import { EmptyState } from '@/components/member/MemberUI';
import { cn } from '@/lib/utils';

type Tab = 'upcoming' | 'today' | 'past';

export default function MemberEvents() {
  const { data: events, isLoading } = useMemberRegionEvents();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [category, setCategory] = useState<string>('all');

  const all = events || [];
  const categories = Array.from(new Set(all.map((e: any) => e.category).filter(Boolean))) as string[];
  const filtered = all.filter((e: any) => {
    const s = q.toLowerCase();
    const matches = e.name.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s) || e.location_name?.toLowerCase().includes(s);
    return matches && (category === 'all' || e.category === category);
  });
  const groups: Record<Tab, any[]> = {
    upcoming: filtered.filter((e) => isFuture(parseISO(e.start_datetime)) && !isToday(parseISO(e.start_datetime))),
    today: filtered.filter((e) => isToday(parseISO(e.start_datetime))),
    past: filtered.filter((e) => isPast(parseISO(e.start_datetime)) && !isToday(parseISO(e.start_datetime))).reverse(),
  };
  const list = groups[tab];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}</div>
      </div>
    );
  }

  const next = groups.today[0] || groups.upcoming[0];
  const showFeatured = tab !== 'past' && !!next && list.some((e) => e.id === next.id);
  const rest = showFeatured ? list.filter((e) => e.id !== next.id) : list;

  return (
    <div className="space-y-4">
      {/* Featured next event */}
      {showFeatured && (() => {
        const d = parseISO(next.start_datetime);
        return (
          <Link to={`/events/${next.slug || next.id}`} className="group relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-5 text-primary-foreground shadow-regal">
            {next.image_url && <img src={next.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-500 group-hover:scale-105" />}
            <div className="relative flex items-start gap-4">
              <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-primary-foreground py-2 text-primary">
                <span className="text-[10px] font-bold uppercase">{format(d, 'MMM')}</span>
                <span className="font-heading text-2xl font-bold leading-none">{format(d, 'dd')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-foreground/75">{isToday(d) ? 'Happening today' : 'Next up'}</p>
                <h3 className="mt-0.5 line-clamp-2 font-heading text-lg font-bold">{next.name}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-primary-foreground/80"><Clock className="h-3.5 w-3.5" />{format(d, 'EEE · h:mm a')}</p>
                {next.location_name && <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-primary-foreground/80"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{next.location_name}</span></p>}
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0" />
            </div>
          </Link>
        );
      })()}

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-muted/50 p-1 sm:inline-grid sm:w-auto">
        {(['upcoming', 'today', 'past'] as Tab[]).map((v) => (
          <button key={v} type="button" onClick={() => setTab(v)}
            className={cn('flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold capitalize transition-all',
              tab === v ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {v}
            <span className={cn('grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px]', tab === v ? 'bg-primary-foreground/20' : 'bg-background')}>{groups[v].length}</span>
          </button>
        ))}
      </div>

      {/* Search + categories */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search events…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 rounded-full border-border bg-card pl-10" />
        </div>
        {categories.length > 0 && (
          <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {['all', ...categories].map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={cn('whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  category === c ? 'bg-secondary text-secondary-foreground' : 'bg-muted/60 text-muted-foreground hover:text-foreground')}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        )}
      </div>

      {rest.length === 0 ? (
        list.length === 0 && <EmptyState icon={Calendar} title={tab === 'today' ? 'No events today' : tab === 'past' ? 'No past events' : 'No upcoming events'} hint="Check back soon for new gatherings." />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border md:grid md:grid-cols-2 md:gap-3 md:divide-y-0 md:overflow-visible md:border-0 md:bg-transparent xl:grid-cols-3">
          {rest.map((e) => {
            const d = parseISO(e.start_datetime);
            return (
              <li key={e.id} className="md:rounded-2xl md:border md:border-border md:bg-card">
                <Link to={`/events/${e.slug || e.id}`} className={cn('flex items-center gap-3 p-3 transition-colors hover:bg-muted/40 md:rounded-2xl', tab === 'past' && 'opacity-80')}>
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary">
                    {e.image_url && <img src={e.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/35 text-background">
                      <span className="text-[9px] font-bold uppercase leading-none">{format(d, 'MMM')}</span>
                      <span className="font-heading text-lg font-bold leading-none">{format(d, 'dd')}</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{format(d, 'EEE · h:mm a')}{e.location_name ? ` · ${e.location_name}` : ''}</p>
                    {e.category && <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{e.category}</span>}
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
