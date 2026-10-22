import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Play, Search, Youtube, Clock, Eye, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';
import { EmptyState, Segmented } from '@/components/member/MemberUI';
import { getMediaFeed, type MediaVideo } from '@/lib/media.functions';
import { useSavedVideos } from '@/components/member/useSavedVideos';
import { format } from 'date-fns';

export const mediaFeedKey = ['member-media-feed'] as const;

export function useMediaFeed() {
  const fetchFeed = useServerFn(getMediaFeed);
  return useQuery({ queryKey: mediaFeedKey, queryFn: () => fetchFeed(), staleTime: 10 * 60_000 });
}

const views = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k views` : `${n} views`;

export function VideoRow({ v }: { v: MediaVideo }) {
  return (
    <Link to={`/member/media/${v.id}`} className="group flex gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/60">
      <span className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-44">
        <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute inset-0 grid place-items-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-background/90 opacity-0 shadow transition-opacity group-hover:opacity-100"><Play className="h-4 w-4 fill-primary text-primary" /></span>
        </span>
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{v.title}</span>
        <span className="mt-1 block text-[11px] text-muted-foreground">{format(new Date(v.published), 'dd/MM/yyyy')}</span>
        {v.views > 0 && <span className="block text-[11px] text-muted-foreground">{views(v.views)}</span>}
      </span>
    </Link>
  );
}

export default function MemberMedia() {
  const { data, isLoading, error } = useMediaFeed();
  const { saved } = useSavedVideos();
  const [tab, setTab] = useState<'latest' | 'saved'>('latest');
  const [q, setQ] = useState('');

  const videos = data?.videos ?? [];
  const list = useMemo(() => {
    const base = tab === 'saved' ? videos.filter((v) => saved.includes(v.id)) : videos;
    const t = q.trim().toLowerCase();
    return t ? base.filter((v) => v.title.toLowerCase().includes(t) || v.description.toLowerCase().includes(t)) : base;
  }, [videos, saved, tab, q]);
  const featured = !q && tab === 'latest' ? list[0] : undefined;
  const rest = featured ? list.slice(1) : list;

  if (isLoading) return <div className="space-y-4 pb-24"><Skeleton className="aspect-video w-full rounded-2xl" /><Skeleton className="h-10 rounded-full" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  if (error) return <EmptyState icon={Youtube} title="Videos could not load" hint="Please check your connection and try again." />;
  if (data && !data.configured) return <EmptyState icon={Youtube} title="Media is coming soon" hint="Our YouTube sermons and teachings will appear here." />;

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {featured && (
        <Link to={`/member/media/${featured.id}`} className="group relative block overflow-hidden rounded-2xl bg-muted shadow-regal">
          <img src={featured.thumbnail.replace('hqdefault', 'maxresdefault')} onError={(e) => { e.currentTarget.src = featured.thumbnail; }} alt="" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/20 to-transparent" />
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">Latest message</span>
          <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow-lg transition-transform group-hover:scale-110"><Play className="ml-1 h-7 w-7 fill-primary text-primary" /></span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h2 className="line-clamp-2 font-heading text-lg font-bold text-background sm:text-2xl">{featured.title}</h2>
            <p className="mt-1 flex items-center gap-3 text-xs text-background/80">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(featured.published), 'dd/MM/yyyy')}</span>
              {featured.views > 0 && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{views(featured.views)}</span>}
            </p>
          </div>
        </Link>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<'latest' | 'saved'> value={tab} onChange={setTab} options={[{ value: 'latest', label: 'Latest' }, { value: 'saved', label: `Saved${saved.length ? ` (${saved.length})` : ''}` }]} />
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className="h-11 rounded-full pl-9" />
        </div>
      </div>

      {rest.length ? (
        <div className="grid gap-1 lg:grid-cols-2">{rest.map((v) => <VideoRow key={v.id} v={v} />)}</div>
      ) : !featured && (
        <EmptyState icon={tab === 'saved' ? Bookmark : Search} title={tab === 'saved' ? 'No saved videos yet' : 'No videos found'} hint={tab === 'saved' ? 'Tap Save on any video to keep it here.' : undefined}
          action={tab === 'saved' ? <Button size="sm" onClick={() => setTab('latest')}>Browse videos</Button> : undefined} />
      )}
    </div>
  );
}
