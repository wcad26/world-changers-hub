import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye, EyeOff, ExternalLink, ImagePlus, Loader2, Newspaper, Pencil, Plus, Search, Sparkles, Star, Trash2, Link2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { NEWS_CATEGORIES, type NewsArticle, type NewsInput, uploadNewsImage, useAdminNews, useDeleteNews, useSaveNews } from '@/hooks/useNewsArticles';

type Props = {
  /** Region id for regional admins, or 'all' for super admins. */
  scope: string | undefined;
  /** Super admins can pick a target region (or Global). */
  regions?: { id: string; name: string }[];
};

const empty = (regionId: string | null): NewsInput => ({
  title: '', summary: '', content: '', image_url: '', external_url: '', category: 'News', region_id: regionId,
  author_name: '', is_featured: false, is_published: true, published_at: new Date().toISOString(),
});

export function NewsManager({ scope, regions }: Props) {
  const isSuper = scope === 'all';
  const { data: items = [], isLoading } = useAdminNews(scope);
  const del = useDeleteNews();
  const save = useSaveNews();
  const [editing, setEditing] = useState<NewsInput | null>(null);
  const [toDelete, setToDelete] = useState<NewsArticle | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'external'>('all');

  const stats = useMemo(() => ({
    total: items.length,
    published: items.filter((i) => i.is_published).length,
    featured: items.filter((i) => i.is_featured).length,
    external: items.filter((i) => i.external_url).length,
  }), [items]);

  const shown = items.filter((i) => {
    if (filter === 'published' && !i.is_published) return false;
    if (filter === 'draft' && i.is_published) return false;
    if (filter === 'external' && !i.external_url) return false;
    return `${i.title} ${i.summary}`.toLowerCase().includes(q.toLowerCase());
  });

  const quickToggle = (i: NewsArticle, patch: Partial<NewsInput>) => {
    const { regions: _r, slug: _s, created_at: _c, ...rest } = i;
    toast.promise(save.mutateAsync({ ...rest, ...patch }), { loading: 'Updating…', success: 'Updated', error: (e) => e.message });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'All stories', value: stats.total, icon: Newspaper },
          { label: 'Published', value: stats.published, icon: Eye },
          { label: 'Featured', value: stats.featured, icon: Star },
          { label: 'External links', value: stats.external, icon: Link2 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><s.icon className="h-3.5 w-3.5" /></span>{s.label}</div>
            <p className="mt-2 font-heading text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/70 p-3 backdrop-blur md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stories" className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0" /></div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'published', 'draft', 'external'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors', filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>{f}</button>
          ))}
        </div>
        <Button onClick={() => setEditing(empty(isSuper ? null : scope ?? null))} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95"><Plus />New story</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary"><Newspaper className="h-6 w-6" /></span>
          <p className="mt-4 font-heading font-semibold">No stories yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Publish your first story — it appears on the homepage under Upcoming Events.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((i) => (
            <article key={i.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-regal">
              <div className="relative aspect-[16/9] bg-muted">
                {i.image_url ? <img src={i.image_url} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-primary/20 to-secondary/20"><Newspaper className="h-8 w-8 text-muted-foreground" /></div>}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur', i.is_published ? 'bg-secondary/90 text-secondary-foreground' : 'bg-background/85 text-foreground')}>{i.is_published ? 'Published' : 'Draft'}</span>
                  {i.is_featured && <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">Featured</span>}
                  {i.external_url && <span className="rounded-full bg-background/85 px-2.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur">External</span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-semibold uppercase text-secondary">{i.category} · {i.regions?.name ?? 'Global'}</p>
                <h3 className="mt-1 line-clamp-2 font-heading font-semibold">{i.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.summary}</p>
                <p className="mt-2 text-xs text-muted-foreground">{format(new Date(i.published_at), 'dd/MM/yyyy')}</p>
                <div className="mt-auto flex items-center gap-1 pt-3">
                  <Button size="sm" variant="ghost" onClick={() => { const { regions: _r, slug: _s, created_at: _c, ...rest } = i; setEditing(rest); }}><Pencil />Edit</Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={i.is_published ? 'Unpublish' : 'Publish'} onClick={() => quickToggle(i, { is_published: !i.is_published })}>{i.is_published ? <EyeOff /> : <Eye />}</Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Toggle featured" onClick={() => quickToggle(i, { is_featured: !i.is_featured })}><Star className={cn(i.is_featured && 'fill-primary text-primary')} /></Button>
                  {i.external_url && <Button asChild size="icon" variant="ghost" className="h-8 w-8"><a href={i.external_url} target="_blank" rel="noopener noreferrer" aria-label="Open link"><ExternalLink /></a></Button>}
                  <Button size="icon" variant="ghost" className="ml-auto h-8 w-8 text-destructive hover:text-destructive" aria-label="Delete" onClick={() => setToDelete(i)}><Trash2 /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <NewsEditor value={editing} onClose={() => setEditing(null)} regions={isSuper ? regions : undefined} />}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this story?</AlertDialogTitle><AlertDialogDescription>"{toDelete?.title}" will be removed from the website permanently.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => toDelete && toast.promise(del.mutateAsync(toDelete.id), { loading: 'Deleting…', success: 'Story deleted', error: (e) => e.message })}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NewsEditor({ value, onClose, regions }: { value: NewsInput; onClose: () => void; regions?: { id: string; name: string }[] }) {
  const [v, setV] = useState<NewsInput>(value);
  const [mode, setMode] = useState<'internal' | 'external'>(value.external_url ? 'external' : 'internal');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useSaveNews();
  const set = <K extends keyof NewsInput>(k: K, val: NewsInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const onFile = async (f?: File) => {
    if (!f) return;
    setUploading(true);
    try { set('image_url', await uploadNewsImage(f)); toast.success('Image uploaded'); }
    catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (v.title.trim().length < 3) return toast.error('Please add a title (at least 3 characters).');
    if (v.summary.trim().length < 10) return toast.error('Please add a short description (at least 10 characters).');
    if (!v.image_url) return toast.error('Please add a cover image.');
    if (mode === 'external' && !/^https?:\/\/\S+\.\S+/.test(v.external_url ?? '')) return toast.error('Please enter a valid website link starting with https://');
    if (mode === 'internal' && !(v.content ?? '').trim()) return toast.error('Please write the story content.');
    try {
      await save.mutateAsync({ ...v, external_url: mode === 'external' ? v.external_url : null, content: mode === 'internal' ? v.content : null });
      toast.success(v.id ? 'Story updated' : v.is_published ? 'Story published' : 'Draft saved');
      onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-1.5rem)] max-w-5xl overflow-hidden border-border/60 bg-card/95 p-0 backdrop-blur-xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary px-6 py-5 text-primary-foreground">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground/15"><Sparkles className="h-5 w-5" /></span>
            <div><DialogTitle className="text-lg text-primary-foreground">{v.id ? 'Edit story' : 'New story'}</DialogTitle><DialogDescription className="text-primary-foreground/80">Shown on the homepage and the News page.</DialogDescription></div>
          </div>
        </div>

        <div className="grid max-h-[calc(90vh-9rem)] overflow-y-auto lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 p-6">
            <button type="button" onClick={() => fileRef.current?.click()} className="group relative grid aspect-[16/7] w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary/50">
              {v.image_url ? <img src={v.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
              <span className={cn('relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', v.image_url ? 'bg-background/85 opacity-0 backdrop-blur group-hover:opacity-100' : 'text-muted-foreground')}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{v.image_url ? 'Change cover image' : 'Upload cover image (max 5 MB)'}
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

            <div className="space-y-1.5"><Label>Title</Label><Input value={v.title} onChange={(e) => set('title', e.target.value)} maxLength={140} placeholder="e.g. Douala Annual Retreat draws record attendance" /></div>
            <div className="space-y-1.5"><Label>Short description</Label><Textarea value={v.summary} onChange={(e) => set('summary', e.target.value)} maxLength={280} rows={2} placeholder="One or two sentences shown on the card" /><p className="text-right text-[11px] text-muted-foreground">{v.summary.length}/280</p></div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={v.category} onValueChange={(c) => set('category', c)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{NEWS_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
              {regions ? (
                <div className="space-y-1.5"><Label>Region</Label>
                  <Select value={v.region_id ?? 'global'} onValueChange={(r) => set('region_id', r === 'global' ? null : r)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="global">Global (all regions)</SelectItem>{regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
                </div>
              ) : (
                <div className="space-y-1.5"><Label>Author (optional)</Label><Input value={v.author_name ?? ''} onChange={(e) => set('author_name', e.target.value)} placeholder="e.g. Media Team" /></div>
              )}
            </div>
            {regions && <div className="space-y-1.5"><Label>Author (optional)</Label><Input value={v.author_name ?? ''} onChange={(e) => set('author_name', e.target.value)} placeholder="e.g. Media Team" /></div>}

            <div className="space-y-2">
              <Label>Where is the full story?</Label>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
                {([['internal', 'Write it here', FileText], ['external', 'Another website', Link2]] as const).map(([m, label, Icon]) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={cn('flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all', mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}><Icon className="h-4 w-4" />{label}</button>
                ))}
              </div>
              {mode === 'external'
                ? <Input value={v.external_url ?? ''} onChange={(e) => set('external_url', e.target.value)} placeholder="https://example.com/the-story" inputMode="url" />
                : <Textarea value={v.content ?? ''} onChange={(e) => set('content', e.target.value)} rows={8} placeholder="Write the full story. Leave a blank line between paragraphs." />}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>Publish date</Label><Input type="date" value={v.published_at.slice(0, 10)} onChange={(e) => e.target.value && set('published_at', new Date(`${e.target.value}T08:00:00`).toISOString())} /></div>
              <label className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 sm:mt-6"><span className="text-sm font-medium">Published</span><Switch checked={v.is_published} onCheckedChange={(c) => set('is_published', c)} /></label>
              <label className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2 sm:mt-6"><span className="text-sm font-medium">Featured</span><Switch checked={v.is_featured} onCheckedChange={(c) => set('is_featured', c)} /></label>
            </div>
          </div>

          <aside className="border-t border-border bg-muted/30 p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Live preview</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="aspect-[16/10] bg-muted">{v.image_url ? <img src={v.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-gradient-to-br from-primary/20 to-secondary/20"><Newspaper className="h-8 w-8 text-muted-foreground" /></div>}</div>
              <div className="p-4">
                <p className="text-[11px] font-semibold uppercase text-secondary">{v.category} · {regions ? (regions.find((r) => r.id === v.region_id)?.name ?? 'Global') : 'Your region'}</p>
                <h4 className="mt-1 font-heading font-semibold">{v.title || 'Your story title'}</h4>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{v.summary || 'Your short description will appear here.'}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">{mode === 'external' ? <>Read on source website <ExternalLink className="h-3.5 w-3.5" /></> : 'Read story →'}</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending || uploading} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-regal hover:opacity-95">
            {save.isPending && <Loader2 className="animate-spin" />}{v.id ? 'Save changes' : v.is_published ? 'Publish story' : 'Save draft'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
