import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Play, Search, Youtube, Bookmark, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/router-compat';
import { EmptyState } from '@/components/member/MemberUI';
import { getMediaFeed, type MediaVideo } from '@/lib/media.functions';
import { useSavedVideos } from '@/components/member/useSavedVideos';
import { demoMediaVideos, mediaCategories } from '@/data/memberDemo';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const mediaFeedKey = ['member-media-feed'] as const;

export function useMediaFeed() {
  const fetchFeed = useServerFn(getMediaFeed);
  return useQuery({ queryKey: mediaFeedKey, queryFn: () => fetchFeed(), staleTime: 10 * 60_000 });
}

const views = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k views` : `${n} views`;

export function VideoRow({ v }: { v: MediaVideo }) {
  return (
    <Link to={`/member/media/${v.id}`} className="group flex gap-3 rounded-2xl p-2 transition-colors hover:bg-muted/60">
      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-44">
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

  const [category, setCategory] = useState('all');
  const videos = data?.configured ? data.videos : demoMediaVideos;
  const categories = [...mediaCategories, 'Other'];
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return videos.filter((v) => {
      const text = `${v.title} ${v.description}`.toLowerCase();
      const videoCategory = mediaCategories.find((c) => text.includes(c.toLowerCase())) ?? 'Other';
      return (tab !== 'saved' || saved.includes(v.id))
        && (category === 'all' || videoCategory === category)
        && (!t || text.includes(t));
    });
  }, [videos, saved, tab, q, category]);

  if (isLoading) return <div className="space-y-4 pb-24"><Skeleton className="aspect-video w-full rounded-2xl" /><Skeleton className="h-10 rounded-full" />{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  if (error) return <EmptyState icon={Youtube} title="Videos could not load" hint="Please check your connection and try again." />;

  return (
    <div className="space-y-5 overflow-x-clip pb-24 lg:pb-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search videos" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos" className="h-12 w-full rounded-full pl-11" />
        </div>
        <Button size="icon" variant={tab === 'saved' ? 'default' : 'outline'} className="h-12 w-12 shrink-0 rounded-full" aria-label={tab === 'saved' ? 'Show all videos' : 'Show saved videos'} aria-pressed={tab === 'saved'} title={tab === 'saved' ? 'Show all videos' : 'Saved videos'} onClick={() => setTab((current) => current === 'saved' ? 'latest' : 'saved')}>
          <Bookmark className={tab === 'saved' ? 'fill-current' : ''} />
        </Button>
      </div>

      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 className="min-w-0 font-heading text-base font-semibold">{tab === 'saved' ? 'Saved videos' : 'Featured videos'}</h2>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter videos" className="h-9 w-44 max-w-[55%] shrink-0 rounded-full text-xs">
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All videos</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {list.length ? (
        <div className="grid gap-1 lg:grid-cols-2">{list.map((v) => <VideoRow key={v.id} v={v} />)}</div>
      ) : (
        <EmptyState icon={tab === 'saved' ? Bookmark : Search} title={tab === 'saved' && !saved.length ? 'No saved videos yet' : 'No videos found'}
          action={tab === 'saved' ? <Button size="sm" onClick={() => { setTab('latest'); setQ(''); setCategory('all'); }}>Browse videos</Button> : undefined} />
      )}
    </div>
  );
}
