import { useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Eye, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/lib/router-compat';
import { useMediaFeed, VideoRow } from './Media';
import { useSavedVideos } from '@/components/member/useSavedVideos';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MemberMediaVideo({ videoId }: { videoId: string }) {
  const { data, isLoading } = useMediaFeed();
  const { saved, toggle } = useSavedVideos();
  const [more, setMore] = useState(false);
  const video = data?.videos.find((v) => v.id === videoId);
  const upNext = (data?.videos ?? []).filter((v) => v.id !== videoId).slice(0, 8);
  const isSaved = saved.includes(videoId);

  const share = async () => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      if (navigator.share) await navigator.share({ title: video?.title, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="space-y-5 pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:space-y-0 lg:pb-6">
      <div className="space-y-4">
        <Link to="/member/media" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All media</Link>
        <div className="overflow-hidden rounded-2xl bg-foreground shadow-regal">
          <div className="relative aspect-video">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={video?.title || 'Video player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        {isLoading ? <Skeleton className="h-20 rounded-2xl" /> : (
          <section className="space-y-3">
            <h1 className="font-heading text-xl font-bold leading-snug text-foreground sm:text-2xl">{video?.title || 'Message'}</h1>
            {video && (
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{format(new Date(video.published), 'dd/MM/yyyy')}</span>
                {video.views > 0 && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{video.views.toLocaleString('en-US')} views</span>}
              </p>
            )}
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              <Button variant="outline" onClick={() => toggle(videoId)} className={cn('rounded-full', isSaved && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground')}>
                {isSaved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}{isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" onClick={share} className="rounded-full"><Share2 className="mr-2 h-4 w-4" />Share</Button>
            </div>
            {video?.description && (
              <button type="button" onClick={() => setMore((m) => !m)} className="w-full rounded-2xl bg-muted/60 p-4 text-left">
                <p className={cn('whitespace-pre-line text-sm text-foreground', !more && 'line-clamp-3')}>{video.description}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">{more ? 'Show less' : 'Show more'}<ChevronDown className={cn('h-3.5 w-3.5 transition-transform', more && 'rotate-180')} /></span>
              </button>
            )}
          </section>
        )}
      </div>

      {upNext.length > 0 && (
        <aside className="lg:pt-9">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Up next</p>
          <div className="space-y-1">{upNext.map((v) => <VideoRow key={v.id} v={v} />)}</div>
        </aside>
      )}
    </div>
  );
}
