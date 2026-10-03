import { useMemo, useState } from 'react';
import { Play, Pause, Headphones, Video, FileText, Bookmark, BookmarkCheck, Search, X, RotateCcw, RotateCw, Clock, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Panel, Segmented, EmptyState } from '@/components/member/MemberUI';
import { mediaItems, mediaCategories, toneVar, type MediaItem, type MediaKind } from '@/data/memberDemo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const kindIcon = { video: Video, audio: Headphones, notes: FileText } as const;
const kindLabel = { video: 'Video', audio: 'Audio', notes: 'Notes' } as const;

function Cover({ item, className }: { item: MediaItem; className?: string }) {
  const Icon = kindIcon[item.kind];
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}
      style={{ background: `linear-gradient(135deg, ${toneVar(item.tone)}, color-mix(in oklab, ${toneVar(item.tone)} 35%, var(--background)))` }}>
      <Icon className="absolute -bottom-3 -right-3 h-20 w-20 text-primary-foreground/20" />
      <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">{item.series}</span>
    </div>
  );
}

export default function MemberMedia() {
  const [kind, setKind] = useState<'all' | MediaKind | 'saved'>('all');
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const [saved, setSaved] = useState<string[]>(['m4']);
  const [open, setOpen] = useState<MediaItem | null>(null);
  const [playing, setPlaying] = useState<MediaItem | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(18);
  const [speed, setSpeed] = useState(1);

  const featured = mediaItems.find((m) => m.featured)!;
  const series = useMemo(() => {
    const map = new Map<string, MediaItem[]>();
    mediaItems.forEach((m) => map.set(m.series, [...(map.get(m.series) ?? []), m]));
    return [...map.entries()];
  }, []);

  const list = mediaItems.filter((m) =>
    (kind === 'all' || (kind === 'saved' ? saved.includes(m.id) : m.kind === kind)) &&
    (cat === 'all' || m.category === cat) &&
    (!q || `${m.title} ${m.speaker} ${m.series}`.toLowerCase().includes(q.toLowerCase())));

  const toggleSave = (id: string) => setSaved((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const play = (m: MediaItem) => { setPlaying(m); setPaused(false); setProgress(0); setOpen(null); };

  return (
    <div className={cn('space-y-6', playing && 'pb-24 md:pb-20')}>
      {/* Featured */}
      <section className="grid overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[1.2fr_1fr]">
        <Cover item={featured} className="min-h-48 rounded-none md:min-h-64" />
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-7">
          <Badge variant="secondary" className="w-fit">Latest message</Badge>
          <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">{featured.title}</h2>
          <p className="text-sm text-muted-foreground">{featured.summary}</p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><span>{featured.speaker}</span>·<span>{featured.date}</span>·<Clock className="h-3 w-3" />{featured.minutes} min</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => play(featured)}><Play className="mr-1 h-4 w-4" />Watch now</Button>
            <Button variant="outline" onClick={() => toggleSave(featured.id)}>
              {saved.includes(featured.id) ? <BookmarkCheck className="mr-1 h-4 w-4" /> : <Bookmark className="mr-1 h-4 w-4" />}Save
            </Button>
          </div>
        </div>
      </section>

      {/* Series */}
      <Panel title="Teaching series">
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {series.map(([name, items]) => (
            <button key={name} onClick={() => { setQ(name); setKind('all'); setCat('all'); }}
              className="w-44 shrink-0 text-left transition-transform hover:-translate-y-0.5">
              <Cover item={items[0]} className="h-24" />
              <p className="mt-2 truncate text-sm font-medium text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">{items.length} {items.length > 1 ? 'episodes' : 'episode'}</p>
            </button>
          ))}
        </div>
      </Panel>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented value={kind} onChange={setKind} options={[
            { value: 'all', label: 'All' }, { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' },
            { value: 'notes', label: 'Notes' }, { value: 'saved', label: `Saved (${saved.length})` }]} />
          <div className="relative lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages, speakers…" className="rounded-full pl-9" />
          </div>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {['all', ...mediaCategories].map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={cn('whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                cat === c ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground')}>
              {c === 'all' ? 'All categories' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <EmptyState icon={Search} title="No messages found" hint="Try another filter or search term."
          action={<Button variant="outline" size="sm" onClick={() => { setQ(''); setCat('all'); setKind('all'); }}>Reset filters</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((m) => {
            const Icon = kindIcon[m.kind];
            return (
              <article key={m.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg">
                <button className="relative block w-full" onClick={() => setOpen(m)}>
                  <Cover item={m} className="h-36 rounded-none" />
                  <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-background/90 text-primary shadow"><Play className="h-5 w-5" /></span>
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-background/85 px-1.5 py-0.5 text-[11px] text-foreground">{m.minutes} min</span>
                </button>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => setOpen(m)} className="line-clamp-2 text-left font-medium text-foreground hover:text-primary">{m.title}</button>
                    <button aria-label="Save" onClick={() => toggleSave(m.id)} className="shrink-0 text-muted-foreground hover:text-primary">
                      {saved.includes(m.id) ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.speaker} · {m.date}</p>
                  <Badge variant="outline" className="gap-1 text-[11px]"><Icon className="h-3 w-3" />{kindLabel[m.kind]}</Badge>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Details */}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          {open && (<>
            <Cover item={open} className="h-40" />
            <DialogHeader>
              <DialogTitle>{open.title}</DialogTitle>
              <DialogDescription>{open.speaker} · {open.date} · {open.minutes} min</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{open.summary}</p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => play(open)}><Play className="mr-1 h-4 w-4" />{open.kind === 'notes' ? 'Open notes' : 'Play'}</Button>
              <Button variant="outline" onClick={() => toast.success('Study notes download will be available soon')}><Download className="mr-1 h-4 w-4" />Notes</Button>
              <Button variant="ghost" onClick={() => toggleSave(open.id)}>{saved.includes(open.id) ? 'Saved' : 'Save'}</Button>
            </div>
          </>)}
        </DialogContent>
      </Dialog>

      {/* Mini player */}
      {playing && (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-4 md:left-auto md:right-6 md:w-[26rem] md:px-0">
          <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <Cover item={playing} className="h-11 w-11 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{playing.title}</p>
                <p className="truncate text-xs text-muted-foreground">{playing.speaker}</p>
              </div>
              <button aria-label="Close player" onClick={() => setPlaying(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" aria-label="Progress" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{Math.round(playing.minutes * progress / 100)}:00 / {playing.minutes}:00</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => setProgress((p) => Math.max(0, p - 3))}><RotateCcw className="h-4 w-4" /></Button>
                <Button size="icon" className="rounded-full" onClick={() => setPaused((p) => !p)}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</Button>
                <Button size="icon" variant="ghost" onClick={() => setProgress((p) => Math.min(100, p + 3))}><RotateCw className="h-4 w-4" /></Button>
              </div>
              <button onClick={() => setSpeed((s) => s >= 2 ? 1 : s + 0.5)} className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">{speed}x</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
