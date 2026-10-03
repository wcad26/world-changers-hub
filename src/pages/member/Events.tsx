import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Search, Users, ArrowUpRight } from 'lucide-react';
import { useMemberRegionEvents } from '@/hooks/useEvents';
import { format, parseISO, isFuture, isPast, isToday } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/lib/router-compat';
import { EmptyState, Segmented } from '@/components/member/MemberUI';
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented value={tab} onChange={setTab} options={[
          { value: 'upcoming', label: `Upcoming (${groups.upcoming.length})` },
          { value: 'today', label: `Today (${groups.today.length})` },
          { value: 'past', label: `Past (${groups.past.length})` },
        ]} />
        <div className="relative lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search events or places…" value={q} onChange={(e) => setQ(e.target.value)} className="h-10 rounded-full pl-10" />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {['all', ...categories].map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={cn('whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                category === c ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>
              {c === 'all' ? 'All categories' : c}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState icon={Calendar} title={tab === 'today' ? 'No events today' : tab === 'past' ? 'No past events' : 'No upcoming events'} hint="Check back soon for new gatherings." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => {
            const d = parseISO(e.start_datetime);
            return (
              <article key={e.id} className={cn('group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg', tab === 'past' && 'opacity-90')}>
                <div className="relative h-36 bg-gradient-to-br from-primary to-secondary">
                  {e.image_url && <img src={e.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg bg-card px-2.5 py-1 text-center shadow">
                    <span className="text-[10px] font-semibold uppercase text-primary">{format(d, 'MMM')}</span>
                    <span className="font-heading text-lg font-bold leading-none text-foreground">{format(d, 'dd')}</span>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-1">
                    {e.is_featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
                    {e.category && <Badge variant="secondary">{e.category}</Badge>}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <h3 className="line-clamp-2 font-heading font-semibold text-foreground">{e.name}</h3>
                    {e.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>}
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0" />{format(d, 'EEE dd/MM/yyyy · h:mm a')}{e.end_datetime && ` – ${format(parseISO(e.end_datetime), 'h:mm a')}`}</p>
                    {e.location_name && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{e.location_name}</span></p>}
                    {e.capacity && <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 shrink-0" />Capacity {e.capacity}</p>}
                  </div>
                  <Button asChild variant={tab === 'past' ? 'outline' : 'default'} size="sm" className="mt-auto w-full">
                    <Link to={`/events/${e.slug || e.id}`}>View details <ArrowUpRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
